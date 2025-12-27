import { getStockQuote, getStockHistory, getStockNews } from "@/lib/api";
import { StockChart } from "@/components/StockChart";
import { NewsFeed } from "@/components/NewsFeed";
import { Card, CardContent } from "@/components/ui/Card";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: { ticker: string };
}

// Ensure params are awaited as per Next.js 15
export default async function StockPage({ params }: any) {
    // In Next.js 15, params might need to be awaited if they are promises (dynamic routes)
    // But usually in component signature it's valid. However, strictly it's:
    const { ticker } = await params;

    if (!ticker) notFound();

    // Parallel data fetching
    const [quote, history, news] = await Promise.all([
        getStockQuote(ticker),
        getStockHistory(ticker, '1mo'),
        getStockNews(ticker),
    ]);

    if (!quote) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Stock Not Found</h1>
                    <p className="text-gray-400 mb-4">Could not retrieve data for {ticker}</p>
                    <Link href="/" className="text-green-500 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    const isPositive = quote.change >= 0;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    const bgClass = isPositive ? "bg-green-500/10" : "bg-red-500/10";
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <main className="min-h-screen bg-[#030712] text-white pb-20">
            <div className="container mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back to Search
                </Link>

                {/* Header Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{quote.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-lg font-mono">{quote.symbol}</span>
                            <span className="text-sm px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                                {quote.currency}
                            </span>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-5xl font-bold tracking-tight mb-2">
                            ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`flex items-center md:justify-end gap-2 text-lg font-medium ${colorClass}`}>
                            <span className={`px-2 py-1 rounded ${bgClass} flex items-center gap-1`}>
                                <Icon size={18} />
                                {quote.change > 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                {/* content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Chart & Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        <StockChart data={history} ticker={quote.symbol} isPositive={isPositive} />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Market Cap" value={`₹${(quote.marketCap ? (quote.marketCap / 10000000).toFixed(2) + ' Cr' : 'N/A')}`} icon={DollarSign} />
                            <StatCard label="P/E Ratio" value={quote.peRatio?.toFixed(2) || 'N/A'} icon={Activity} />
                            <StatCard label="52W High" value={`₹${quote.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}`} icon={TrendingUp} />
                            <StatCard label="52W Low" value={`₹${quote.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}`} icon={TrendingDown} />
                        </div>
                    </div>

                    {/* Right Column: News */}
                    <div className="lg:col-span-1">
                        <NewsFeed news={news} />
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatCard({ label, value, icon: Icon }: any) {
    return (
        <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
            </div>
        </Card>
    )
}
