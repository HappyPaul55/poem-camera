import { useCallback } from "react";
import Settings from "./Settings";
import useSettings from "@/hooks/useSettings";
import { Button } from "./ui/button";

export default function Intro(props: { onBooted: () => void }) {
  const [settings] = useSettings();
  const bootHandler = useCallback(() => {
    const element = document.getElementsByTagName("body")[0];
    if (!element) {
      return;
    }

    if (settings.fullScreen !== true) {
      props.onBooted();
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

    props.onBooted();
  }, [props.onBooted]);

  return <>
    <main id="main-wrapper">
      <div className="bg-blue-600 bg-opacity-80 flex items-center justify-center">
        <Button
          type="submit"
          size="lg"
          variant="secondary"
          onClick={bootHandler}
        >
          Click to Start
        </Button>
      </div>
    </main>
    <Settings />
  </>
}