import { useState } from "react";
import Dialog, { DialogFooter } from "./Dialog";
import Button from "./Button";

/**
 * ConfirmDialog — chuẩn cho thao tác phá huỷ.
 *
 *   <ConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Xoá học viên?"
 *     description="Hành động này không thể hoàn tác."
 *     confirmLabel="Xoá"
 *     destructive
 *     onConfirm={async () => { await api.delete(id); }}
 *   />
 */
const ConfirmDialog = ({
  open,
  onOpenChange,
  title = "Bạn có chắc?",
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  destructive = false,
  size = "sm",
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (typeof onConfirm !== "function") {
      onOpenChange?.(false);
      return;
    }
    try {
      setSubmitting(true);
      await onConfirm();
      onOpenChange?.(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      closeOnOverlayClick={!submitting}
    >
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange?.(false)}
          disabled={submitting}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          onClick={handleConfirm}
          loading={submitting}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export { ConfirmDialog };
export default ConfirmDialog;
