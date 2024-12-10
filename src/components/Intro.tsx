import { useCallback } from "react";
import Settings from "./Settings";
import useSettings from "@/hooks/useSettings";
import { Button } from "./ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "./ui/card";

function IntroGallery() {
  return <Carousel className="w-full max-w-xs">
    <CarouselContent>
      <CarouselItem>
        <div className="p-1">
          <Card>
            <CardContent className="relative flex flex-col aspect-square items-center justify-center p-2 text-center">
              <div className="grid bg-violet-600 rounded-full w-10 h-10 text-white mb-4 font-bold items-center">
                1
              </div>
              <span className="text-4xl font-semibold">Grant Permissions</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-1">
          <Card>
            <CardContent className="relative flex flex-col aspect-square items-center justify-center p-2 text-center">
              <div className="grid bg-indigo-600 rounded-full w-10 h-10 text-white mb-4 font-bold items-center">
                2
              </div>
              <span className="text-4xl font-semibold">Take Photo</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-1">
          <Card>
            <CardContent className="relative flex flex-col aspect-square items-center justify-center p-2 text-center">
              <div className="grid bg-blue-600 rounded-full w-10 h-10 text-white mb-4 font-bold items-center">
                3
              </div>
              <span className="text-4xl font-semibold">Verify Photo</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-1">
          <Card>
            <CardContent className="relative flex flex-col aspect-square items-center justify-center p-2 text-center">
              <div className="grid bg-green-600 rounded-full w-10 h-10 text-white mb-4 font-bold items-center">
                4
              </div>
              <span className="text-4xl font-semibold">Make a Poem</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
      <CarouselItem>
        <div className="p-1">
          <Card>
            <CardContent className="relative flex flex-col aspect-square items-center justify-center p-2 text-center">
              <div className="grid bg-yellow-400 rounded-full w-10 h-10 text-white mb-4 font-bold items-center">
                5
              </div>
              <span className="text-4xl font-semibold">Enjoy...</span>
            </CardContent>
          </Card>
        </div>
      </CarouselItem>
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
}

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
      <div className="bg-blue-600 bg-opacity-80 flex flex-col items-center justify-center overflow-hidden">
        <IntroGallery />
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
    <div className="absolute top-8 right-8 text-black z-50 flex gap-2">
      <Settings />
    </div>
  </>
}