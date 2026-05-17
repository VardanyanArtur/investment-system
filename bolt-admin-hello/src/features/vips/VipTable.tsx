import { Table, Button, Space, Tag } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { VipPlan } from "../../types/domain";
import { formatDateTime } from "../../utils/format";
import { ConfirmButton } from "../../components/ConfirmButton";

interface VipTableProps {
  data: VipPlan[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onChange: (pagination: TablePaginationConfig) => void;
  onEdit: (vip: VipPlan) => void;
  onDelete: (vipId: string) => void;
}

export const VipTable: React.FC<VipTableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  onEdit,
  onDelete,
}) => {
  const columns: ColumnsType<VipPlan> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title) => <span className="font-medium">{title}</span>,
    },
    {
      title: "Min",
      dataIndex: "min",
      key: "min",
      align: "right",
      render: (min) => `$${min.toLocaleString()}`,
    },
    {
      title: "Max",
      dataIndex: "max",
      key: "max",
      align: "right",
      render: (max) => (max !== null ? `$${max.toLocaleString()}` : "—"),
    },
    {
      title: "Daily",
      dataIndex: "daily",
      key: "daily",
      render: (daily) => <Tag color="blue">{daily}</Tag>,
    },
    {
      title: "Cashback",
      dataIndex: "cashback",
      key: "cashback",
      render: (cashback) => <Tag color="green">{cashback}</Tag>,
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      render: (icon) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{icon}</code>,
    },
    {
      title: "Items",
      key: "items",
      width: 100,
      align: "center",
      render: (_, record) => record.items.length,
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => formatDateTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <ConfirmButton
            type="link"
            size="small"
            danger
            title="Delete VIP Plan"
            description="Are you sure you want to delete this VIP plan?"
            onConfirm={() => onDelete(record._id)}
          >
            <DeleteOutlined /> Delete
          </ConfirmButton>
        </Space>
      ),
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
