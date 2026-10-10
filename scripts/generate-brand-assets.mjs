// Generates the distributable brand files in public/brand — the square mark and
// the horizontal lockup, as SVG and PNG.
//
// Run with:  node scripts/generate-brand-assets.mjs
//
// Needs three tools that are NOT project dependencies, because nothing but this
// script wants them and the logo changes about once a year:
//
//   npm i --no-save opentype.js wawoff2 @fontsource/inter
//
// Why a generator rather than hand-drawn files: the phoenix is already defined
// once, inline, in src/components/public/phoenix-logo.tsx, and the site header
// is the lockup. Exported files that drift from the component are worse than no
// files at all — a supplier puts last year's bird on an invoice. The paths below
// are copied from that component and the proportions are copied from the header,
// so regenerating is how the exports stay honest.
//
// The wordmark is CONVERTED TO OUTLINES rather than left as <text>. A logo file
// travels: a print shop, a vendor's CMS, someone's email signature. Anywhere
// Inter is not installed, live text silently falls back to Arial and the brand
// is wrong. Outlines render identically everywhere, at the cost of being
// un-editable — which is the right trade for a logo.
//
// The PNGs are rasterised with `sharp`, which arrives with Next.js rather than
// being declared here — it is what next/image already uses, so the repo would
// have to lose image optimisation before this loses its rasteriser.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require_ = createRequire(import.meta.url)
const { decompress } = require_('wawoff2')
const opentype = require_('opentype.js')
const sharp = require_('sharp')

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'brand')

// ── Brand ────────────────────────────────────────────────────────────────────
// Mirrors src/app/globals.css. Hard-coded on purpose: these files are read by
// tools that have never heard of a CSS custom property.
const GOLD = '#c8921c' // --color-gold
const GOLD_LIGHT = '#e8bb4e' // --color-gold-light, the crest highlight
const INK = '#0b0c0e' // --color-ink-950, the wordmark on a light ground
const PAPER = '#fbfaf8' // --color-paper, the wordmark on a dark ground
const WHITE = '#ffffff' // --color-paper-raised, the ground under a light JPEG

const WORDMARK = 'PHOENIX POWER UNIVERSE'

/** The phoenix, copied verbatim from PhoenixMark in
 *  src/components/public/phoenix-logo.tsx. Its own 64×64 box.
 *  `light: true` marks the two crest plumes that catch the lighter gold. */
const MARK_BOX = 64
const MARK_PATHS = [
  { light: true, d: 'M30.2 10.2 C27.6 6.4 24.4 3.8 20.4 2.4 C23.4 5.8 25.8 9.2 27.4 12.6 Z' },
  { light: true, d: 'M31.6 9.2 C30.2 5.6 28.6 2.8 26.4 0.6 C27.6 4.4 28.4 7.6 28.8 10.8 Z' },
  { d: 'M32.2 8.4 C35.4 8.4 37.6 10.6 37.6 13.4 L42.8 15.2 L37.4 16.8 C36.6 17.8 35 18.4 33 18.4 L30 18.4 C28.6 17 27.8 15.2 27.8 13.4 C27.8 10.6 29 8.4 32.2 8.4 Z' },
  { d: 'M29.4 18 L34.6 18 L35.8 31.5 L32 40.5 L28.2 31.5 Z' },
  { d: 'M34.8 20.6 C43 19.4 53 14 61.5 5.5 C59.5 15 55.5 21.4 50 25.6 L54.6 26.2 C51.4 29.4 47.6 31.6 43.4 32.8 L47 34.2 C43.8 35.8 40 36.6 36.2 36.6 L35.6 29 Z' },
  { d: 'M29.2 20.6 C21 19.4 11 14 2.5 5.5 C4.5 15 8.5 21.4 14 25.6 L9.4 26.2 C12.6 29.4 16.4 31.6 20.6 32.8 L17 34.2 C20.2 35.8 24 36.6 27.8 36.6 L28.4 29 Z' },
  { d: 'M30.6 38.5 L33.4 38.5 L34.2 60 L32 54.5 L29.8 60 Z' },
  { d: 'M35 36.8 L37.4 38.2 L43.5 56 L39.6 51.6 L39 56.8 Z' },
  { d: 'M29 36.8 L26.6 38.2 L20.5 56 L24.4 51.6 L25 56.8 Z' },
]

// ── Geometry ─────────────────────────────────────────────────────────────────

/**
 * The INK bounds of a path — where the shape actually is, not the box it was
 * drawn in.
 *
 * The mark is drawn in a 64×64 box it does not fill: the crest stops short of
 * the top and the wings of the sides. Laying out against the box would put
 * invisible padding inside an exported file, which then reads as a mis-aligned
 * logo the moment anyone centres it. Only M/L/C/Z appear in the data above, all
 * absolute — the subset the mark is drawn with.
 */
function pathBounds(d) {
  const nums = (s) => s.match(/-?\d*\.?\d+/g)?.map(Number) ?? []
  let min = [Infinity, Infinity]
  let max = [-Infinity, -Infinity]
  const see = (x, y) => {
    min = [Math.min(min[0], x), Math.min(min[1], y)]
    max = [Math.max(max[0], x), Math.max(max[1], y)]
  }
  // A cubic can bulge past its endpoints, so it is sampled rather than read off
  // its control points — 32 steps is well inside a rounding error at any size
  // these files are used at.
  const cubic = (p0, p1, p2, p3) => {
    for (let i = 0; i <= 32; i++) {
      const t = i / 32
      const u = 1 - t
      see(
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      )
    }
  }

  let cur = [0, 0]
  for (const seg of d.match(/[MLCZ][^MLCZ]*/gi) ?? []) {
    const op = seg[0].toUpperCase()
    const v = nums(seg.slice(1))
    if (op === 'M' || op === 'L') {
      for (let i = 0; i + 1 < v.length; i += 2) {
        cur = [v[i], v[i + 1]]
        see(cur[0], cur[1])
      }
    } else if (op === 'C') {
      for (let i = 0; i + 5 < v.length; i += 6) {
        const next = [v[i + 4], v[i + 5]]
        cubic(cur, [v[i], v[i + 1]], [v[i + 2], v[i + 3]], next)
        cur = next
      }
    }
  }
  return { x: min[0], y: min[1], w: max[0] - min[0], h: max[1] - min[1] }
}

const markBounds = (() => {
  const all = MARK_PATHS.map((p) => pathBounds(p.d))
  const x = Math.min(...all.map((b) => b.x))
  const y = Math.min(...all.map((b) => b.y))
  return {
    x,
    y,
    w: Math.max(...all.map((b) => b.x + b.w)) - x,
    h: Math.max(...all.map((b) => b.y + b.h)) - y,
  }
})()

// ── Wordmark ─────────────────────────────────────────────────────────────────

/** Inter Bold as a static TTF. Fontsource ships woff2, which opentype.js cannot
 *  read, so it is decompressed first. Inter 700 and uppercase is exactly what
 *  the header renders (`font-bold uppercase`). */
async function loadInterBold() {
  const woff2 = readFileSync(
    require_.resolve('@fontsource/inter/files/inter-latin-700-normal.woff2'),
  )
  const ttf = Buffer.from(await decompress(woff2))
  return opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length))
}

/**
 * The wordmark as one outlined path, with the header's letter-spacing applied.
 *
 * opentype.js has no letter-spacing, so each glyph is placed by hand and the
 * tracking added to its advance. The LAST gap is dropped: CSS adds spacing after
 * every character including the final one, which in a browser is harmless
 * trailing air but in a tight logo box would be a sliver of blank on the right
 * that nobody can see and everybody has to compensate for.
 */
function wordmarkPath(font, text, fontSize, trackingEm) {
  const tracking = trackingEm * fontSize
  let x = 0
  let d = ''
  for (const ch of text) {
    const glyph = font.charToGlyph(ch)
    d += ` ${glyph.getPath(x, 0, fontSize).toPathData(3)}`
    x += (glyph.advanceWidth / font.unitsPerEm) * fontSize + tracking
  }
  return { d: d.trim(), advance: x - tracking }
}

// ── Composition ──────────────────────────────────────────────────────────────

/** The mark's paths, scaled and placed so its INK sits at (x, y) and is `h` tall. */
function markGroup(x, y, h, { flat = false } = {}) {
  const s = h / markBounds.h
  const tx = x - markBounds.x * s
  const ty = y - markBounds.y * s
  const body = MARK_PATHS.map(
    (p) => `      <path d="${p.d}"${p.light && !flat ? ` fill="${GOLD_LIGHT}"` : ''} />`,
  ).join('\n')
  return `    <g transform="translate(${r(tx)} ${r(ty)}) scale(${r(s, 5)})" fill="${GOLD}">\n${body}\n    </g>`
}

const r = (n, p = 2) => Number(n.toFixed(p))

const svg = (w, h, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" role="img" aria-label="${title}">
  <title>${title}</title>
${body}
</svg>
`

async function main() {
  const font = await loadInterBold()
  const capHeight = font.tables.os2.sCapHeight / font.unitsPerEm

  mkdirSync(OUT, { recursive: true })
  const files = []
  /**
   * Writes the SVG and queues its raster sizes.
   *
   * `jpegOn` is the colour a JPEG of this asset is flattened onto. JPEG has no
   * transparency, so one has to be chosen rather than inherited — and the
   * choice is per asset, because a dark wordmark and a light one cannot share a
   * ground.
   */
  const write = (name, source, widths, jpegOn) => {
    writeFileSync(join(OUT, name), source)
    files.push({ name, widths, jpegOn })
  }

  // ── 1. The mark alone, on nothing ──────────────────────────────────────────
  // Trimmed to its own ink, so dropping it in a circle or a square leaves the
  // placer in charge of the padding instead of fighting 64-box air.
  const MARK = 512
  const markW = (markBounds.w / markBounds.h) * MARK
  write(
    'phoenix-mark.svg',
    svg(markW, MARK, 'Phoenix Power Universe', markGroup(0, 0, MARK)),
    [512, 1024],
    WHITE,
  )

  // ── 2. Square: the mark on the brand's near-black ─────────────────────────
  // The avatar / app-icon form — a profile picture is cropped to a square
  // whatever you give it, so the square is drawn rather than left to chance.
  // The mark is centred on its INK, which sits a little high in its own box, so
  // this lands fractionally lower than a naive box-centre and looks right.
  const SQ = 512
  const sqMarkH = SQ * 0.72
  const sqMarkW = (markBounds.w / markBounds.h) * sqMarkH
  write(
    'phoenix-logo-square.svg',
    svg(
      SQ,
      SQ,
      'Phoenix Power Universe',
      `    <rect width="${SQ}" height="${SQ}" rx="${r(SQ * 10 / MARK_BOX)}" fill="${INK}" />\n` +
        markGroup((SQ - sqMarkW) / 2, (SQ - sqMarkH) / 2, sqMarkH),
    ),
    [512, 1024],
    // Flattened onto its OWN background, which turns the rounded corners into a
    // full-bleed ink square. A JPEG is a hard rectangle whatever is drawn in it,
    // so rounded corners on one can only ever show up as four pale notches.
    INK,
  )

  // ── 3. Horizontal: mark left, full wordmark right ─────────────────────────
  // The header's proportions, held to scale: a 28px mark beside 14px type with a
  // 10px gap, which is mark : type : gap = 1 : 0.5 : 0.357.
  const H = 112
  const markH = H
  const markW2 = (markBounds.w / markBounds.h) * markH
  const fontSize = markH * 0.5
  const gap = markH * 0.357
  const word = wordmarkPath(font, WORDMARK, fontSize, 0.14)
  // Baseline placed so the CAPS are optically centred on the mark. Inter's
  // em box is taller than its capitals and this wordmark has no descenders, so
  // centring the font's line box instead would ride visibly high.
  const baseline = H / 2 + (capHeight * fontSize) / 2
  const textX = markW2 + gap
  const totalW = textX + word.advance

  for (const [name, fill, ground] of [
    // White, not --color-paper: this is the file that goes into a letterhead or
    // a Word document, and the brand's off-white would show there as a faintly
    // grey box on the page. The dark one keeps the brand's own near-black,
    // which is the surface it is designed against.
    ['phoenix-logo-horizontal.svg', INK, WHITE],
    ['phoenix-logo-horizontal-dark.svg', PAPER, INK],
  ]) {
    write(
      name,
      svg(
        totalW,
        H,
        'Phoenix Power Universe',
        `${markGroup(0, 0, markH)}\n` +
          `    <path transform="translate(${r(textX)} ${r(baseline)})" fill="${fill}" d="${word.d}" />`,
      ),
      [1200, 2400],
      ground,
    )
  }

  // ── PNG ───────────────────────────────────────────────────────────────────
  // Rendered from the SVG at a high density and then resized DOWN, so the curves
  // are resolved well above the output size rather than at it. PNG, not JPEG:
  // the lockups are transparent, and a JPEG would put a white box around the
  // bird on every dark surface it is placed on.
  for (const { name, widths, jpegOn } of files) {
    const source = readFileSync(join(OUT, name))
    const stem = name.replace(/\.svg$/, '')
    for (const width of widths) {
      const png = await sharp(source, { density: 600 })
        .resize({ width })
        .png({ compressionLevel: 9 })
        .toBuffer({ resolveWithObject: true })
      writeFileSync(join(OUT, `${stem}-${width}.png`), png.data)

      // The JPEG is built from the PNG that was just rendered, so the two are
      // the same pixels with a ground behind them rather than two independent
      // rasterisations that could disagree at the edges.
      //
      // CLEAR SPACE is added here and nowhere else. A transparent PNG blends
      // into whatever it is dropped on, so a tight crop is the flexible choice;
      // a JPEG brings its own rectangle, and a tight crop there puts the logo
      // hard against a visible edge. The margin is a quarter of the logo's own
      // height all round, which is the clear space the brand sheet asks for.
      // The square is exempt: its ink field already IS its clear space, and
      // padding it again would shrink the bird inside its own icon.
      const pad = jpegOn === INK && stem.endsWith('square')
        ? 0
        : Math.round(png.info.height * 0.25)
      await sharp(png.data)
        .extend({ top: pad, bottom: pad, left: pad, right: pad, background: jpegOn })
        .flatten({ background: jpegOn })
        // 4:4:4, not the default 4:2:0: chroma subsampling smears colour across
        // neighbouring pixels, and this image is almost entirely hard gold edges
        // against a flat ground - exactly what it damages most.
        .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
        .toFile(join(OUT, `${stem}-${width}.jpg`))
    }
  }

  const n = files.reduce((t, f) => t + f.widths.length, 0)
  console.log(`public/brand — ${files.length} SVG + ${n} PNG + ${n} JPEG`)
  for (const { name, widths, jpegOn } of files) {
    console.log(`  ${name}  (${widths.join(', ')} — jpeg on ${jpegOn})`)
  }
  console.log(`\nHorizontal lockup: ${r(totalW)} × ${H} (${r(totalW / H)}:1)`)
}

await main()
