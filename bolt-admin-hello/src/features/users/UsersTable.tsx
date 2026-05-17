/* eslint-disable @typescript-eslint/no-explicit-any */
import { Table, Tag, Button, Space } from "antd";
import { EyeOutlined, EditOutlined, DollarOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { User, Wallet } from "../../types/domain";
import { formatDate, formatMoney } from "../../utils/format";
import { ConfirmButton } from "../../components/ConfirmButton";

interface UserWithWallet extends User {
  wallet?: Wallet;
}

interface UsersTableProps {
  data: UserWithWallet[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onChange: (pagination: TablePaginationConfig, filters: any, sorter: any) => void;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onAdjust: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  onView,
  onEdit,
  onAdjust,
  onDelete,
}) => {
  const columns: ColumnsType<UserWithWallet> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "Email Verified",
      dataIndex: "emailVerified",
      key: "emailVerified",
      width: 130,
      render: (verified) =>
        verified ? <Tag color="success">Verified</Tag> : <Tag color="default">Not Verified</Tag>,
    },
    {
      title: "Deposit Balance",
      key: "depositBalance",
      width: 150,
      align: "right",
      render: (_, record) => formatMoney(record.wallet?.depositBalance || 0),
    },
    {
      title: "Earned Balance",
      key: "earnedBalance",
      width: 150,
      align: "right",
      render: (_, record) => formatMoney(record.wallet?.earnedBalance || 0),
    },
    {
      title: "Referral Balance",
      key: "referralBalance",
      width: 150,
      align: "right",
      render: (_, record) => formatMoney(record.wallet?.referralBalance || 0),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onView(record)}>
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => onAdjust(record)}
          >
            Adjust
          </Button>
          <ConfirmButton
            type="link"
            size="small"
            danger
            title="Delete User"
            description="Are you sure you want to delete this user? This action cannot be undone."
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
      scroll={{ x: 1400 }}
    />
  );
};
