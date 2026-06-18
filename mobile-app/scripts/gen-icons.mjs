// Genera los íconos de la app desde assets/logo.svg (símbolo de reciclaje).
//   node scripts/gen-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'assets');
const IMG = join(ASSETS, 'images');
const SRC = join(ASSETS, 'logo.svg');
const SRC_MONO = join(ASSETS, 'logo-mono.svg');
const FONDO = { r: 13, g: 17, b: 23, alpha: 1 }; // #0d1117 (tema oscuro)

async function render({ size, padding, bg, out, src = SRC }) {
  const svg = await readFile(src);
  const inner = Math.round(size * (1 - padding * 2));
  const glyph = await sharp(svg, { density: 600 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: bg || { r: 0, g: 0, b: 0, alpha: 0 } },
  });
  const off = Math.round((size - inner) / 2);
  const result = await canvas.composite([{ input: glyph, left: off, top: off }]).png().toBuffer();
  await writeFile(out, result);
  console.log('✓', out.replace(join(__dirname, '..'), '.'));
}

await render({ size: 1024, padding: 0.18, bg: FONDO, out: join(IMG, 'icon.png') });
await render({ size: 1024, padding: 0.30, bg: null, out: join(IMG, 'android-icon-foreground.png') });
await render({ size: 1024, padding: 0.30, bg: null, out: join(IMG, 'android-icon-monochrome.png'), src: SRC_MONO });
await render({ size: 1024, padding: 0.35, bg: null, out: join(IMG, 'splash-icon.png') });
await render({ size: 48, padding: 0.12, bg: FONDO, out: join(IMG, 'favicon.png') });
console.log('Íconos generados.');
