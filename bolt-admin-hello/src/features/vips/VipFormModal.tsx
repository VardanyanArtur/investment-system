import { Modal, Form, Input, InputNumber, Button, Space } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useForm, Controller, useFieldArray, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateVip, useUpdateVip } from "./hooks";
import { useEffect } from "react";
import type { VipPlan } from "../../types/domain";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  min: z.number().min(0, "Min must be at least 0"),
  max: z.number().nullable(),
  daily: z.string().min(1, "Daily is required"),
  cashback: z.string().min(1, "Cashback is required"),
  icon: z.string().min(1, "Icon is required"),
  items: z.array(z.string().min(1, "Item cannot be empty")).min(1, "At least one item is required"),
  delay: z.number().min(0, "Delay must be at least 0"),
});

type FormData = z.infer<typeof schema> & FieldValues;

interface VipFormModalProps {
  open: boolean;
  onClose: () => void;
  vip?: VipPlan | null;
}

export const VipFormModal: React.FC<VipFormModalProps> = ({ open, onClose, vip }) => {
  const isEdit = !!vip;
  const { mutate: createVip, isPending: isCreating } = useCreateVip();
  const { mutate: updateVip, isPending: isUpdating } = useUpdateVip();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      min: 0,
      max: null,
      daily: "",
      cashback: "",
      icon: "",
      items: [""],
      delay: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (vip) {
      reset({
        title: vip.title,
        min: vip.min,
        max: vip.max,
        daily: vip.daily,
        cashback: vip.cashback,
        icon: vip.icon,
        items: vip.items,
        delay: vip.delay,
      });
    } else {
      reset({
        title: "",
        min: 0,
        max: null,
        daily: "",
        cashback: "",
        icon: "",
        items: [""],
        delay: 0,
      });
    }
  }, [vip, reset]);

  const onSubmit = (data: FormData) => {
    if (isEdit && vip) {
      updateVip(
        { id: vip._id, data },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createVip(data, {
        onSuccess: () => {
          reset();
          onClose();
        },
      });
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      title={isEdit ? "Edit VIP Plan" : "Create VIP Plan"}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      confirmLoading={isCreating || isUpdating}
      okText={isEdit ? "Save" : "Create"}
      width={600}
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Title"
          validateStatus={errors.title ? "error" : ""}
          help={errors.title?.message}
          required
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Bronze" />}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Min"
            validateStatus={errors.min ? "error" : ""}
            help={errors.min?.message}
            required
          >
            <Controller
              name="min"
              control={control}
              render={({ field }) => (
                <InputNumber {...field} style={{ width: "100%" }} min={0} placeholder="0" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Max"
            validateStatus={errors.max ? "error" : ""}
            help={errors.max?.message || "Leave empty for unlimited"}
          >
            <Controller
              name="max"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Unlimited"
                />
              )}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Daily"
            validateStatus={errors.daily ? "error" : ""}
            help={errors.daily?.message}
            required
          >
            <Controller
              name="daily"
              control={control}
              render={({ field }) => <Input {...field} placeholder="5%" />}
            />
          </Form.Item>

          <Form.Item
            label="Cashback"
            validateStatus={errors.cashback ? "error" : ""}
            help={errors.cashback?.message}
            required
          >
            <Controller
              name="cashback"
              control={control}
              render={({ field }) => <Input {...field} placeholder="10%" />}
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Icon"
          validateStatus={errors.icon ? "error" : ""}
          help={errors.icon?.message}
          required
        >
          <Controller
            name="icon"
            control={control}
            render={({ field }) => <Input {...field} placeholder="trophy" />}
          />
        </Form.Item>

        <Form.Item
          label="Delay"
          validateStatus={errors.delay ? "error" : ""}
          help={errors.delay?.message}
        >
          <Controller
            name="delay"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} style={{ width: "100%" }} min={0} placeholder="0" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Items"
          validateStatus={errors.items ? "error" : ""}
          help={errors.items?.message}
          required
        >
          <Space direction="vertical" className="w-full">
            {fields.map((field, index) => (
              <Space key={field.id} className="w-full">
                <Controller
                  name={`items.${index}`}
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Feature description" style={{ width: 400 }} />
                  )}
                />
                {fields.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(index)}
                  />
                )}
              </Space>
            ))}
            <Button type="dashed" onClick={() => append("")} icon={<PlusOutlined />} block>
              Add Item
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
