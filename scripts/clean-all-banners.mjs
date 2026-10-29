import sharp from 'sharp';

async function cleanAllBanners() {
  // 1. Clean Hero Banner (735 x 216)
  const { data: hData, info: hInfo } = await sharp('public/reference-design.png')
    .extract({ left: 10, top: 48, width: 735, height: 216 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hBuf = Buffer.from(hData);
  const { width: hw, height: hh, channels: hc } = hInfo;

  for (let y = 0; y < hh; y++) {
    const t = y / hh;
    const baseR = Math.round(246 * (1 - t) + 235 * t);
    const baseG = Math.round(243 * (1 - t) + 229 * t);
    const baseB = Math.round(237 * (1 - t) + 220 * t);

    // Left text extends up to x=288 for y < 175, and x=272 for y >= 175
    const maxLeftX = y < 175 ? 295 : 272;
    const blendStart = maxLeftX - 15;

    for (let x = 0; x < maxLeftX; x++) {
      const idx = (y * hw + x) * hc;
      if (x < blendStart) {
        hBuf[idx] = baseR;
        hBuf[idx + 1] = baseG;
        hBuf[idx + 2] = baseB;
      } else {
        const blend = (x - blendStart) / 15;
        hBuf[idx] = Math.round(baseR * (1 - blend) + hBuf[idx] * blend);
        hBuf[idx + 1] = Math.round(baseG * (1 - blend) + hBuf[idx + 1] * blend);
        hBuf[idx + 2] = Math.round(baseB * (1 - blend) + hBuf[idx + 2] * blend);
      }
    }

    // Right side: clean "Style Beyond Trends" (y: 35 to 155, x: 615 to 725)
    // Sample from x=612 on the exact same row y!
    if (y >= 35 && y <= 155) {
      const sampleIdx = (y * hw + 612) * hc;
      const sr = hBuf[sampleIdx];
      const sg = hBuf[sampleIdx + 1];
      const sb = hBuf[sampleIdx + 2];
      for (let x = 613; x < 728; x++) {
        const idx = (y * hw + x) * hc;
        hBuf[idx] = sr;
        hBuf[idx + 1] = sg;
        hBuf[idx + 2] = sb;
      }
    }

    // Bottom-right: clean "01 02 03 < >" (y: 175 to 214, x: 600 to 732)
    // Sample from x=598 on the exact same row y!
    if (y >= 175 && y <= 214) {
      const sampleIdx = (y * hw + 598) * hc;
      const sr = hBuf[sampleIdx];
      const sg = hBuf[sampleIdx + 1];
      const sb = hBuf[sampleIdx + 2];
      for (let x = 599; x < 732; x++) {
        const idx = (y * hw + x) * hc;
        hBuf[idx] = sr;
        hBuf[idx + 1] = sg;
        hBuf[idx + 2] = sb;
      }
    }
  }

  await sharp(hBuf, { raw: { width: hw, height: hh, channels: hc } })
    .resize(1838, 540, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/hero-banner-clean.png');

  // 2. Clean Modern Essentials (275 x 172)
  const { data: meData, info: meInfo } = await sharp('public/reference-design.png')
    .extract({ left: 10, top: 400, width: 275, height: 172 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const meBuf = Buffer.from(meData);
  for (let y = 0; y < meInfo.height; y++) {
    const t = y / meInfo.height;
    const r = Math.round(241 * (1 - t) + 233 * t);
    const g = Math.round(236 * (1 - t) + 226 * t);
    const b = Math.round(226 * (1 - t) + 214 * t);

    // Model is on right (x >= 122). Clean left text area (x: 0 to 122)
    const maxX = y > 135 ? 128 : 118;
    for (let x = 0; x < maxX; x++) {
      const idx = (y * meInfo.width + x) * meInfo.channels;
      if (x < maxX - 10) {
        meBuf[idx] = r;
        meBuf[idx + 1] = g;
        meBuf[idx + 2] = b;
      } else {
        const blend = (x - (maxX - 10)) / 10;
        meBuf[idx] = Math.round(r * (1 - blend) + meBuf[idx] * blend);
        meBuf[idx + 1] = Math.round(g * (1 - blend) + meBuf[idx + 1] * blend);
        meBuf[idx + 2] = Math.round(b * (1 - blend) + meBuf[idx + 2] * blend);
      }
    }
  }

  await sharp(meBuf, { raw: { width: meInfo.width, height: meInfo.height, channels: meInfo.channels } })
    .resize(688, 430, { kernel: sharp.kernel.lanczos3 })
    .toFile('public/reference-assets/modern-essentials-clean.png');

  // 3. Clean Promo Banners (Footwear, Accessories, New Arrivals)
  const promos = [
    { name: 'promo-footwear-clean.png', left: 10, top: 585, width: 255, height: 80, cleanUntilX: 112 },
    { name: 'promo-accessories-clean.png', left: 275, top: 585, width: 255, height: 80, cleanUntilX: 132 },
    { name: 'promo-new-arrivals-clean.png', left: 540, top: 585, width: 205, height: 80, cleanUntilX: 95 },
  ];

  for (const p of promos) {
    const { data: pData, info: pInfo } = await sharp('public/reference-design.png')
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pBuf = Buffer.from(pData);
    // Sample clean background color at y=6, x=20
    const sIdx = (6 * pInfo.width + 20) * pInfo.channels;
    const sr = pBuf[sIdx], sg = pBuf[sIdx + 1], sb = pBuf[sIdx + 2];

    for (let y = 3; y < pInfo.height - 3; y++) {
      for (let x = 4; x < p.cleanUntilX; x++) {
        const idx = (y * pInfo.width + x) * pInfo.channels;
        if (x < p.cleanUntilX - 12) {
          pBuf[idx] = sr;
          pBuf[idx + 1] = sg;
          pBuf[idx + 2] = sb;
        } else {
          const blend = (x - (p.cleanUntilX - 12)) / 12;
          pBuf[idx] = Math.round(sr * (1 - blend) + pBuf[idx] * blend);
          pBuf[idx + 1] = Math.round(sg * (1 - blend) + pBuf[idx + 1] * blend);
          pBuf[idx + 2] = Math.round(sb * (1 - blend) + pBuf[idx + 2] * blend);
        }
      }
    }

    await sharp(pBuf, { raw: { width: pInfo.width, height: pInfo.height, channels: pInfo.channels } })
      .resize(Math.round(p.width * 2.5), 200, { kernel: sharp.kernel.lanczos3 })
      .toFile(`public/reference-assets/${p.name}`);
  }

  console.log('All clean banner plates generated successfully!');
}

cleanAllBanners().catch(console.error);

