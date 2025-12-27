import { SearchBar } from "@/components/ui/SearchBar";
import { Watchlist } from "@/components/Watchlist";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export default function Home() {
  const trending = [
    { symbol: "RELIANCE.NS", name: "Reliance Industries", price: "2,985.45" }, // Static for demo/speed
    { symbol: "TCS.NS", name: "Tata Consultancy Svc", price: "4,120.10" },
    { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: "1,450.65" },
    { symbol: "INFY.NS", name: "Infosys Limited", price: "1,630.20" },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#030712] to-[#030712]">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/20 border border-green-900/50 text-green-500 text-sm font-medium mb-4">
            <TrendingUp size={16} />
            <span>Market Intelligence Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Invest with <span className="neon-text">Precision</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time analytics and insights for the Indian Equity Markets (BSE/NSE).
            Experience a new standard of financial tracking.
          </p>
        </div>

        <div className="mb-20">
          <SearchBar />
        </div>

        {/* Watchlist Section */}
        <div className="mb-20">
          <Watchlist />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Market Movers</h2>
            <button className="text-green-500 hover:text-green-400 flex items-center gap-1 text-sm font-medium transition-colors">
              View Leaderboard <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((stock) => (
              <Link href={`/stock/${stock.symbol}`} key={stock.symbol}>
                <Card className="h-full hover:bg-gray-800/60 transition-all cursor-pointer group border-gray-800/50 hover:border-green-500/30">
                  <CardContent className="p-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white group-hover:bg-green-900/20 group-hover:text-green-400 transition-colors">
                        {stock.symbol.substring(0, 1)}
                      </div>
                      <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-xs font-medium">
                        +1.2%
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold truncate">{stock.symbol.split('.')[0]}</h3>
                      <p className="text-gray-500 text-sm truncate">{stock.name}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-200">₹{stock.price}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
