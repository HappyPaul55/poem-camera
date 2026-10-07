import poemForms, { type PoemFormsNames } from "../../../lib/poem-forms";
import poemStyles, { type PoemStyleNames } from "../../../lib/poem-styles";
import usePoemSettings from "../../../lib/app/use-poem-settings";
import SelectField, { type SelectGroup } from "../ui/SelectField";

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const formGroups: SelectGroup[] = (
  Object.keys(poemForms) as (keyof typeof poemForms)[]
).map((group) => ({
  label: group,
  options: [...poemForms[group]]
    .sort(byName)
    .map((form) => ({ value: form.name, label: form.name })),
}));

const styleGroups: SelectGroup[] = (
  Object.keys(poemStyles) as (keyof typeof poemStyles)[]
).map((group) => ({
  label: group,
  options: [...poemStyles[group]]
    .sort(byName)
    .map((style) => ({ value: style.name, label: style.name })),
}));

export default function PoemSettings() {
  const [settings, setSettings] = usePoemSettings();

  return (
    <section className="settings-group">
      <h3 className="settings-group__title">Mode</h3>

      <SelectField
        id="poem-form"
        label="Form"
        value={settings.form}
        groups={formGroups}
        onChange={(value) =>
          setSettings({ ...settings, form: value as PoemFormsNames })
        }
      />

      <SelectField
        id="poem-style"
        label="Style"
        value={settings.style}
        groups={styleGroups}
        onChange={(value) =>
          setSettings({ ...settings, style: value as PoemStyleNames })
        }
      />
    </section>
  );
}
