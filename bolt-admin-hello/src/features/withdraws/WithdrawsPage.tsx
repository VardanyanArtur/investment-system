import { useState } from "react";
import { Card, Select, Space } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { SearchBar } from "../../components/SearchBar";
import { DateRangePicker } from "../../components/DateRangePicker";
import { WithdrawsTable } from "./WithdrawsTable";
import { useWithdrawsTable, useApproveWithdraw, useCancelWithdraw } from "./hooks";
import type { Dayjs } from "dayjs";

export const WithdrawsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [status, setStatus] = useState<"pending" | "success" | "canceled" | undefined>();
  const [userSearch, setUserSearch] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const { data, isLoading } = useWithdrawsTable({
    page,
    limit: pageSize,
    status,
    user: userSearch || undefined,
    from: dateRange[0]?.format("YYYY-MM-DD"),
    to: dateRange[1]?.format("YYYY-MM-DD"),
  });

  const { mutate: approveWithdraw, isPending: isApproving } = useApproveWithdraw();
  const { mutate: cancelWithdraw, isPending: isCanceling } = useCancelWithdraw();

  const handleApprove = (withdrawId: string) => {
    approveWithdraw(withdrawId);
  };

  const handleCancel = (withdrawId: string) => {
    cancelWithdraw(withdrawId);
  };

  return (
    <div className="p-6">
      <PageHeader title="Withdraw Requests" />

      <Card className="mb-4">
        <Space wrap className="w-full">
          <SearchBar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="Search by user email or ID..."
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="success">Success</Select.Option>
            <Select.Option value="canceled">Canceled</Select.Option>
          </Select>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </Space>
      </Card>

      <Card>
        <WithdrawsTable
          data={data?.data.items || []}
          loading={isLoading || isApproving || isCanceling}
          pagination={{
            current: page,
            pageSize,
            total: data?.data.pagination.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} withdraw requests`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize || 50);
            },
          }}
          onChange={(pagination) => {
            setPage(pagination.current || 1);
            setPageSize(pagination.pageSize || 50);
          }}
          onApprove={handleApprove}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
};
