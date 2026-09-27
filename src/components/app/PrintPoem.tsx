import type { Poem } from "../../lib/app/poem-types";

/**
 * The print-only copy of the poem. It lives outside the app shell so that
 * `body[data-print="poem"]` can hide the rest of the page and print just this.
 */
export default function PrintPoem({ poem }: { poem: Poem }) {
  return (
    <article className="print-only print-poem" aria-hidden="true">
      <h1 className="print-poem__title">{poem.title}</h1>
      <p className="print-poem__byline">By Poem Camera</p>
      <div className="print-poem__body">{poem.body}</div>
    </article>
  );
}
