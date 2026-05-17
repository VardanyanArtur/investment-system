import { Modal, Form, InputNumber } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdjustBalance } from "./hooks";
import type { ID } from "../../types/domain";

const schema = z.object({
  depositDelta: z.number().optional(),
  earnedDelta: z.number().optional(),
  referralDelta: z.number().optional(),
  reason: z.string().min(1, "Reason is required"),
});

type FormData = z.infer<typeof schema>;

interface AdjustBalanceModalProps {
  open: boolean;
  onClose: () => void;
  userId: ID;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  open,
  onClose,
  userId,
}) => {
  const { mutate, isPending } = useAdjustBalance(userId);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      depositDelta: 0,
      earnedDelta: 0,
      referralDelta: 0,
      reason: "",
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
      title="Adjust Balance"
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      confirmLoading={isPending}
      okText="Adjust"
      width={500}
    >
      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Deposit Delta"
          help={errors.depositDelta?.message || "Positive to add, negative to subtract"}
        >
          <Controller
            name="depositDelta"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                placeholder="0.00"
                step={0.01}
                precision={2}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Earned Delta"
          help={errors.earnedDelta?.message || "Positive to add, negative to subtract"}
        >
          <Controller
            name="earnedDelta"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                placeholder="0.00"
                step={0.01}
                precision={2}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Referral Delta"
          help={errors.referralDelta?.message || "Positive to add, negative to subtract"}
        >
          <Controller
            name="referralDelta"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: "100%" }}
                placeholder="0.00"
                step={0.01}
                precision={2}
              />
            )}
          />
        </Form.Item>

      </Form>
    </Modal>
  );
};
