// Edit of the desk photo (IMG_1075.HEIC, 4284x5712): blur the client's name on the iPad
// while the wireframe still reads as a sketch, soften the terminal warning and Dock, level
// the table (5 degrees), crop 4:5 around the face, both hands, the iPad and the laptop,
// and a natural warm lift. Coordinates are measured on a 1050px-wide preview of the
// original and scaled to the source, so they only fit this photo.
//
//   sips -s format jpeg ~/Downloads/IMG_1075.HEIC --out /tmp/desk.jpg
//   node scripts/photos/edit-desk-photo.mjs /tmp/desk.jpg /tmp/desk-edited.jpg -5 159,925,3853,4816
//   PHOTO=/tmp/desk-edited.jpg pnpm payload run scripts/import-desk-photo.ts
import sharp from 'sharp'

const [, , src, out, angle = '-5', cropArg] = process.argv
const S = 4284 / 1050
const pts = (list) => list.map(([x, y]) => `${Math.round(x * S)},${Math.round(y * S)}`).join(' ')

const orig = await sharp(src).rotate().toBuffer()
const { width, height } = await sharp(orig).metadata()

const maskOf = (polygon, feather) =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><polygon points="${pts(polygon)}" fill="#fff"/></svg>`,
    ),
  )
    .blur(feather)
    .toBuffer()

async function blurRegion(input, polygon, sigma, feather = 6) {
  const blurred = await sharp(input).blur(sigma).toBuffer()
  const cut = await sharp(blurred)
    .composite([{ input: await maskOf(polygon, feather), blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(input)
    .composite([{ input: cut }])
    .toBuffer()
}

// iPad: a light blur keeps the hand-drawn wireframe readable as a sketch (boxes, the phone
// frame) while its small text goes soft; the "De Bareel" title gets a strong blur.
let img = await blurRegion(
  orig,
  [
    [40, 893],
    [370, 903],
    [352, 1068],
    [32, 1060],
  ],
  7,
  4,
)
img = await blurRegion(
  img,
  [
    [132, 962],
    [214, 965],
    [212, 996],
    [130, 993],
  ],
  26,
  5,
)
img = await blurRegion(
  img,
  [
    [70, 918],
    [135, 920],
    [133, 1045],
    [66, 1043],
  ],
  12,
  4,
)
// Laptop: the code stays sharp; only the terminal warning and the Dock below it go soft.
// The mask starts a little lower and is feathered wide, so the soft area fades in under
// the code instead of starting at a visible line.
img = await blurRegion(
  img,
  [
    [468, 1052],
    [872, 1058],
    [836, 1214],
    [468, 1120],
  ],
  12,
  45,
)

// Straighten. The edges are copied outward first, so the two thin corners the rotation
// opens hold the nearest pixels (dark window, sweater, wall) instead of black; those
// corners are then softened so the copied streaks don't show.
const P = 400
const deg = Number(angle)
const rotatedPlain = await sharp(img).rotate(deg, { background: '#000' }).toBuffer()
const { width: rw, height: rh } = await sharp(rotatedPlain).metadata()
const rotatedExt = await sharp(
  await sharp(img).extend({ top: P, bottom: P, left: P, right: P, extendWith: 'copy' }).toBuffer(),
)
  .rotate(deg)
  .toBuffer()
const { width: ew, height: eh } = await sharp(rotatedExt).metadata()
const filled = await sharp(rotatedExt)
  .extract({
    left: Math.round((ew - rw) / 2),
    top: Math.round((eh - rh) / 2),
    width: rw,
    height: rh,
  })
  .toBuffer()
// Where the plain rotation is empty: soften the copied pixels there.
const coverage = await sharp({ create: { width, height, channels: 3, background: '#fff' } })
  .jpeg()
  .toBuffer()
const cornerMask = await sharp(coverage)
  .rotate(deg, { background: '#000' })
  .negate({ alpha: false })
  .blur(20)
  .extractChannel(0)
  .raw()
  .toBuffer()
const sharpPx = await sharp(filled).removeAlpha().raw().toBuffer()
const softPx = await sharp(filled).removeAlpha().blur(30).raw().toBuffer()
// Blend per pixel: the copied corners take the soft version, the photo stays as it is.
for (let i = 0; i < cornerMask.length; i++) {
  const a = cornerMask[i] / 255
  if (a === 0) continue
  for (let c = 0; c < 3; c++) {
    const j = i * 3 + c
    sharpPx[j] = Math.round(sharpPx[j] * (1 - a) + softPx[j] * a)
  }
}
const straight = await sharp(sharpPx, { raw: { width: rw, height: rh, channels: 3 } })
  .png()
  .toBuffer()

let pipe = sharp(straight)
if (cropArg) {
  const [l, t, w, h] = cropArg.split(',').map(Number)
  pipe = sharp(await pipe.toBuffer()).extract({ left: l, top: t, width: w, height: h })
}
await pipe
  // A natural lift: a little brighter, slightly warmer, nothing that reads as a filter.
  .modulate({ brightness: 1.07, saturation: 1.03 })
  .recomb([
    [1.03, 0, 0],
    [0, 1.0, 0],
    [0, 0, 0.955],
  ])
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(out)
const m = await sharp(out).metadata()
console.log(out, m.width, m.height, `rotated canvas ${rw}x${rh}`)
