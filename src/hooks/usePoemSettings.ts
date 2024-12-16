import type { PoemFormsNames } from '@/lib/poemForms';
import type { PoemStyleNames } from '@/lib/poemStyles';
import useLocalStorageState from 'use-local-storage-state';

export default function usePoemSettings() {
  return useLocalStorageState<{ form: PoemFormsNames, style: PoemStyleNames }>('poemSettings', {
    defaultValue: {
      form: 'Poem',
      style: 'Humorous'
    },
  })
}