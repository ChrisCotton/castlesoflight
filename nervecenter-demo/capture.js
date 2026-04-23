const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets', 'screens');
const SCREENS_JSON_PATH = path.join(__dirname, 'screens.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read the screens config
const screensData = JSON.parse(fs.readFileSync(SCREENS_JSON_PATH, 'utf-8'));

async function capture() {
  console.log(`🚀 Starting Puppeteer to capture live screens from ${BASE_URL}...`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set a high-res desktop viewport
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  // NOTE: If you need auto-login, it would happen right here before the loop!
  
  for (const screen of screensData.screens) {
    if (!screen.urlPath) continue;
    
    const targetUrl = `${BASE_URL}${screen.urlPath}`;
    const fileName = path.basename(screen.imagePath);
    console.log(`📸 Capturing "${screen.title}" from ${targetUrl}...`);
    
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait an extra moment for any animations or data fetching
      await new Promise(r => setTimeout(r, 2000));
      
      const outputPath = path.join(OUTPUT_DIR, fileName);
      
      // Take full page screenshot
      await page.screenshot({ 
        path: outputPath, 
        fullPage: true 
      });
      console.log(`✅ Saved: ${outputPath}`);
    } catch (err) {
      console.error(`❌ Failed to capture ${screen.title}:`, err.message);
    }
  }

  await browser.close();
  console.log('🎉 All screenshots captured successfully! Remotion video is now up-to-date.');
}

capture().catch(console.error);
