const poemForms = {
  "Categories": [
    { name: "Poem" },
    { name: "Haiku" },
    { name: "Limerick" },
    { name: "Sonnet" },
    { name: "Ballad" },
  ],
} as const;

export type PoemFormsNames = (typeof poemForms[keyof typeof poemForms][number]["name"]);

export default poemForms;