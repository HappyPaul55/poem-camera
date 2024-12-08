import { PoemFormsNames } from "@/lib/poemForms";
import useLocalStorageState from "use-local-storage-state";

export default function usePoemForm() {
  return useLocalStorageState<PoemFormsNames>('poemForm', {
    defaultValue: 'Poem',
  })
}