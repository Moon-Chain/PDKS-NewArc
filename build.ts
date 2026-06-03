import esbuild from 'esbuild';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const isDev = process.argv.includes('--watch');

// Önceki chunk'ları temizle
try { rmSync('public/js', { recursive: true, force: true }); } catch {}
mkdirSync('public/js', { recursive: true });

const config: esbuild.BuildOptions = {
  entryPoints: ['public/ts/app.ts'],
  bundle:      true,
  outdir:      'public/js',
  format:      'esm',
  splitting:   true,
  chunkNames:  'chunks/[name]-[hash]',
  target:      'es2020',
  sourcemap:   isDev,
  minify:      !isDev,
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"',
  },
};

function bumpSwVersion() {
  // sw.js'deki cache adını build hash'iyle otomatik güncelle
  const swPath  = 'public/sw.js';
  const hash    = createHash('sha1').update(Date.now().toString()).digest('hex').slice(0, 8);
  let sw        = readFileSync(swPath, 'utf8');
  sw = sw.replace(
    /const CACHE_NAME\s*=\s*'pdks-[^']+'/,
    `const CACHE_NAME    = 'pdks-build-${hash}'`,
  ).replace(
    /const JS_CACHE\s*=\s*'pdks-js-[^']+'/,
    `const JS_CACHE      = 'pdks-js-${hash}'`,
  );
  writeFileSync(swPath, sw, 'utf8');
  console.log(`SW cache versiyonu güncellendi: pdks-build-${hash}`);
}

if (isDev) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('esbuild watch modu (ESM + splitting) — değişiklikler izleniyor');
} else {
  const result = await esbuild.build({ ...config, metafile: true });
  const sizes = Object.entries(result.metafile!.outputs)
    .map(([f, o]) => `  ${f.replace('public/js/', '')}: ${(o.bytes / 1024).toFixed(1)}kb`)
    .join('\n');
  console.log(`esbuild ESM build tamamlandı:\n${sizes}`);
  bumpSwVersion(); // Production build'de SW'yi otomatik ver
}
