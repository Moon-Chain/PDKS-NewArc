// PWA Icon Generator — saf Node.js, ekstra paket gerektirmez
// Turuncu arka plan (#F97316) üzerinde beyaz "P" harfi
import { createWriteStream, mkdirSync } from 'fs';
import { createDeflate } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

mkdirSync(ICONS_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// PNG dosyası yaz — katı renk + basit "P" harfi
async function writePNG(size, filepath) {
  return new Promise((resolve, reject) => {
    // Piksel array oluştur: RGBA
    const pixels = new Uint8Array(size * size * 4);

    const bg   = [0xF9, 0x73, 0x16, 0xFF]; // #F97316 turuncu
    const fg   = [0xFF, 0xFF, 0xFF, 0xFF]; // beyaz

    // "P" harfi koordinatları — normalize (0–1)
    function inLetter(px, py) {
      const cx = px / size;
      const cy = py / size;
      // Kenar boşluğu %22
      const m = 0.22;
      if (cx < m || cx > 1 - m || cy < m || cy > 1 - m) return false;

      const x = (cx - m) / (1 - 2 * m);  // 0–1 içinde
      const y = (cy - m) / (1 - 2 * m);

      const stroke = 0.12; // çizgi kalınlığı

      // Dikey çubuk (sol)
      if (x < stroke) return true;

      // Üst yatay (P'nin üstü)
      if (y < stroke && x < 0.65) return true;

      // Orta yatay (P'nin ortası)
      if (y > 0.42 && y < 0.42 + stroke && x < 0.65) return true;

      // Sağ kenar (P'nin üst yarısı — kapalı kısım)
      if (x > 0.65 - stroke && x < 0.65 && y < 0.42 + stroke) return true;

      return false;
    }

    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const idx = (py * size + px) * 4;
        const color = inLetter(px, py) ? fg : bg;
        pixels[idx]     = color[0];
        pixels[idx + 1] = color[1];
        pixels[idx + 2] = color[2];
        pixels[idx + 3] = color[3];
      }
    }

    // PNG binary yaz
    const ws = createWriteStream(filepath);
    ws.on('error', reject);
    ws.on('finish', resolve);

    // PNG signature
    ws.write(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: RGB (we'll use filter + RGBA handling)
    ihdr[9] = 6;  // RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace
    writeChunk(ws, 'IHDR', ihdr);

    // IDAT chunk — raw scanlines (filtered)
    const scanlines = Buffer.alloc(size * (1 + size * 4));
    for (let row = 0; row < size; row++) {
      scanlines[row * (1 + size * 4)] = 0; // filter type None
      for (let col = 0; col < size; col++) {
        const srcIdx  = (row * size + col) * 4;
        const destIdx = row * (1 + size * 4) + 1 + col * 4;
        scanlines[destIdx]     = pixels[srcIdx];
        scanlines[destIdx + 1] = pixels[srcIdx + 1];
        scanlines[destIdx + 2] = pixels[srcIdx + 2];
        scanlines[destIdx + 3] = pixels[srcIdx + 3];
      }
    }

    const chunks = [];
    const deflate = createDeflate({ level: 6 });
    deflate.on('data', chunk => chunks.push(chunk));
    deflate.on('end', () => {
      const compressed = Buffer.concat(chunks);
      writeChunk(ws, 'IDAT', compressed);
      writeChunk(ws, 'IEND', Buffer.alloc(0));
      ws.end();
    });
    deflate.on('error', reject);
    deflate.end(scanlines);
  });
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeChunk(ws, type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  ws.write(len);
  ws.write(typeBuf);
  if (data.length > 0) ws.write(data);
  ws.write(crc);
}

// Tüm ikonları oluştur
for (const size of SIZES) {
  const fp = join(ICONS_DIR, `icon-${size}.png`);
  await writePNG(size, fp);
  console.log(`✓ icon-${size}.png`);
}
console.log('PWA ikonları oluşturuldu →', ICONS_DIR);
