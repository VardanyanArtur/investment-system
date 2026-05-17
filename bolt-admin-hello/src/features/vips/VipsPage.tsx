import { useState } from "react";
import { Button, Card } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";
import { SearchBar } from "../../components/SearchBar";
import { VipTable } from "./VipTable";
import { VipFormModal } from "./VipFormModal";
import { useVipsTable, useDeleteVip } from "./hooks";
import { exportToCSV } from "../../utils/table";
import type { VipPlan } from "../../types/domain";

export const VipsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVip, setSelectedVip] = useState<VipPlan | null>(null);

  const { data, isLoading } = useVipsTable({
    search,
    page,
    limit: pageSize,
  });

  const { mutate: deleteVip } = useDeleteVip();

  const handleEdit = (vip: VipPlan) => {
    setSelectedVip(vip);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedVip(null);
    setModalOpen(true);
  };

  const handleDelete = (vipId: string) => {
    deleteVip(vipId);
  };

  const handleExport = () => {
    if (data?.data) {
      const exportData = data.data.map((vip) => ({
        Title: vip.title,
        Min: vip.min,
        Max: vip.max || "Unlimited",
        Daily: vip.daily,
        Cashback: vip.cashback,
        Icon: vip.icon,
        Items: vip.items.join("; "),
        UpdatedAt: vip.updatedAt,
      }));
      exportToCSV(exportData, `vip-plans-${Date.now()}.csv`);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="VIP Plans"
        extra={
          <>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Create VIP Plan
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search VIP plans..." />
      </Card>

      <Card>
        <VipTable
          data={data?.data || []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} plans`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize || 10);
            },
          }}
          onChange={(pagination) => {
            setPage(pagination.current || 1);
            setPageSize(pagination.pageSize || 10);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Card>

      <VipFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedVip(null);
        }}
        vip={selectedVip}
      />
    </div>
  );
};
