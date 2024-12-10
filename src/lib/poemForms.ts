const poemForms = {
  "Categories": [
    { name: "Ballad" },
    { name: "Haiku" },
    { name: "Limerick" },
    { name: "Poem" },
    { name: "Sonnet" },
    { name: "Detective" },
    { name: "Debug" },
    { name: "Tongue Twister" },
  ],
} as const;

export type PoemFormsNames = (typeof poemForms[keyof typeof poemForms][number]["name"]);

export default poemForms;