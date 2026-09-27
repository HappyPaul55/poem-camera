export default function goFullscreen(): void {
  const element = document.documentElement;
  if (!element) {
    return;
  }

  // Inject polyfills for older WebKit/Trident prefixes.
  const elem = element as typeof element & Partial<{
    webkitRequestFullscreen: typeof element["requestFullscreen"];
    msRequestFullscreen: typeof element["requestFullscreen"];
  }>;

  if (elem.requestFullscreen) {
    void elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}
