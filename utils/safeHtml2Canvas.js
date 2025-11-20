import html2canvas from "html2canvas";

/**
 * A safe wrapper around html2canvas that strips unsupported CSS color functions like lab(), oklch(), etc.
 */
export async function safeHtml2Canvas(element, options = {}) {
  // Clone the element to avoid modifying the visible DOM
  const cloned = element.cloneNode(true);
  document.body.appendChild(cloned);

  // Replace all lab()/oklab()/oklch() colors with rgb()
  const fixColors = (el) => {
    const style = window.getComputedStyle(el);
    for (const prop of ["color", "backgroundColor", "borderColor"]) {
      const val = style[prop];
      if (val && /(lab|oklab|oklch)\(/.test(val)) {
        el.style[prop] = "rgb(0,0,0)";
      }
    }
    for (const child of el.children) fixColors(child);
  };
  fixColors(cloned);

  // Generate canvas safely
  const canvas = await html2canvas(cloned, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    ...options,
  });

  // Clean up cloned DOM
  document.body.removeChild(cloned);
  return canvas;
}
