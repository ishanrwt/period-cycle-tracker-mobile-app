/**
 * Builds launcher icons from assets/icon.png:
 * - icon-foreground.png — transparent, trimmed art (Android adaptive foreground)
 * - icon-app.png — dusty pink plate + art (iOS / fallback)
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const input = path.join(root, 'assets', 'icon.png');
const foregroundOut = path.join(root, 'assets', 'icon-foreground.png');
const appIconOut = path.join(root, 'assets', 'icon-app.png');

const CANVAS = 1024;
/** Logo max size on canvas (~66% Android adaptive safe zone) */
const LOGO_MAX_PX = Math.round(CANVAS * 0.62);
const BG = { r: 230, g: 198, b: 198, alpha: 1 }; // #E6C6C6

const trimmedLogo = await sharp(input).trim({ threshold: 12 }).png().toBuffer();

const resizedLogo = await sharp(trimmedLogo)
  .resize(LOGO_MAX_PX, LOGO_MAX_PX, { fit: 'inside' })
  .png()
  .toBuffer();

const meta = await sharp(resizedLogo).metadata();
console.log(`Trimmed logo fits in ~${meta.width}x${meta.height}px (max ${LOGO_MAX_PX})`);

await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: resizedLogo, gravity: 'center' }])
  .png()
  .toFile(foregroundOut);

await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: BG,
  },
})
  .composite([{ input: resizedLogo, gravity: 'center' }])
  .png()
  .toFile(appIconOut);

console.log(`Wrote ${foregroundOut}`);
console.log(`Wrote ${appIconOut}`);
