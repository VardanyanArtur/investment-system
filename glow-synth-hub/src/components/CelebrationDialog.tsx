// src/components/CelebrationDialog.tsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CelebrationDialog({
  open,
  onOpenChange,
  vipTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vipTitle: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">🎉 Congratulations!</DialogTitle>
          <DialogDescription className="text-base">
            You’ve unlocked <span className="font-semibold text-primary">{vipTitle}</span>.
            Enjoy your new benefits!
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
