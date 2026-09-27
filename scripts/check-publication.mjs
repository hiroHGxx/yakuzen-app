import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { homedir } from 'node:os';
import sharp from 'sharp';

const filenames = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const homeName = basename(homedir());
const problems = [];
let imageCount = 0;
for (const filename of [...new Set(filenames)]) {
  const fileStat = await stat(filename);
  if (!fileStat.isFile()) continue;
  if (fileStat.size > 20 * 1024 * 1024) problems.push(`${filename}: exceeds 20 MB`);
  const contents = await readFile(filename);
  if (contents.includes(Buffer.from(homeName))) problems.push(`${filename}: contains home directory name`);
  const text = contents.toString('utf8');
  if (/sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) problems.push(`${filename}: possible secret`);
  if (/\.(webp|png|jpg|jpeg)$/i.test(filename)) {
    const metadata = await sharp(contents).metadata();
    if (metadata.exif || metadata.xmp || metadata.iptc) problems.push(`${filename}: contains embedded image metadata`);
    imageCount++;
  }
}
for (const path of ['node_modules', 'dist', '.local', '.env', 'test-results']) {
  try { execFileSync('git', ['check-ignore', path], { stdio: 'pipe' }); }
  catch { problems.push(`${path}: not ignored`); }
}
if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
else console.log(`Publication scan passed: ${filenames.length} files, ${imageCount} images; no home directory name, detected secrets, oversized files, or embedded image metadata.`);
