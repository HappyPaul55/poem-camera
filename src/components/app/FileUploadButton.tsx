import { useCallback, useRef, useState, type ReactNode } from "react";
import { fileToDataUrl } from "../../lib/app/image";
import { cn } from "../../lib/app/cn";
import { UploadIcon } from "./icons";
import Button from "./ui/Button";

interface Props {
  onPhoto: (frame: string) => void;
  /** When provided, renders a labelled button instead of the toolbar icon. */
  children?: ReactNode;
  className?: string;
  label?: string;
}

/**
 * Read a picture from the device as a JPEG data URL — for when camera access is
 * refused or there is no camera.
 */
export default function FileUploadButton({
  onPhoto,
  children,
  className,
  label = "Upload a photo",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(() => inputRef.current?.click(), []);

  const onChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !file.type.startsWith("image/")) {
        return;
      }

      setLoading(true);
      try {
        onPhoto(await fileToDataUrl(file));
      } catch {
        // Unreadable file — leave the camera as it was.
      } finally {
        setLoading(false);
      }
    },
    [onPhoto],
  );

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      onChange={onChange}
    />
  );

  if (children) {
    return (
      <>
        <Button
          variant="outline"
          className={className}
          onClick={open}
          disabled={loading}
          aria-label={label}
        >
          {loading ? <span className="spinner" /> : children}
        </Button>
        {input}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn("icon-btn", className)}
        onClick={open}
        disabled={loading}
        aria-label={label}
        title={label}
      >
        {loading ? <span className="spinner" /> : <UploadIcon />}
      </button>
      {input}
    </>
  );
}
