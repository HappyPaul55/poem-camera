export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  disabled?: boolean;
}

/** A labelled native `<select>`, with optional `<optgroup>`s. */
export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  groups,
  disabled,
}: Props) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        className="select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {groups
          ? groups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
      </select>
    </div>
  );
}
