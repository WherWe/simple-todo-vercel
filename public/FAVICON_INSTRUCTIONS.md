# Favicon Generation Instructions

This app includes an SVG icon at `public/icon.svg`. To generate all required favicon formats:

## Option 1: Use an online tool (Easiest)

1. Go to https://realfavicongenerator.net/
2. Upload `public/icon.svg`
3. Download the package
4. Place files in `public/` directory:
   - `favicon.ico`
   - `apple-touch-icon.png` (180x180)
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)

## Option 2: Use ImageMagick (if installed)

```bash
# Install ImageMagick (macOS)
brew install imagemagick

# Generate PNG files
convert public/icon.svg -resize 192x192 public/icon-192.png
convert public/icon.svg -resize 512x512 public/icon-512.png
convert public/icon.svg -resize 180x180 public/apple-touch-icon.png
convert public/icon.svg -resize 32x32 public/favicon.ico
```

## Option 3: Create OG Image

For the Open Graph image (`/og-image.png`), create a 1200x630px image with:

- App name "todoish"
- Tagline "AI-powered task management"
- Gradient background (purple to pink)
- Checkmark icon

You can use Figma, Canva, or any design tool.

## Current Status

- ✅ SVG icon created
- ⏳ Need to generate: favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png
- ⏳ Need to create: og-image.png (for social media sharing)
