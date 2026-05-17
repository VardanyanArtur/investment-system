import { Table, Tag, Space, Tooltip } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { Withdraw } from "../../types/domain";
import { formatDateTime, formatMoney } from "../../utils/format";
import { ConfirmButton } from "../../components/ConfirmButton";

interface WithdrawsTableProps {
  data: Withdraw[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onChange: (pagination: TablePaginationConfig) => void;
  onApprove: (withdrawId: string) => void;
  onCancel: (withdrawId: string) => void;
}

export const WithdrawsTable: React.FC<WithdrawsTableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  onApprove,
  onCancel,
}) => {
  const getStatusColor = (status: Withdraw["status"]) => {
    switch (status) {
      case "pending":
        return "orange";
      case "success":
        return "green";
      case "canceled":
        return "red";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<Withdraw> = [
    {
      title: "ID",
      dataIndex: "_id",
      key: "_id",
      width: 100,
      render: (id) => (
        <Tooltip title={id}>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {id.substring(0, 8)}...
          </code>
        </Tooltip>
      ),
    },
    {
      title: "User Name",
      key: "userName",
      render: (_, record) => <span className="font-medium">{record.user.name}</span>,
    },
    {
      title: "User Email",
      key: "userEmail",
      render: (_, record) => <span className="text-gray-600">{record.user.email}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      width: 130,
      render: (amount) => <span className="font-semibold">{formatMoney(amount)}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date) => formatDateTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => {
        const isPending = record.status === "pending";

        if (!isPending) {
          return <span className="text-gray-400">No actions</span>;
        }

        return (
          <Space size="small">
            <ConfirmButton
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              title="Approve Withdraw"
              description="Are you sure you want to approve this withdraw request?"
              onConfirm={() => onApprove(record._id)}
            >
              Approve
            </ConfirmButton>
            <ConfirmButton
              danger
              size="small"
              icon={<CloseOutlined />}
              title="Cancel Withdraw"
              description="Are you sure you want to cancel this withdraw without refund?"
              onConfirm={() => onCancel(record._id)}
            >
              Cancel
            </ConfirmButton>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: 1200 }}
    />
  );
};
