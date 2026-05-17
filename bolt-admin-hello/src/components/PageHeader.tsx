import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  extra?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, extra }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
  );
};
