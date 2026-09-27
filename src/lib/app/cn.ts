/** Join truthy class names. A tiny stand-in for `clsx` + `tailwind-merge`. */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
