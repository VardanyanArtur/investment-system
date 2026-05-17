/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button, Card, Select, Space } from "antd";
import { PlusOutlined, DownloadOutlined } from "@ant-design/icons";
import { PageHeader } from "../../components/PageHeader";
import { SearchBar } from "../../components/SearchBar";
import { DateRangePicker } from "../../components/DateRangePicker";
import { UsersTable } from "./UsersTable";
import { UserDrawer } from "./UserDrawer";
import { CreateUserModal } from "./CreateUserModal";
import { EditUserModal } from "./EditUserModal";
import { AdjustBalanceModal } from "./AdjustBalanceModal";
import { useUsersTable, useDeleteUser } from "./hooks";
import { getTableParams, exportToCSV } from "../../utils/table";
import type { User } from "../../types/domain";
import type { Dayjs } from "dayjs";

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>();
  const [emailVerified, setEmailVerified] = useState<boolean | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading } = useUsersTable({
    search,
    page,
    limit: pageSize,
    sortBy,
    sortDir,
    emailVerified,
    from: dateRange[0]?.format("YYYY-MM-DD"),
    to: dateRange[1]?.format("YYYY-MM-DD"),
  });
  console.log(data);
  

  const { mutate: deleteUser } = useDeleteUser();

  const handleTableChange = (pagination: any, sorter: any) => {
    const params = getTableParams(pagination, sorter);
    setPage(params.page);
    setPageSize(params.limit);
    setSortBy(params.sortBy);
    setSortDir(params.sortDir);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleAdjust = (user: User) => {
    setSelectedUser(user);
    setAdjustModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
  };

  const handleExport = () => {
    if (data?.data) {
      const exportData = data.data.map((user) => ({
        Name: user.name,
        Email: user.email,
        EmailVerified: user.emailVerified ? "Yes" : "No",
        CreatedAt: user.createdAt,
      }));
      exportToCSV(exportData, `users-${Date.now()}.csv`);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Users"
        extra={
          <>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              Create User
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <Space wrap className="w-full">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
          <Select
            placeholder="Email Verified"
            style={{ width: 150 }}
            allowClear
            value={emailVerified}
            onChange={setEmailVerified}
          >
            <Select.Option value={true}>Verified</Select.Option>
            <Select.Option value={false}>Not Verified</Select.Option>
          </Select>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </Space>
      </Card>

      <Card>
        <UsersTable
          data={data?.data || []}
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
          }}
          onChange={handleTableChange}
          onView={handleView}
          onEdit={handleEdit}
          onAdjust={handleAdjust}
          onDelete={handleDelete}
        />
      </Card>

      <CreateUserModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <EditUserModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <AdjustBalanceModal
        open={adjustModalOpen}
        onClose={() => {
          setAdjustModalOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?._id || ""}
      />

      <UserDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?._id || null}
      />
    </div>
  );
};
