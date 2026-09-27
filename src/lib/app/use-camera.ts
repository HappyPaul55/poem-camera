import { useCallback, useEffect, useRef, useState } from "react";
import { videoFrameToDataUrl } from "./image";

export type CameraStatus = "loading" | "ready" | "denied" | "unavailable";

export interface Camera {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  deviceCount: number;
  mirrored: boolean;
  canSwitch: boolean;
  switching: boolean;
  takePhoto: () => string | undefined;
  switchCamera: () => void;
}

/**
 * Camera access without a third-party webcam component: ask for permission,
 * enumerate the video inputs, attach the chosen one to a `<video>`, and pull a
 * JPEG frame off a canvas when the shutter is pressed.
 */
export default function useCamera(): Camera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<CameraStatus>("loading");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [mirrored, setMirrored] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Ask for permission, then enumerate the cameras.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }

      if (cancelled) return;

      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter((item) => item.kind === "videoinput");
        if (videoInputs.length === 0) {
          setStatus("unavailable");
          return;
        }
        setDevices(videoInputs);
        setDeviceIndex(0);
        setStatus("ready");
      } catch {
        setStatus("unavailable");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Attach the selected camera to the <video>.
  useEffect(() => {
    if (status !== "ready" || devices.length === 0) return;

    const device = devices[Math.min(deviceIndex, devices.length - 1)];
    if (!device) return;

    let stream: MediaStream | undefined;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: device.deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }

      const video = videoRef.current;
      if (cancelled || !video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Autoplay can be rejected until the element is visible; ignore and
        // let the next frame show.
      }

      const settings = stream.getVideoTracks()[0]?.getSettings();
      setMirrored(settings?.facingMode === "user");
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, [status, devices, deviceIndex]);

  const takePhoto = useCallback((): string | undefined => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) {
      return undefined;
    }
    try {
      return videoFrameToDataUrl(video);
    } catch {
      return undefined;
    }
  }, []);

  const switchCamera = useCallback(() => {
    if (devices.length < 2) return;
    setSwitching(true);
    window.setTimeout(() => {
      setDeviceIndex((index) => (index + 1) % devices.length);
    }, 200);
    window.setTimeout(() => setSwitching(false), 600);
  }, [devices.length]);

  return {
    videoRef,
    status,
    deviceCount: devices.length,
    mirrored,
    canSwitch: devices.length > 1,
    switching,
    takePhoto,
    switchCamera,
  };
}
