import { Drawer, Tabs, Descriptions, Tag, Table, Button, Typography, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useUserDetails, useUserDeposits, useUserGames, useUserReferrals } from "./hooks";
import type { ID, Transaction, GameEntry, User } from "../../types/domain";
import { formatDate, formatDateTime, formatMoney, formatMoneyTotal } from "../../utils/format";
import  { Dayjs } from "dayjs";
import { DateRangePicker } from "../../components/DateRangePicker";

const { Text } = Typography;

interface UserDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: ID | null;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ open, onClose, userId }) => {
  const { data: user, isLoading: userLoading } = useUserDetails(userId || "");

  const [depositsPage, setDepositsPage] = useState(1);
  const [depositsDateRange, setDepositsDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  const { data: depositsData, isLoading: depositsLoading } = useUserDeposits(userId || "", {
    page: depositsPage,
    limit: 10,
    from: depositsDateRange[0]?.format("YYYY-MM-DD"),
    to: depositsDateRange[1]?.format("YYYY-MM-DD"),
  });
  console.log(depositsData);
  
  const [gamesPage, setGamesPage] = useState(1);
  const [gamesDateRange, setGamesDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const { data: gamesData, isLoading: gamesLoading } = useUserGames(userId || "", {
    page: gamesPage,
    limit: 10,
    from: gamesDateRange[0]?.format("YYYY-MM-DD"),
    to: gamesDateRange[1]?.format("YYYY-MM-DD"),
  });

  const { data: referralsData, isLoading: referralsLoading } = useUserReferrals(userId || "");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard");
  };

  const depositColumns: ColumnsType<Transaction> = [
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => formatDateTime(date),
    },
    {
      title: "Amount",
      dataIndex: "priceAmount",
      key: "amount",
      align: "right",
      render: (priceAmount) => formatMoney(priceAmount)
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors: Record<string, string> = {
          pending: "processing",
          confirmed: "success",
          failed: "error",
          canceled: "default",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Invoice ID",
      key: "paymentId",
      render: (_, record) => {
        console.log(record)
        return record?.paymentId || "-"
      },
    },
  ];

  const gameColumns: ColumnsType<GameEntry> = [
    {
      title: "Played At",
      dataIndex: "playedAt",
      key: "playedAt",
      render: (date) => formatDateTime(date),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title) => title || "-",
    },
    {
      title: "Result",
      dataIndex: "result",
      key: "result",
      render: (result) => result || "-",
    },
  ];

  const referralColumns: ColumnsType<User> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => formatDate(date),
    },
  ];
  console.log(depositsData);
  
  const items = [
    {
      key: "profile",
      label: "Profile",
      children: (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Name">{user?.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
          <Descriptions.Item label="Email Verified">
            {user?.emailVerified ? (
              <Tag color="success">Verified</Tag>
            ) : (
              <Tag color="default">Not Verified</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {user?.createdAt ? formatDate(user.createdAt) : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Deposit Balance">
            {formatMoney(user?.wallet?.depositBalance || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Earned Balance">
            {formatMoney(user?.wallet?.earnedBalance || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Referral Balance">
            {formatMoney(user?.wallet?.referralBalance || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Total Games">{user?.stats?.gamesCount || 0}</Descriptions.Item>
          <Descriptions.Item label="Last Game">
            {user?.stats?.lastGameAt ? formatDateTime(user.stats.lastGameAt) : "Never"}
          </Descriptions.Item>
          <Descriptions.Item label="Total Balance">
            {formatMoneyTotal(user?.wallet?.referralBalance ,  user?.wallet?.earnedBalance ,user?.wallet?.depositBalance || 0)}
          </Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "games",
      label: "Games",
      children: (
        <div>
          <div className="mb-4">
            <DateRangePicker value={gamesDateRange} onChange={setGamesDateRange} />
          </div>
          <Table
            columns={gameColumns}
            dataSource={gamesData?.data || []}
            rowKey="_id"
            loading={gamesLoading}
            pagination={{
              current: gamesPage,
              pageSize: 10,
              total: gamesData?.total || 0,
              onChange: setGamesPage,
            }}
          />
        </div>
      ),
    },
    {
      key: "deposits",
      label: "Deposits",
      children: (
        <div>
          <div className="mb-4">
            <DateRangePicker value={depositsDateRange} onChange={setDepositsDateRange} />
          </div>
          <Table
            columns={depositColumns}
            dataSource={depositsData?.data || []}
            rowKey="_id"
            loading={depositsLoading}
            pagination={{
              current: depositsPage,
              pageSize: 10,
              total: depositsData?.total || 0,
              onChange: setDepositsPage,
            }}
          />
        </div>
      ),
    },
    {
      key: "referrals",
      label: "Referrals",
      children: (
        <div>
          <div className="mb-6">
            <Text strong>Referral Code: </Text>
            <Text code className="text-lg">
              {referralsData?.self?.code}
            </Text>
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(referralsData?.self?.code || "")}
            >
              Copy
            </Button>
          </div>

          <div className="mb-6">
            <Text strong className="text-base">
              Level 1 Referrals ({referralsData?.level1?.length || 0})
            </Text>
            <Table
              columns={referralColumns}
              dataSource={referralsData?.level1 || []}
              rowKey="_id"
              loading={referralsLoading}
              pagination={false}
              className="mt-2"
            />
          </div>

          <div>
            <Text strong className="text-base">
              Level 2 Referrals ({referralsData?.level2?.length || 0})
            </Text>
            <Table
              columns={referralColumns}
              dataSource={referralsData?.level2 || []}
              rowKey="_id"
              loading={referralsLoading}
              pagination={false}
              className="mt-2"
            />
          </div>
        </div>
      ),
    },
    {
      key: "wallet",
      label: "Wallet",
      children: (
        <div>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Wallet ID">{user?.wallet?._id}</Descriptions.Item>
            <Descriptions.Item label="Deposit Balance">
              {formatMoney(user?.wallet?.depositBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Earned Balance">
              {formatMoney(user?.wallet?.earnedBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Referral Balance">
              {formatMoney(user?.wallet?.referralBalance || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {user?.wallet?.updatedAt ? formatDateTime(user.wallet.updatedAt) : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {user?.wallet?.createdAt ? formatDateTime(user.wallet.createdAt) : "-"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title="User Details"
      placement="right"
      onClose={onClose}
      open={open}
      width={800}
      loading={userLoading}
    >
      <Tabs items={items} />
    </Drawer>
  );
};
