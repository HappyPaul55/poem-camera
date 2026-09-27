import type { PoemFormsNames } from "../poem-forms";
import type { PoemStyleNames } from "../poem-styles";
import useLocalStorageState from "use-local-storage-state";

/** Poem preference, persisted under the original `poemSettings` key. */
export default function usePoemSettings() {
  return useLocalStorageState<{ form: PoemFormsNames; style: PoemStyleNames }>(
    "poemSettings",
    {
      defaultValue: {
        form: "Poem",
        style: "Humorous",
      },
    },
  );
}
