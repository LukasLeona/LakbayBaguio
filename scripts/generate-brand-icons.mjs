import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "public/assets/img/favicon.svg");

async function png(size) {
  return sharp(await readFile(source), { density: 512 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

function icoFromPng(image, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, image]);
}

async function emit(path, contents) {
  const absolutePath = resolve(root, path);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents);
}

const favicon = await png(96);
await Promise.all([
  emit("app/favicon.ico", icoFromPng(favicon, 96)),
  emit("app/icon.png", await png(192)),
  emit("app/apple-icon.png", await png(180)),
  emit("public/assets/img/baguio-buddy-logo-512.png", await png(512)),
]);

console.log("Generated Baguio Buddy favicon, app icons, and structured-data logo.");
