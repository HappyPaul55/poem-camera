'use client'

import { useCallback, useState } from "react";
import Camera from "@/components/Camera";
import Settings from "@/components/Settings";
import ConfirmDialog from "@/components/ConfirmDialog";
import Intro from "@/components/Intro";
import PoemDialog from "@/components/PoemDialog";
import usePoem from "@/hooks/usePoem";

export default function Home() {
  const [isBooted, setIsBooted] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const { poem, setFrame, frame } = usePoem();

  const previewConfirmHandler = useCallback(() => {
    setFrame(preview);
    setPreview(undefined);
  }, [preview, setFrame, setPreview]);
  const previewRejectHandler = useCallback(() => {
    setFrame(undefined);
    setPreview(undefined);
  }, [setFrame, setPreview]);

  const peomOnCloseHandler = useCallback(() => {
    setFrame(undefined);
    setPreview(undefined);
  }, [setFrame, setPreview]);

  if (isBooted === false) {
    return <Intro onBooted={() => setIsBooted(true)} />
  }

  return (
    <>
      <main id="main-wrapper" className="z-0">
        <Camera onPhoto={setPreview} />
        {preview && <ConfirmDialog preview={preview} onConfirm={previewConfirmHandler} onReject={previewRejectHandler} />}
        {frame && <PoemDialog onClose={peomOnCloseHandler} poem={poem} />}
      </main>
      <Settings />
    </>
  );
}
