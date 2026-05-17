import { Card, Table, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";

interface TopReferrer {
  userId: string;
  name: string;
  referrals: number;
}

interface ChartsProps {
  topReferrers: TopReferrer[];
  loading: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ topReferrers, loading }) => {
  const columns: ColumnsType<TopReferrer> = [
    {
      title: "Rank",
      key: "rank",
      width: 70,
      render: (_, __, index) => (
        <span className="font-semibold text-gray-600">#{index + 1}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Referrals",
      dataIndex: "referrals",
      key: "referrals",
      align: "right",
      render: (referrals) => <span className="font-semibold text-blue-600">{referrals}</span>,
    },
  ];

  return (
    <Card title="Top Referrers" className="mt-4">
      {!loading && (!topReferrers || topReferrers.length === 0) ? (
        <Empty description="No referral data available" />
      ) : (
        <Table
          columns={columns}
          dataSource={topReferrers}
          rowKey="userId"
          loading={loading}
          pagination={false}
          size="small"
        />
      )}
    </Card>
  );
};
