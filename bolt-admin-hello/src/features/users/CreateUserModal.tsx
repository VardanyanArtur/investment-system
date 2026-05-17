import { Modal, Form, Input, Switch } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateUser } from "./hooks";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  emailVerified: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ open, onClose }) => {
  const { mutate, isPending } = useCreateUser();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      emailVerified: false,
    },
  });

  const onSubmit = (data: FormData) => {
    mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title="Create User"
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Create"
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

        <Form.Item
          label="Password"
          validateStatus={errors.password ? "error" : ""}
          help={errors.password?.message}
          required
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder="Password" />}
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
