const { test, expect } = require('playwright/test');

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});

test('goingvegan article has no horizontal overflow on mobile viewport', async ({ page }) => {
  await page.goto('https://kevinarmstrong.io/goingvegan/blog/how-many-animals-does-going-vegan-save-per-year/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForSelector('#blog-article-shell:not([hidden])', { timeout: 45000 });
  await page.waitForTimeout(2500);

  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const card = document.querySelector('.blog-article-card');
    const container = document.querySelector('.container');
    return {
      viewportWidth: window.innerWidth,
      htmlClientWidth: html.clientWidth,
      htmlScrollWidth: html.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      containerScrollWidth: container ? container.scrollWidth : null,
      cardScrollWidth: card ? card.scrollWidth : null,
      cardClientWidth: card ? card.clientWidth : null,
    };
  });

  console.log('metrics:', JSON.stringify(metrics));
  expect(metrics.htmlScrollWidth).toBeLessThanOrEqual(metrics.htmlClientWidth);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth);

  await page.screenshot({ path: '/tmp/mobile_verify_fullpage.png', fullPage: true });
});
