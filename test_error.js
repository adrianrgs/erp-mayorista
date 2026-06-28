import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Listen for console events
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
  
  console.log("Page loaded. Looking for Hotel...");
  await page.waitForSelector('#edit-hotel-btn-prop-01');
  await page.click('#edit-hotel-btn-prop-01');
  
  console.log("Hotel clicked. Looking for Tarifario tab...");
  await page.waitForSelector('#section-tab-tarifario');
  await page.click('#section-tab-tarifario');
  
  console.log("Tarifario tab clicked. Looking for Edit Plan button...");
  await page.waitForSelector('#edit-group-btn-Temporada-de-Vacaciones-de-Verano');
  await page.click('#edit-group-btn-Temporada-de-Vacaciones-de-Verano');
  
  console.log("Edit Plan button clicked. Waiting to see if crash happens...");
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
