import fs from 'node:fs';
import { defineConfig } from 'vite';

// The services monogram is inlined (its contour is drawn by scroll with stroke-dashoffset).
const monogram = fs.readFileSync(new URL('./src/assets/monogramme-contour.svg', import.meta.url), 'utf8')
  .replace(/<title>[^<]*<\/title>/, '')
  .replace('<svg ', '<svg class="mono-svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMinYMin meet" ')
  .replace('<path ', '<path data-mono pathLength="1000" ');

export default defineConfig({
  plugins: [{ name: 'inline-monogram', transformIndexHtml: (html) => html.replace('<!--MONOGRAM-->', monogram) }],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
