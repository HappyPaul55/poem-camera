import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 5h-3.17L15 3H9L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-8 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
    </Base>
  );
}

export function FlipIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 6V3L7.5 7.5 12 12V9a4 4 0 0 1 3.9 3.2l2-.5A6 6 0 0 0 12 6Zm-3.9 5.8-2 .5A6 6 0 0 0 12 18v3l4.5-4.5L12 12v3a4 4 0 0 1-3.9-3.2Z" />
    </Base>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19.14 12.94a7.07 7.07 0 0 0 .06-.94 7.07 7.07 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" />
    </Base>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19 8H5a3 3 0 0 0-3 3v6h4v3h12v-3h4v-6a3 3 0 0 0-3-3Zm-2 10H7v-6h10v6Zm3-6a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM19 3H5v4h14V3Z" />
    </Base>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 7 8h3v5h4V8h3l-5-5ZM5 18v2h14v-2H5Z" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
    </Base>
  );
}
