'use client'

import { useCallback, useEffect, useState } from "react";

type FrameProps = { frame: string, setFrame: (frame: undefined) => void }

type Poem = { title: string, body: string };

function FrameApplet(props: FrameProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [poem, setPoem] = useState<Poem | undefined>(undefined);

  const confirmHandler = useCallback(() => {
    setIsPrinting(true)
  }, [setIsPrinting]);

  const cancelHandler = useCallback(() => {
    props.setFrame(undefined);
  }, [props.setFrame]);

  const closeHandler = useCallback(() => {
    props.setFrame(undefined)
  }, [props.setFrame]);

  useEffect(() => {
    if (isPrinting === true && poem === undefined) {
      fetch('/api/poem', {
        method: 'POST',
        body: JSON.stringify({
          style: 'limerick',
          image: props.frame,
        }),
      }).then(response => {
        response.json().then(json => {
          setPoem({
            title: json.title,
            body: json.body,
          });
        });
      });
    }
  }, [isPrinting]);

  if (poem !== undefined) {
    return <div
      className="bg-blue-800 border-4 rounded-lg p-6 relative min-w-[400px]"
    >
      <h1 className="text-xl pb-4 font-bold">{poem.title}</h1>
      <div
        className="pb-10"
        dangerouslySetInnerHTML={{
          __html: '<p>' +
            poem
              .body
              .split('\n\n').join('</p><p>')
              .split('\n').join('<br />')
            + '</p>',
        }}
      />
      <div className="text-center align-bottom absolute top-[100%] block -left-2 -right-2 -mt-10 ">
        <button
          className="mx-2 px-6 py-4 text-3xl bg-blue-600 border-4 rounded-lg hover:bg-blue-500"
          type="button"
          onClick={confirmHandler}
        >
          Print
        </button>
        <button
          className="mx-2 px-6 py-4 text-3xl bg-red-500 border-4 rounded-lg hover:bg-red-600"
          type="button"
          onClick={closeHandler}
        >
          Close
        </button>
      </div>
    </div>
  }

  if (isPrinting) {
    return <div className="h-20 w-20 bg-white animate-spin" />
  }

  return <div className="rounded-lg border-8 border-white relative">
    <img src={props.frame} className="max-h-[90vh] max-w-[90vw] relative z-0" alt="Photo" />
    <div className="absolute top-[100%] -left-2 -right-2 text-center align-bottom -mt-10">
      <button
        className="mx-2 px-6 py-4 text-3xl bg-blue-600 border-4 rounded-lg hover:bg-blue-500"
        type="button"
        onClick={confirmHandler}
      >
        Confirm
      </button>
      <button
        className="mx-2 px-6 py-4 text-3xl bg-red-600 border-4 rounded-lg hover:bg-red-500"
        type="button"
        onClick={cancelHandler}
      >
        Cancel
      </button>
    </div>
  </div>
}

export default function Frame(props: FrameProps) {
  return <div className="bg-blue-800 bg-opacity-80 flex items-center justify-center">
    <FrameApplet {...props} />
  </div>
}