'use client'

import { useCallback, useRef, useState } from "react";
import Camera from "./components/Camera";
import Frame from "./components/Frame";

export default function Home() {
  const [isBooted, setIsBooted] = useState<boolean>(false);
  const [frame, setFrame] = useState<string | undefined>(undefined);

  const bootHandler = useCallback(() => {
    if (isBooted === true) {
      return;
    }
    const element = document.getElementById("main-wrapper");
    if (!element) {
      return;
    }

    // Inject polyfilas for fallbacks.
    const elem = element as typeof element & Partial<{
      webkitRequestFullscreen: typeof element["requestFullscreen"],
      msRequestFullscreen: typeof element["requestFullscreen"],
    }>;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    setIsBooted(true);
  }, [isBooted]);

  if (isBooted === false) {
    return <main id="main-wrapper">
      <div className="bg-blue-600 bg-opacity-80 flex items-center justify-center">
        <button
          className="mx-2 px-6 py-4 text-3xl bg-blue-800 border-4 rounded-lg hover:bg-blue-900"
          type="button"
          onClick={bootHandler}
        >
          Click to start
        </button>
      </div>
    </main>
  }

  return (
    <main id="main-wrapper">
      <Camera setFrame={setFrame} />
      {frame && <Frame frame={frame} setFrame={setFrame} />}
    </main>
  );
}
