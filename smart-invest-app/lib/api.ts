import * as cheerio from 'cheerio';

export interface StockData {
    symbol: string;
    price: number;
    currency: string;
    change: number;
    changePercent: number;
    name: string;
    marketCap?: number;
    peRatio?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
}

export interface ChartDataPoints {
    date: string;
    price: number;
}

const formatTicker = (ticker: string) => {
    // Screener uses just the symbol (e.g., RELIANCE), no .NS suffix usually.
    // If incoming is RELIANCE.NS, strip .NS
    return ticker.replace('.NS', '').replace('.BO', '').toUpperCase();
}

export const getStockQuote = async (ticker: string): Promise<StockData | null> => {
    try {
        const symbol = formatTicker(ticker);
        const url = `https://www.screener.in/company/${symbol}/`;

        // Explicitly set User-Agent to look like a browser
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) return null;

        const html = await response.text();
        const $ = cheerio.load(html);

        const name = $('h1').text().trim();
        if (!name) return null;

        // Screener "Top Ratios" extraction
        // List items: Current Price ₹ 1,234
        // We iterate li elements to find key keys
        let price = 0;
        let marketCap = 0;
        let high = 0;
        let low = 0;
        let pe = 0;

        $('.company-ratios ul li').each((i, el) => {
            const name = $(el).find('.name').text().trim();
            const valueStr = $(el).find('.value').text().replace(/₹/g, '').replace(/,/g, '').trim();
            const val = parseFloat(valueStr);

            if (name === 'Current Price') price = val;
            if (name === 'Market Cap') marketCap = val * 10000000;

            if (name === 'Stock P/E') pe = val;
            if (name === 'High / Low') {
                // value might be "1581 / 1115"
                // previously "₹ 1,581 / 1,115" -> we removed ₹ in valueStr.
                // So now valueStr is "1581 / 1115" (roughly)
                // Let's re-parse from raw text to be safe or split valueStr correctly
                // Actually, valueStr removed all commas. "1581 / 1115" -> "1581 / 1115"
                // But wait, replace(/,/g, '') removes commas.
                // "1,581 / 1,115" -> "1581 / 1115"
                const parts = valueStr.split('/');
                if (parts.length === 2) {
                    high = parseFloat(parts[0].trim());
                    low = parseFloat(parts[1].trim());
                }
            }
        });

        // Screener doesn't show "Change/Change%" in top ratios.
        // We might need to estimate it from chart data or prev close (not easily avail in top ratios)
        // WORKAROUND: For now, default change to 0 if not found, or try to scrape 'span.ink-red' / 'span.ink-green' if they exist for price changes elsewhere
        // Actually, let's fetch history to calculate change?
        // Optimization: Just return 0 change for now to unblock, or try to find it.

        // Attempt to calculate change from Chart API if we call it?
        // Let's defer change calc to the component or just leave 0 for safety for this iteration.

        return {
            symbol: symbol,
            price: price,
            currency: 'INR',
            change: 0, // Placeholder
            changePercent: 0, // Placeholder
            name: name,
            marketCap: marketCap,
            peRatio: pe,
            fiftyTwoWeekHigh: high,
            fiftyTwoWeekLow: low,
        };
    } catch (error) {
        console.error(`Failed to fetch Screener quote for ${ticker}:`, error);
        return null;
    }
};

export const getStockHistory = async (ticker: string, period: '1d' | '1mo' | '1y' = '1mo'): Promise<ChartDataPoints[]> => {
    try {
        const symbol = formatTicker(ticker);
        const url = `https://www.screener.in/company/${symbol}/`;

        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!response.ok) return [];
        const html = await response.text();

        // Regex for warehouse ID
        // <div id="company-info" data-warehouse-id="15392" ...>
        const match = html.match(/data-warehouse-id="(\d+)"/);
        if (!match) return [];

        const warehouseId = match[1];
        const chartUrl = `https://www.screener.in/api/company/${warehouseId}/chart/?q=Price-DMA50-DMA200-Volume&days=365`;
        // Screener 'days' param controls duration. '1mo' approx 30 days.
        const duration = period === '1mo' ? 30 : period === '1y' ? 365 : 7;

        const chartResp = await fetch(`https://www.screener.in/api/company/${warehouseId}/chart/?q=Price-DMA50-DMA200-Volume&days=${duration}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!chartResp.ok) return [];
        const json = await chartResp.json();

        // json.datasets[0].values is [[date_str, price], ...]
        // json.datasets[0].metric == "Price"

        const priceMetric = json.datasets.find((d: any) => d.metric === 'Price');
        if (!priceMetric) return [];

        return priceMetric.values.map((v: any[]) => ({
            date: v[0], // "2023-01-01"
            price: parseFloat(v[1])
        }));

    } catch (error) {
        console.error("History fetch failed:", error);
        return [];
    }
};

export const searchStocks = async (query: string) => {
    // Screener.in search API: https://www.screener.in/api/company/search/?q=reli
    try {
        const url = `https://www.screener.in/api/company/search/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();

        // json is [{ url: '/company/RELIANCE/', name: 'Reliance Industries Ltd' }, ...]
        return json.map((item: any) => ({
            symbol: item.url.split('/')[2], // get RELIANCE from /company/RELIANCE/
            shortName: item.name,
            longName: item.name,
            exchange: 'NSE/BSE'
        }));
    } catch (error) {
        return [];
    }
};

export const getStockNews = async (ticker: string) => {
    // Scrape announcements
    try {
        const symbol = formatTicker(ticker);
        const url = `https://www.screener.in/company/${symbol}/`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await response.text();
        const $ = cheerio.load(html);

        const news: any[] = [];
        // Selector might look like: #documents li.announcement
        // Let's try broad selection in the documents section

        // Screener structure: ul.list-links li a
        // We might simply grab links under "Annual Reports" or "Announcements"
        // Announcements ID usually #documents

        // Let's just create a generic link list for now from the 'documents' section
        $('#documents ul.list-links li').each((i, el) => {
            const title = $(el).find('a').text().trim();
            const link = $(el).find('a').attr('href');
            const date = $(el).find('span.ink-600').text().trim(); // Date often in span

            if (title && link) {
                news.push({
                    uuid: i.toString(),
                    title: title,
                    link: link.startsWith('http') ? link : `https://www.screener.in${link}`,
                    publisher: 'Screener',
                    providerPublishTime: null // Date parsing is complex, skip for MVP
                });
            }
        });

        return news.slice(0, 5);
    } catch (error) {
        return [];
    }
}
