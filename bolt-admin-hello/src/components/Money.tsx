import { formatMoney } from "../utils/format";

interface MoneyProps {
  amount: number;
  showSign?: boolean;
  className?: string;
}

export const Money: React.FC<MoneyProps> = ({ amount, showSign = false, className = "" }) => {
  const formatted = formatMoney(amount);
  const displayValue = showSign && amount > 0 ? `+${formatted}` : formatted;

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
};
