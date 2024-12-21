export default function goFullscreen(): void {
  const element = document.getElementsByTagName("body")[0];
  if (!element) {
    return;
  }

  // Inject polyfilas for fallbacks.
  const elem = element as typeof element & Partial<{
    webkitRequestFullscreen: typeof element["requestFullscreen"],
    msRequestFullscreen: typeof element["requestFullscreen"],
  }>;

  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}