import { PoemFormsNames } from "@/lib/poemForms";
import useLocalStorageState from "use-local-storage-state";

type Settings = {
  fullScreen: boolean,
};

export default function useSettings() {
  return useLocalStorageState<Settings>('settings', {
    defaultValue: { fullScreen: false },
  })
}