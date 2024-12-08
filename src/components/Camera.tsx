'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { MdCamera, MdOutlineFlipCameraAndroid } from "react-icons/md";
import { ImSpinner5 } from "react-icons/im";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

function Loading() {
  return <div className="bg-blue-600 bg-opacity-80 flex items-center justify-center text-3xl text-white">
    Loading...
  </div>;
}

function NoDevicesFound() {
  return <div className="bg-red-600 bg-opacity-80 flex items-center justify-center text-3xl">
    <strong>Error:&nbsp;&nbsp;</strong> No devices found!
  </div>
}

function NoAccessGranted() {
  return <div className="bg-red-600 bg-opacity-80 flex items-center justify-center text-3xl">
    <strong>Error:&nbsp;&nbsp;</strong> No access granted!
  </div>
}

export default function Camera(props: { onPhoto: (frame: string) => void }) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | undefined>(undefined);
  const [deviceIndex, setDeviceIndex] = useState<number | undefined>(undefined);
  const [devices, setDevices] = useState<MediaDeviceInfo[] | undefined>(undefined);
  const webcamRef = useRef<Webcam>(null);
  const [videoSettings, setVideoSettings] = useState<MediaTrackSettings | undefined>(undefined);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoMediaDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDevices(videoMediaDevices);
      setDeviceIndex(0)
    },
    [setDevices]
  );

  useEffect(() => {
    (async () => {
      try {
        await (navigator as any).getUserMedia(
          {
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          () => setPermissionGranted(true),
          () => setPermissionGranted(false)
        );

        const devices = await navigator.mediaDevices.enumerateDevices();
        handleDevices(devices)
      } catch (e) {
        setPermissionGranted(false);
        setDevices([]);
      }
    })();
  }, [setPermissionGranted, setDevices, handleDevices]);

  const playHandler = useCallback(() => {
    const settings = webcamRef.current?.stream?.getVideoTracks()[0].getSettings();
    if (settings === undefined) {
      return;
    }
    setVideoSettings(settings)
  }, [setVideoSettings, webcamRef]);

  useEffect(() => {
    playHandler()
  }, [playHandler]);

  const takePhotoHandler = useCallback(() => {
    const frame = webcamRef.current?.getScreenshot() ?? undefined;
    if (frame === undefined) {
      return;
    }
    props.onPhoto(frame);
  }, [props.onPhoto, webcamRef]);

  const switchCameraHandler = useCallback(() => {
    setDeviceIndex(deviceIndex! + 2 > (devices ?? []).length ? 0 : deviceIndex! + 1)
  }, [deviceIndex, setDeviceIndex, devices]);

  if (permissionGranted === false) {
    return <NoAccessGranted />
  }

  if (devices !== undefined && devices.length === 0) {
    return <NoDevicesFound />
  }

  if (devices === undefined || deviceIndex === undefined) {
    return <Loading />
  }

  return <div className="bg-blue-500">
    <Webcam
      onPlay={playHandler}
      className="z-20 w-full h-full"
      style={{
        aspectRatio: videoSettings ? `${videoSettings.width}/${videoSettings.height}` : undefined,
        transform: videoSettings?.facingMode === 'user' ? 'scaleX(-1)' : undefined,
      }}
      ref={webcamRef}
      videoConstraints={{ deviceId: devices[deviceIndex].deviceId }}
    />
    <div className="absolute top-1/2 left-8 w-20 -mt-16 text-center">
      <button
        className=" bg-red-600 border-4 border-white mx-auto rounded-full mb-4 hover:bg-red-500 text-white"
        onClick={takePhotoHandler}
        title="Take photo"
      >
        <MdCamera className="w-14 h-14 m-2" />
      </button>
      {(devices ?? []).length > 1 && <button
        className=" bg-blue-600 border-4 border-white mx-auto rounded-full hover:bg-blue-500 text-white"
        onClick={switchCameraHandler}
        title="Switch camera"
      >
        <MdOutlineFlipCameraAndroid className="w-10 h-10 m-2" />
      </button>}
    </div>
  </div>
}