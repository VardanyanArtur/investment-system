import { Card, Statistic, Row, Col, Skeleton } from "antd";
import {
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { formatMoney, formatNumber } from "../../utils/format";

interface StatsCardsProps {
  totalUsers: number;
  totalDeposited: number;
  totalEarned: number;
  totalGames: number;
  loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalUsers,
  totalDeposited,
  totalEarned,
  totalGames,
  loading,
}) => {
  const cards = [
    {
      title: "Total Users",
      value: totalUsers,
      formatter: formatNumber,
      icon: <UserOutlined className="text-2xl text-blue-500" />,
      color: "bg-blue-50",
    },
    {
      title: "Total Deposited",
      value: totalDeposited,
      formatter: formatMoney,
      icon: <DollarOutlined className="text-2xl text-green-500" />,
      color: "bg-green-50",
    },
    {
      title: "Total Earned",
      value: totalEarned,
      formatter: formatMoney,
      icon: <TrophyOutlined className="text-2xl text-orange-500" />,
      color: "bg-orange-50",
    },
    {
      title: "Total Games",
      value: totalGames,
      formatter: formatNumber,
      icon: <PlayCircleOutlined className="text-2xl text-purple-500" />,
      color: "bg-purple-50",
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card, index) => (
        <Col key={index} xs={24} sm={12} lg={6}>
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <div className="flex items-center justify-between">
                <Statistic
                  title={card.title}
                  value={card.value}
                  formatter={(value) => card.formatter(Number(value))}
                />
                <div className={`p-3 rounded-lg ${card.color}`}>{card.icon}</div>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};
