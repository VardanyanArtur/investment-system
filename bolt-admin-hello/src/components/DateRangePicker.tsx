import { DatePicker } from "antd";
import type { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface DateRangePickerProps {
  value: [Dayjs | null, Dayjs | null];
  onChange: (dates: [Dayjs | null, Dayjs | null]) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <RangePicker
      value={value}
      onChange={(dates) => onChange(dates as [Dayjs | null, Dayjs | null])}
      className={className}
      format="YYYY-MM-DD"
    />
  );
};
