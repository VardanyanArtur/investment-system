import { Button, Popconfirm } from "antd";
import type { ButtonProps } from "antd";

interface ConfirmButtonProps extends Omit<ButtonProps, "onClick"> {
  title?: string;
  description?: string;
  onConfirm: () => void;
  children: React.ReactNode;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  onConfirm,
  children,
  ...buttonProps
}) => {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ danger: true }}
    >
      <Button {...buttonProps}>{children}</Button>
    </Popconfirm>
  );
};
