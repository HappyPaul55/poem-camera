import type { ReactNode } from "react";
import useCamera from "../../lib/app/use-camera";
import { cn } from "../../lib/app/cn";
import { CameraIcon, FlipIcon, UploadIcon } from "./icons";
import FileUploadButton from "./FileUploadButton";

interface Props {
  onPhoto: (frame: string) => void;
}

function StageMessage({
  variant = "info",
  children,
}: {
  variant?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "stage-message",
        variant === "error" ? "stage-message--error" : "stage-message--info",
      )}
    >
      <div className="stage-message__inner">{children}</div>
    </div>
  );
}

function UploadFallback({ onPhoto }: Props) {
  return (
    <FileUploadButton onPhoto={onPhoto} label="Upload a file instead">
      <UploadIcon className="mr-2 inline-block" />
      Upload a file instead
    </FileUploadButton>
  );
}

/** Live camera view with the shutter and camera-switch controls. */
export default function Camera({ onPhoto }: Props) {
  const {
    videoRef,
    status,
    mirrored,
    canSwitch,
    switching,
    takePhoto,
    switchCamera,
  } = useCamera();

  const handleShutter = () => {
    const frame = takePhoto();
    if (frame) {
      onPhoto(frame);
    }
  };

  return (
    <div className="app-stage">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={cn(mirrored && "app-stage__mirror")}
      />

      {(status === "loading" || switching) && (
        <StageMessage>
          <p className="font-mono text-sm font-bold tracking-[0.14em] uppercase">
            Starting camera…
          </p>
        </StageMessage>
      )}

      {status === "denied" && (
        <StageMessage variant="error">
          <strong className="block font-display text-2xl font-bold">
            No access granted
          </strong>
          <p className="mt-2 text-sm">
            You can change this in your browser settings, or upload a picture
            instead.
          </p>
          <div className="mt-5">
            <UploadFallback onPhoto={onPhoto} />
          </div>
        </StageMessage>
      )}

      {status === "unavailable" && (
        <StageMessage variant="error">
          <strong className="block font-display text-2xl font-bold">
            No camera found
          </strong>
          <p className="mt-2 text-sm">
            This device doesn't seem to have a camera. Upload a picture instead
            and it'll be treated exactly like a frame you just shot.
          </p>
          <div className="mt-5">
            <UploadFallback onPhoto={onPhoto} />
          </div>
        </StageMessage>
      )}

      {status === "ready" && !switching && (
        <div className="capture">
          <button
            type="button"
            className="capture__shutter"
            onClick={handleShutter}
            aria-label="Take photo"
            title="Take photo"
          >
            <CameraIcon width={34} height={34} />
          </button>
          {canSwitch && (
            <button
              type="button"
              className="capture__flip"
              onClick={switchCamera}
              aria-label="Switch camera"
              title="Switch camera"
            >
              <FlipIcon width={24} height={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
