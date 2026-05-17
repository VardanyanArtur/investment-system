import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { CSSProperties } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  style,
}) => {
  return (
    <Input
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      allowClear
      className={className}
      style={style || { width: 300 }}
    />
  );
};
