import goFullscreen from "../../../lib/app/go-fullscreen";
import useAppSettings, {
  AppFullScreen,
  AppPreviewMode,
} from "../../../lib/app/use-app-settings";
import SelectField from "../ui/SelectField";

export default function AppSettings() {
  const [settings, setSettings] = useAppSettings();

  return (
    <section className="settings-group">
      <h3 className="settings-group__title">App</h3>

      <SelectField
        id="app-fullscreen"
        label="Fullscreen"
        value={settings.fullScreen === AppFullScreen.yes ? "yes" : "no"}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
        onChange={(value) => {
          setSettings({
            ...settings,
            fullScreen:
              value === "yes" ? AppFullScreen.yes : AppFullScreen.no,
          });
          if (value === "yes") {
            goFullscreen();
          }
        }}
      />

      <SelectField
        id="app-preview"
        label="Preview"
        value={String(settings.preview)}
        options={[
          { value: String(AppPreviewMode.always), label: "Always" },
          { value: String(AppPreviewMode.never), label: "Never" },
        ]}
        onChange={(value) =>
          setSettings({
            ...settings,
            preview: Number(value) as AppPreviewMode,
          })
        }
      />
    </section>
  );
}
