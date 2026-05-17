import { useState } from "react";
import { Card } from "antd";
import { PageHeader } from "../../components/PageHeader";
import { DateRangePicker } from "../../components/DateRangePicker";
import { StatsCards } from "./Cards";
import { Charts } from "./Charts";
import { useSummaryStats } from "./hooks";
import type { Dayjs } from "dayjs";

export const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const { data, isLoading } = useSummaryStats({
    from: dateRange[0]?.format("YYYY-MM-DD"),
    to: dateRange[1]?.format("YYYY-MM-DD"),
  });

  return (
    <div className="p-6">
      <PageHeader title="Dashboard" />

      <Card className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Filter by date:</span>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </Card>

      <StatsCards
        totalUsers={data?.totalUsers || 0}
        totalDeposited={data?.totalDeposited || 0}
        totalEarned={data?.totalEarned || 0}
        totalGames={data?.totalGames || 0}
        loading={isLoading}
      />

      <Charts topReferrers={data?.topReferrers || []} loading={isLoading} />
    </div>
  );
};
