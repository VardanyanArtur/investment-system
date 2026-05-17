import dayjs from "dayjs";

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatMoneyTotal = (
  amount1: number | undefined,
  amount2: number | undefined,
  amount3: number
): string => {
  const total = (amount1 ?? 0) + (amount2 ?? 0) + (amount3 ?? 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total);
};


export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

export const formatDate = (date: string): string => {
  return dayjs(date).format("MMM D, YYYY");
};

export const formatDateTime = (date: string): string => {
  return dayjs(date).format("MMM D, YYYY HH:mm");
};

export const formatRelativeTime = (date: string): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diff = now.diff(target, "day");

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
  return `${Math.floor(diff / 365)} years ago`;
};
