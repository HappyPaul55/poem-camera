import useAppSettings, { AppFullScreen } from "../../lib/app/use-app-settings";
import goFullscreen from "../../lib/app/go-fullscreen";
import Button from "./ui/Button";

const steps = [
  "Grant permissions",
  "Take photo",
  "Verify photo",
  "Make a poem",
  "Enjoy…",
];

/** The boot screen shown before the camera starts. */
export default function Intro({ onBooted }: { onBooted: () => void }) {
  const [settings] = useAppSettings();

  const boot = () => {
    if (settings.fullScreen === AppFullScreen.yes) {
      goFullscreen();
    }
    onBooted();
  };

  return (
    <div className="intro">
      <p className="intro__eyebrow">
        <span aria-hidden="true">//</span> poem camera
      </p>
      <h1 className="intro__title">A camera that takes poems.</h1>

      <ol className="steps">
        {steps.map((step, index) => (
          <li className="step" key={step}>
            <span className="step__num" aria-hidden="true">
              {index + 1}
            </span>
            <span className="step__label">{step}</span>
          </li>
        ))}
      </ol>

      <Button variant="primary" onClick={boot}>
        Click to start
      </Button>

      <p className="max-w-[34rem] text-center text-[0.85rem] text-[rgba(250,250,244,0.6)]">
        Your camera stays on your device. Read the{" "}
        <a
          className="underline decoration-[rgba(250,250,244,0.4)] underline-offset-2 hover:text-yellow"
          href="/privacy"
        >
          privacy notice
        </a>
        .
      </p>
    </div>
  );
}
