// jsPDF lazily `import()`s canvg, html2canvas, and dompurify only inside its
// optional SVG-embedding (`.addSvgAsImage()`) and HTML-rendering (`.html()`)
// helpers, none of which this app calls. Those packages aren't installed and
// aren't needed for a modern browser target, so all three are aliased to
// this empty stub instead (see next.config.ts). Safe because the real
// modules are never actually reached at runtime.
export {};
export default {};
