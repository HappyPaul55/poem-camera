/**
 * The poetic forms the camera can write in. The shape is grouped so the settings
 * UI can render one `<optgroup>` per category; `POEM_FORM_NAMES` is the flat
 * list of valid values (used to validate the API request).
 */
const poemForms = {
  Categories: [
    { name: "Haiku" },
    { name: "Limerick" },
    { name: "Poem" },
    { name: "Sonnet" },
    { name: "Detective" },
    { name: "Debug" },
    { name: "Tongue Twister" },
  ],
} as const;

export type PoemFormsNames = (typeof poemForms)[keyof typeof poemForms][number]["name"];

export const POEM_FORM_NAMES: PoemFormsNames[] = Object.values(poemForms)
  .flat()
  .map((row) => row.name);

export default poemForms;
