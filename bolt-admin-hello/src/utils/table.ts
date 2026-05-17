import type { TablePaginationConfig } from "antd";
import type { SorterResult } from "antd/es/table/interface";

export const getTableParams = (
  pagination: TablePaginationConfig,
  sorter: SorterResult<any> | SorterResult<any>[]
) => {
  const sortInfo = Array.isArray(sorter) ? sorter[0] : sorter;

  return {
    page: pagination.current || 1,
    limit: pagination.pageSize || 10,
    sortBy: sortInfo.field ? String(sortInfo.field) : undefined,
    sortDir: sortInfo.order === "ascend" ? "asc" as const : sortInfo.order === "descend" ? "desc" as const : undefined,
  };
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
