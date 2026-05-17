import { useQuery } from "@tanstack/react-query";
import * as api from "../../api/stats";

export const useSummaryStats = (params: Parameters<typeof api.fetchSummaryStats>[0]) => {
  return useQuery({
    queryKey: ["summaryStats", params],
    queryFn: () => api.fetchSummaryStats(params),
  });
};
