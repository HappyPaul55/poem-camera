'use client'

import { useCallback, useState } from 'react';
import Camera from '@/components/Camera';
import Settings from '@/components/Settings';
import ConfirmDialog from '@/components/ConfirmDialog';
import Intro from '@/components/Intro';
import PoemDialog from '@/components/PoemDialog';
import usePoem from '@/hooks/usePoem';
import Printer from '@/components/Printer';
import PrinterConnectionContext from '@/lib/PrinterConnectionContext';
import WebBluetoothReceiptPrinter from '@/lib/WebBluetoothReceiptPrinter';
import useSettings, { AppPreviewMode } from '@/hooks/useAppSettings';

export default function Home() {
  // Intro.
  const [isBooted, setIsBooted] = useState<boolean>(false);

  // App settings.
  const [settings] = useSettings();

  // Printer connection.
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [driver, setDriver] = useState<WebBluetoothReceiptPrinter>();
  const [device, setDevice] = useState<{ type: 'bluetooth', id: string } | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  // Poem.
  const { poem, setFrame, frame } = usePoem();

  // Handlers.
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
    <PrinterConnectionContext.Provider value={{
      driver,
      device,
      setDriver,
      setDevice,
      isConnecting,
      setIsConnecting,
    }}>
      <main id="main-wrapper" className="z-0">
        <Camera onPhoto={settings.preview === AppPreviewMode.always ? setPreview : setFrame} />
        {preview && <ConfirmDialog preview={preview} onConfirm={previewConfirmHandler} onReject={previewRejectHandler} />}
        {frame && <PoemDialog onClose={peomOnCloseHandler} poem={poem} />}
      </main>
      <div className="absolute top-8 right-8 text-black z-50 flex gap-2 print:hidden">
        <Printer />
        <Settings />
      </div>
    </PrinterConnectionContext.Provider>
  );
}
