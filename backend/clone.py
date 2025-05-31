import asyncio
from pyppeteer import launch

async def save_webpage(url, output_file):
    browser = await launch(headless=True, args=["--no-sandbox"])
    page = await browser.newPage()

    await page.goto(url, {'waitUntil': 'networkidle2'})

    html = await page.content()
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)

    await browser.close()

# Run it
url = "https://en.wikipedia.org/wiki/CRISPR"
output_path = "CRISPR_page.html"
asyncio.run(save_webpage(url, output_path))
