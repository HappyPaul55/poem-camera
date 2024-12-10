import { PoemFormsNames } from "@/lib/poemForms";
import useLocalStorageState from "use-local-storage-state";

type Settings = {
  fullScreen: boolean,
  preview: 'always' | 'never'
  instantPrint: boolean,
};

export default function useSettings() {
  return useLocalStorageState<Settings>('settings', {
    defaultValue: {
      fullScreen: false,
      preview: 'always',
      instantPrint: false,
    },
  })
}