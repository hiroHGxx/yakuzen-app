import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

test('static sharing metadata uses the public URL and an existing image with accurate dimensions', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const meta = Object.fromEntries([...html.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]+)"\s*\/>/g)].map(match => [match[1], match[2]]));
  assert.equal(meta['og:url'], 'https://hirohgxx.github.io/yakuzen-app/');
  assert.equal(meta['og:type'], 'website');
  assert.equal(meta['og:locale'], 'ja_JP');
  assert.equal(meta['twitter:card'], 'summary_large_image');
  assert.equal(meta['og:title'], meta['twitter:title']);
  assert.equal(meta['og:description'], meta['description']);
  assert.equal(meta['twitter:description'], meta['description']);
  assert.equal(meta['og:image'], meta['twitter:image']);
  assert.ok(meta['og:image:alt']);
  assert.equal(meta['og:image:alt'], meta['twitter:image:alt']);
  assert.ok(html.includes(`<link rel="canonical" href="${meta['og:url']}"`));
  const imageUrl = new URL(meta['og:image']);
  assert.equal(imageUrl.origin, new URL(meta['og:url']).origin);
  assert.ok(imageUrl.pathname.startsWith('/yakuzen-app/images/'));
  const image = await sharp(await readFile(new URL(`../public/${imageUrl.pathname.slice('/yakuzen-app/'.length)}`, import.meta.url))).metadata();
  assert.equal(Number(meta['og:image:width']), image.width);
  assert.equal(Number(meta['og:image:height']), image.height);
  assert.equal(meta['og:image:type'], `image/${image.format}`);
});
