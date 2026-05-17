// src/components/CelebrationDialog2.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CelebrationDialog2({
  open,
  onOpenChange,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 {title}</DialogTitle>
          {description ? <DialogDescription className="text-base">{description}</DialogDescription> : null}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
