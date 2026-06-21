import esbuild from 'esbuild';
import { rmSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { sep, join } from 'path';

const isDev = process.argv.includes('--watch');

// Önceki chunk'ları temizle
try { rmSync('public/js', { recursive: true, force: true }); } catch {}
mkdirSync('public/js', { recursive: true });
try { rmSync('public/admin/js', { recursive: true, force: true }); } catch {}
mkdirSync('public/admin/js', { recursive: true });

const sharedConfig: Partial<esbuild.BuildOptions> = {
  bundle:      true,
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

const config: esbuild.BuildOptions = {
  ...sharedConfig,
  entryPoints: ['public/ts/app.ts'],
  outdir:      'public/js',
};

const adminConfig: esbuild.BuildOptions = {
  ...sharedConfig,
  entryPoints: ['public/admin/ts/app-admin.ts'],
  outdir:      'public/admin/js',
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

function copyStaticAssets() {
  // dist/server.js __dirname'e göre static dosyaları arar (dist/public, dist/uploads)
  rmSync('dist/public', { recursive: true, force: true });
  const tsDir      = join('public', 'ts');
  const adminTsDir = join('public', 'admin', 'ts');
  cpSync('public', 'dist/public', {
    recursive: true,
    filter: (src) =>
      src !== tsDir      && !src.startsWith(tsDir + sep) &&
      src !== adminTsDir && !src.startsWith(adminTsDir + sep),
  });

  if (existsSync('uploads')) {
    cpSync('uploads', 'dist/uploads', { recursive: true });
  } else {
    mkdirSync('dist/uploads', { recursive: true });
  }
  console.log('Statik dosyalar dist/ içine kopyalandı (public, uploads)');
}

if (isDev) {
  const [ctx, adminCtx] = await Promise.all([
    esbuild.context(config),
    esbuild.context(adminConfig),
  ]);
  await Promise.all([ctx.watch(), adminCtx.watch()]);
  console.log('esbuild watch modu (ESM + splitting) — değişiklikler izleniyor (app + admin)');
} else {
  const [result, adminResult] = await Promise.all([
    esbuild.build({ ...config, metafile: true }),
    esbuild.build({ ...adminConfig, metafile: true }),
  ]);
  const printSizes = (label: string, prefix: string, meta: esbuild.Metafile) => {
    const sizes = Object.entries(meta.outputs)
      .map(([f, o]) => `  ${f.replace(prefix, '')}: ${(o.bytes / 1024).toFixed(1)}kb`)
      .join('\n');
    console.log(`esbuild ESM build tamamlandı (${label}):\n${sizes}`);
  };
  printSizes('app', 'public/js/', result.metafile!);
  printSizes('admin', 'public/admin/js/', adminResult.metafile!);
  bumpSwVersion(); // Production build'de SW'yi otomatik ver
  copyStaticAssets();
}
