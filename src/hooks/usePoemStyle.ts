import { PoemStyleNames } from "@/lib/poemStyles";
import useLocalStorageState from "use-local-storage-state";

export default function usePoemStyle() {
  return useLocalStorageState<PoemStyleNames>('poemStlye', {
    defaultValue: 'Humorous',
  })
}