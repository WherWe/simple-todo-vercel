/**
 * Generate favicon files from icon.svg
 * Run with: npx tsx scripts/generate-favicons.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

console.log("📦 Installing sharp for image generation...");
console.log("Run: npm install --save-dev sharp @types/sharp");
console.log("Then run: npx tsx scripts/generate-favicons.ts");

// Placeholder - actual implementation after sharp is installed
async function generateFavicons() {
  try {
    const sharp = require("sharp");
    const svgBuffer = readFileSync(join(process.cwd(), "public/icon.svg"));

    const sizes = [
      { size: 16, name: "favicon-16x16.png" },
      { size: 32, name: "favicon-32x32.png" },
      { size: 180, name: "apple-touch-icon.png" },
      { size: 192, name: "icon-192.png" },
      { size: 512, name: "icon-512.png" },
    ];

    for (const { size, name } of sizes) {
      await sharp(svgBuffer).resize(size, size).png().toFile(join(process.cwd(), "public", name));
      console.log(`✅ Generated ${name}`);
    }

    // Generate ICO (using 32x32)
    await sharp(svgBuffer).resize(32, 32).toFile(join(process.cwd(), "public/favicon.ico"));
    console.log("✅ Generated favicon.ico");

    console.log("🎉 All favicons generated successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("\n💡 Make sure to install sharp first: npm install --save-dev sharp");
  }
}

// Uncomment after installing sharp
// generateFavicons();

export {};
