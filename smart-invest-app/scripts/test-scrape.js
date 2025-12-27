const cheerio = require('cheerio');

async function testScrape(ticker) {
    console.log(`Testing scrape for ${ticker}...`);
    try {
        const url = `https://www.screener.in/company/${ticker}/`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        console.log("Page Title:", $('h1').text().trim());

        $('.company-ratios ul li').each((i, el) => {
            const name = $(el).find('.name').text().trim();
            const valueStr = $(el).find('.value').text().trim();
            console.log(`Found Ratio: [${name}] -> [${valueStr}]`);

            if (name === 'High / Low') {
                const parts = valueStr.split('/');
                console.log("High/Low Parts:", parts);
            }
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

testScrape('INFY');
testScrape('RELIANCE');
