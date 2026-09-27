import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error('Usage: node scripts/optimize-images.mjs <generated-image-directory>');
const sources = {
  rice: 'exec-d833f4fe-67b3-42b8-a5ec-4396c3444082.png',
  soup: 'exec-430a9fa3-8e0b-4d5e-b774-35ab930c1f45.png',
  pear: 'exec-bd62ea2b-a8de-4a8c-9889-f7ce5b175213.png',
  pumpkin: 'exec-fba64343-06f3-4e10-87a5-b17a6f41d000.png',
  greens: 'exec-1715e428-fa45-49a1-af04-2c06dd34b7dd.png',
  tomato: 'exec-4a042e4d-1fe2-4a02-89a3-52b5afd2819e.png',
};
await mkdir('public/images', { recursive: true });
for (const [name, filename] of Object.entries(sources)) {
  const result = await sharp(resolve(sourceDirectory, filename)).resize({ width: name === 'rice' ? 1440 : 1000, withoutEnlargement: true }).webp({ quality: 84 }).toFile(`public/images/${name}.webp`);
  console.log(`${name}: ${Math.round(result.size / 1024)} KB`);
}
