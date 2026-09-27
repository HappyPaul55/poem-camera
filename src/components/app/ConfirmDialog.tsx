import Dialog from "./ui/Dialog";
import Button from "./ui/Button";

interface Props {
  preview: string;
  onConfirm: () => void;
  onReject: () => void;
}

/** Shown between taking the photo and writing the poem, when previews are on. */
export default function ConfirmDialog({ preview, onConfirm, onReject }: Props) {
  return (
    <Dialog
      onClose={onReject}
      labelId="confirm-title"
      describedById="confirm-desc"
    >
      <h2 id="confirm-title" className="app-dialog__title">
        How does it look?
      </h2>
      <p id="confirm-desc" className="mt-2 text-[0.95rem] text-ink-soft">
        Before we make your poem, just check the photo looks right.
      </p>

      <div className="mt-5">
        <span className="photo-frame">
          <img src={preview} alt="The photo you just captured" />
        </span>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={onReject}>
          Try again
        </Button>
        <Button variant="primary" onClick={onConfirm} autoFocus>
          It looks good!
        </Button>
      </div>
    </Dialog>
  );
}
