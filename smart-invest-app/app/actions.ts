'use server';

import { getStockQuote } from "@/lib/api";

export async function fetchCurrentPrices(symbols: string[]) {
    // Fetch in parallel
    const results = await Promise.all(symbols.map(async (sym) => {
        try {
            const data = await getStockQuote(sym);
            return {
                symbol: sym,
                price: data?.price || 0,
                high: data?.fiftyTwoWeekHigh || 0,
                low: data?.fiftyTwoWeekLow || 0
            };
        } catch (error) {
            console.error(`Error fetching ${sym}:`, error);
            return { symbol: sym, price: 0, high: 0, low: 0 };
        }
    }));
    return results;
}
