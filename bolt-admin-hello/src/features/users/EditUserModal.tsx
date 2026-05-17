import { Modal, Form, Input, Switch } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateUser } from "./hooks";
import { useEffect } from "react";
import type { User } from "../../types/domain";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  emailVerified: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ open, onClose, user }) => {
  const { mutate, isPending } = useUpdateUser();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: FormData) => {
    if (!user) return;
    mutate(
      { id: user._id, data },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title="Edit User"
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Save"
      width={500}
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Name"
          validateStatus={errors.name ? "error" : ""}
          help={errors.name?.message}
          required
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="John Doe" />}
          />
        </Form.Item>

        <Form.Item
          label="Email"
          validateStatus={errors.email ? "error" : ""}
          help={errors.email?.message}
          required
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} type="email" placeholder="john@example.com" />}
          />
        </Form.Item>

        <Form.Item label="Email Verified">
          <Controller
            name="emailVerified"
            control={control}
            render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
