import { type ReactNode, useCallback, useState, useId } from "react";
import { Button } from "./ui/button";
import { ImSpinner5 } from "react-icons/im";
import { cn } from "@/lib/utils";

export default function FileUploadButton(props: {
  children: ReactNode,
  onPhoto: (frame: string) => void,
  className?: string
}) {
  const fileUploadButtonId = useId();
  const [loading, setLoading] = useState(false);
  const clickHandler = useCallback((e: { preventDefault: () => void }) => {
    e.preventDefault();
    document.getElementById(fileUploadButtonId)?.click();
  }, []);

  const inputHandler = useCallback((e: any) => {
    const file = [...e.target.files].find((file: File) => file.type.startsWith('image/')) as File | undefined;
    if (file === undefined) {
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result;
      if (typeof base64String !== 'string') {
        setLoading(false);
        return;
      }

      props.onPhoto(base64String);
    };

    reader.readAsDataURL(file);
    setLoading(false);

  }, [props.onPhoto]);

  const className = cn("block mx-auto", props.className);

  if (loading) {
    return <Button variant="secondary" className={className}>
      <ImSpinner5 className="block mx-auto w-40 h-40 animate-spin" />
    </Button>
  }

  return <>
    <Button variant="secondary" className={className} onClick={clickHandler}>
      {props.children}
    </Button>
    <input onChange={inputHandler} id={fileUploadButtonId} type="file" className="hidden" />
  </>
}