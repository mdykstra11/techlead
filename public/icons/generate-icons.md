# PWA Icon Generation

The `manifest.json` references `icon-192.png` and `icon-512.png`.

Generate them from `icon.svg` using any of these methods:

## Option 1: npx (recommended)
```bash
npx sharp-cli -i icon.svg -o icon-192.png --resize 192
npx sharp-cli -i icon.svg -o icon-512.png --resize 512
```

## Option 2: Squoosh / Online tool
Upload `icon.svg` to https://squoosh.app and export as PNG at 192x192 and 512x512.

## Option 3: ImageMagick
```bash
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png
```

## Option 4: Node script
```js
const sharp = require('sharp');
sharp('icon.svg').resize(192).png().toFile('icon-192.png');
sharp('icon.svg').resize(512).png().toFile('icon-512.png');
```
