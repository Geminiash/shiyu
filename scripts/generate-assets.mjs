/**
 * 位图资产生成：内联 SVG → sharp → WebP（图片纪律：位图一律 WebP）。
 *
 * 产物（写入 public/）：
 *   logo-512.webp / logo-192.webp  —— 应用图标（暗色圆角底 + 极光环 + 雨滴）
 *   og-image.webp                  —— 社交分享图 1200×630
 *
 * 其余视觉一律 SVG / CSS，无任何位图。产物体积记录在 README「构建体积」。
 *
 * 实现注记：sharp 的 toFile() 在含非 ASCII 字符的 Windows 路径上会使
 * libvips 硬崩（无 stderr、exit 127），因此统一 toBuffer() 后用
 * node:fs 写盘（Node 自身对 Unicode 路径处理正常）。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
mkdirSync(publicDir, { recursive: true });

/** 应用图标：暗色圆角底 + 极光渐变环 + 雨滴（与 favicon.svg 同构） */
function logoSvg(size) {
  const s = size;
  const r = s * 0.1875; // 圆角
  const cx = s / 2;
  const ringR = s * 0.31;
  const sw = s * 0.052;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#24c6dc"/>
      <stop offset=".41" stop-color="#5433ff"/>
      <stop offset=".76" stop-color="#ff0099"/>
    </linearGradient>
    <radialGradient id="bg" cx=".5" cy=".38" r=".8">
      <stop offset="0" stop-color="#171730"/>
      <stop offset="1" stop-color="#0b0b16"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${s * 0.035}"/>
    </filter>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cx}" r="${ringR * 1.15}" fill="none" stroke="url(#g)" stroke-width="${sw * 2.4}" opacity=".38" filter="url(#soft)"/>
  <circle cx="${cx}" cy="${cx}" r="${ringR}" fill="none" stroke="url(#g)" stroke-width="${sw}"
          stroke-linecap="round" stroke-dasharray="${2 * Math.PI * ringR * 0.79} ${2 * Math.PI * ringR * 0.21}"
          transform="rotate(-90 ${cx} ${cx})"/>
  <path d="M${cx} ${cx - s * 0.19}
           c ${s * 0.072} ${s * 0.087} ${s * 0.115} ${s * 0.152} ${s * 0.115} ${s * 0.207}
           a ${s * 0.115} ${s * 0.115} 0 1 1 -${s * 0.23} 0
           c 0 -${s * 0.055} ${s * 0.043} -${s * 0.12} ${s * 0.115} -${s * 0.207} Z"
        fill="url(#g)"/>
</svg>`;
}

/** 社交分享图 1200×630：暗色极光底 + 衬线大字 */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#24c6dc"/>
      <stop offset=".41" stop-color="#5433ff"/>
      <stop offset=".76" stop-color="#ff0099"/>
    </linearGradient>
    <radialGradient id="glow1" cx=".28" cy="0" r=".9">
      <stop offset="0" stop-color="#5E6AD2" stop-opacity=".5"/>
      <stop offset=".6" stop-color="#5E6AD2" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx=".78" cy=".1" r=".8">
      <stop offset="0" stop-color="#24c6dc" stop-opacity=".3"/>
      <stop offset=".6" stop-color="#24c6dc" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow3" cx=".5" cy="1.05" r=".9">
      <stop offset="0" stop-color="#4A2334" stop-opacity=".75"/>
      <stop offset=".65" stop-color="#4A2334" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#24c6dc"/>
      <stop offset=".41" stop-color="#5433ff"/>
      <stop offset=".76" stop-color="#ff0099"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#08090A"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  <rect width="1200" height="630" fill="url(#glow3)"/>

  <g transform="translate(140 178)">
    <circle cx="86" cy="86" r="70" fill="none" stroke="url(#ring)" stroke-width="9"
            stroke-linecap="round" stroke-dasharray="348 92" transform="rotate(-90 86 86)"/>
    <path d="M86 34c17 21 27 35 27 47a27 27 0 1 1-54 0c0-12 10-26 27-47Z" fill="url(#ring)"/>
  </g>

  <text x="360" y="298" font-family="SimSun, 'Noto Serif SC', 'Songti SC', serif"
        font-size="150" font-weight="700" fill="rgba(255,255,255,.92)" letter-spacing="14">时雨</text>
  <text x="366" y="378" font-family="'Microsoft YaHei', 'PingFang SC', sans-serif"
        font-size="40" fill="rgba(255,255,255,.68)" letter-spacing="10">把时间过成风景。</text>
  <text x="366" y="452" font-family="Consolas, monospace"
        font-size="24" fill="rgba(255,255,255,.4)" letter-spacing="6">SHIYU · 倒计时 · 节气 · 农历 · 番茄钟</text>
</svg>`;

async function renderWebp(svg, { quality, resize } = {}) {
  let pipeline = sharp(Buffer.from(svg));
  if (resize) pipeline = pipeline.resize(resize, resize);
  return pipeline.webp({ quality: quality ?? 85, effort: 6 }).toBuffer();
}

async function main() {
  const outputs = [
    { file: 'logo-512.webp', buffer: await renderWebp(logoSvg(512), { quality: 90 }) },
    {
      file: 'logo-192.webp',
      buffer: await renderWebp(logoSvg(512), { quality: 90, resize: 192 }),
    },
    { file: 'og-image.webp', buffer: await renderWebp(ogSvg, { quality: 82 }) },
  ];

  const report = [];
  for (const { file, buffer } of outputs) {
    writeFileSync(path.join(publicDir, file), buffer);
    const meta = await sharp(buffer).metadata();
    report.push(`${file}: ${(buffer.length / 1024).toFixed(1)} KB (${meta.width}x${meta.height})`);
  }

  // 校验用预览（tests/screenshots 用后即删）
  const previewDir = path.join(root, 'tests', 'screenshots');
  mkdirSync(previewDir, { recursive: true });
  writeFileSync(path.join(previewDir, 'og-preview.png'), await sharp(Buffer.from(ogSvg)).png().toBuffer());
  writeFileSync(path.join(previewDir, 'logo-preview.png'), await sharp(Buffer.from(logoSvg(512))).png().toBuffer());

  console.log(report.join('\n'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
