'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, FolderPlus, Folder, RefreshCw } from "lucide-react";
import { fetchCurrentPrices } from "@/app/actions";

interface WatchlistItem {
    id: string;
    symbol: string;
    buyPrice: number;
    quantity: number;
    addedAt: number;
    currentPrice?: number;
    high?: number;
    low?: number;
}

interface Portfolio {
    id: string;
    name: string;
    items: WatchlistItem[];
}

export function Watchlist() {
    // State
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // UI State
    const [isAddingStock, setIsAddingStock] = useState(false);
    const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Forms
    const [stockSymbol, setStockSymbol] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [newPortfolioName, setNewPortfolioName] = useState('');

    // Load & Migrate
    useEffect(() => {
        const savedPortfolios = localStorage.getItem('smart_invest_portfolios');
        const oldWatchlist = localStorage.getItem('smart_invest_watchlist');

        if (savedPortfolios) {
            const parsed = JSON.parse(savedPortfolios);
            setPortfolios(parsed);
            if (parsed.length > 0) setActiveId(parsed[0].id);
        } else if (oldWatchlist) {
            // Migration
            const oldItems = JSON.parse(oldWatchlist);
            const defaultPortfolio: Portfolio = {
                id: Date.now().toString(),
                name: 'Main Portfolio',
                items: oldItems
            };
            setPortfolios([defaultPortfolio]);
            setActiveId(defaultPortfolio.id);
            localStorage.removeItem('smart_invest_watchlist'); // Clean up
        } else {
            // Init empty
            const defaultPortfolio: Portfolio = {
                id: Date.now().toString(),
                name: 'My First Portfolio',
                items: []
            };
            setPortfolios([defaultPortfolio]);
            setActiveId(defaultPortfolio.id);
            setPortfolios([defaultPortfolio]);
            setActiveId(defaultPortfolio.id);
        }
    }, []);

    // Auto-refresh prices on load (once portfolios are set)
    useEffect(() => {
        if (portfolios.length > 0 && !loading) {
            // We only want to do this once on mount/initial load really, 
            // but doing it when portfolios change might cause loops if not careful.
            // Since we update portfolios in refreshPrices, we must be careful.
            // Let's rely on a ref or just checking if currentPrice is missing/stale? 
            // Simplest for now: Just call it if we have items.
            // Actually, best to expose a manual "refresh" effect or just call it 
            // BUT we can't easily distinguish between "User added stock" vs "App loaded".
            // Let's use a timeout/debounce or just a mount check.

            // BETTER: Just call refreshPrices() in the FIRST useEffect? 
            // No, verify state is set first.
        }
    }, []);

    // Better approach: Trigger once when activeId is first set?
    useEffect(() => {
        if (activeId && portfolios.length > 0) {
            // We can't easily detect "first load" vs "switch". 
            // But switching portfolios SHOULD probably refresh prices? 
            // Or at least allow the user to see cached. 
            // Let's stick to manual refresh OR refresh on mount.
            // To refresh on mount:
            const timer = setTimeout(() => {
                refreshPrices();
            }, 1000); // Small delay to ensure state is ready
            return () => clearTimeout(timer);
        }
    }, [activeId]); // Refresh when switching portfolios? That's good UX.

    // Persist
    useEffect(() => {
        if (portfolios.length > 0) {
            localStorage.setItem('smart_invest_portfolios', JSON.stringify(portfolios));
        }
    }, [portfolios]);

    const activePortfolio = portfolios.find(p => p.id === activeId) || portfolios[0];

    // --- Actions ---

    const createPortfolio = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPortfolioName) return;
        const newP: Portfolio = {
            id: Date.now().toString(),
            name: newPortfolioName,
            items: []
        };
        setPortfolios([...portfolios, newP]);
        setActiveId(newP.id);
        setNewPortfolioName('');
        setIsCreatingPortfolio(false);
    };

    const addStock = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activePortfolio) return;

        const newItem: WatchlistItem = {
            id: Date.now().toString(),
            symbol: stockSymbol.toUpperCase(),
            buyPrice: parseFloat(buyPrice),
            quantity: parseFloat(quantity),
            addedAt: Date.now(),
            currentPrice: parseFloat(buyPrice)
        };

        const updatedPortfolios = portfolios.map(p => {
            if (p.id === activeId) {
                return { ...p, items: [...p.items, newItem] };
            }
            return p;
        });

        setPortfolios(updatedPortfolios);
        setStockSymbol('');
        setBuyPrice('');
        setQuantity('');
        setIsAddingStock(false);

        // Trigger fetch for simple UX
        refreshPrices(updatedPortfolios);
    };

    const removeStock = (itemId: string) => {
        const updatedPortfolios = portfolios.map(p => {
            if (p.id === activeId) {
                return { ...p, items: p.items.filter(i => i.id !== itemId) };
            }
            return p;
        });
        setPortfolios(updatedPortfolios);
    };

    const deletePortfolio = (pid: string) => {
        if (portfolios.length <= 1) {
            alert("You must keep at least one portfolio.");
            return;
        }
        const updated = portfolios.filter(p => p.id !== pid);
        setPortfolios(updated);
        setActiveId(updated[0].id);
    };

    const refreshPrices = async (currentPortfolios = portfolios) => {
        const target = currentPortfolios.find(p => p.id === activeId);
        if (!target || target.items.length === 0) return;

        setLoading(true);
        try {
            const symbols = Array.from(new Set(target.items.map(i => i.symbol)));
            const latest = await fetchCurrentPrices(symbols);
            const priceMap = new Map(latest.map(l => [l.symbol, l]));

            const updatedPortfolios = currentPortfolios.map(p => {
                if (p.id === activeId) {
                    const newItems = p.items.map(item => {
                        const data = priceMap.get(item.symbol);
                        return {
                            ...item,
                            currentPrice: data?.price || item.currentPrice,
                            high: data?.high || item.high,
                            low: data?.low || item.low
                        };
                    });
                    return { ...p, items: newItems };
                }
                return p;
            });
            setPortfolios(updatedPortfolios);
        } finally {
            setLoading(false);
        }
    };

    // --- Calculations ---
    const items = activePortfolio?.items || [];
    const totalValue = items.reduce((acc, i) => acc + ((i.currentPrice || i.buyPrice) * i.quantity), 0);
    const totalInvested = items.reduce((acc, i) => acc + (i.buyPrice * i.quantity), 0);
    const totalPL = totalValue - totalInvested;
    const isProfitable = totalPL >= 0;

    if (!activePortfolio) return null;

    return (
        <div className="space-y-8">
            {/* Header & Portfolio Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 text-3xl font-bold text-white hover:text-green-400 transition-colors"
                    >
                        {activePortfolio.name}
                        <ChevronDown size={24} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                            {portfolios.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => { setActiveId(p.id); setIsDropdownOpen(false); }}
                                    className={`px-4 py-3 cursor-pointer flex justify-between items-center ${activeId === p.id ? 'bg-green-900/20 text-green-400' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder size={16} />
                                        <span className="truncate">{p.name}</span>
                                    </div>
                                    {portfolios.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deletePortfolio(p.id); }}
                                            className="text-gray-600 hover:text-red-500 p-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div
                                onClick={() => { setIsCreatingPortfolio(true); setIsDropdownOpen(false); }}
                                className="px-4 py-3 border-t border-gray-800 text-green-500 hover:bg-gray-800 cursor-pointer flex items-center gap-2 font-medium"
                            >
                                <FolderPlus size={16} /> Create New List
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => refreshPrices()}
                        className={`p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => setIsAddingStock(!isAddingStock)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-bold shadow-lg shadow-green-900/20"
                    >
                        <Plus size={18} /> Add Stock
                    </button>
                </div>
            </div>

            {/* Create Portfolio Modal/Inline */}
            {isCreatingPortfolio && (
                <Card className="border-green-500/30 bg-gray-900/80 backdrop-blur">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Create New Watchlist</h3>
                        <form onSubmit={createPortfolio} className="flex gap-4">
                            <input
                                value={newPortfolioName} onChange={e => setNewPortfolioName(e.target.value)}
                                className="flex-1 bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none"
                                placeholder="Portfolio Name (e.g. High Risk)" autoFocus
                            />
                            <button type="submit" className="px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500">
                                Create
                            </button>
                            <button type="button" onClick={() => setIsCreatingPortfolio(false)} className="px-4 text-gray-400 hover:text-white">
                                Cancel
                            </button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Total Invested</p>
                        <p className="text-3xl font-bold text-white tracking-tight">₹{totalInvested.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Current Value</p>
                        <div className="flex items-end gap-2">
                            <p className="text-3xl font-bold text-white tracking-tight">₹{totalValue.toLocaleString('en-IN')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`border-gray-800 backdrop-blur-sm ${isProfitable ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                    <CardContent className="p-6">
                        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Total Return</p>
                        <div className={`flex items-center gap-2 text-3xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfitable ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                            <span>{isProfitable ? '+' : ''}₹{Math.abs(totalPL).toLocaleString('en-IN')}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Stock Form */}
            {isAddingStock && (
                <div className="p-6 rounded-xl bg-gray-900 border border-gray-800 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Plus size={16} className="text-green-500" /> Add to {activePortfolio.name}</h3>
                    <form onSubmit={addStock} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block ml-1">Symbol</label>
                            <input
                                value={stockSymbol} onChange={e => setStockSymbol(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono uppercase"
                                placeholder="RELIANCE" required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block ml-1">Buy Price</label>
                            <input
                                type="number" step="0.01"
                                value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                                placeholder="0.00" required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1.5 block ml-1">Quantity</label>
                            <input
                                type="number"
                                value={quantity} onChange={e => setQuantity(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                                placeholder="10" required
                            />
                        </div>
                        <button type="submit" className="h-[50px] bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20">
                            Add Asset
                        </button>
                    </form>
                </div>
            )}

            {/* Stock List */}
            <div className="rounded-xl border border-gray-800 overflow-hidden bg-gray-900/20">
                <table className="w-full">
                    <thead className="bg-gray-900/80 text-xs uppercase tracking-wider text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4 text-left">Asset</th>
                            <th className="px-6 py-4 text-right">Holdings</th>
                            <th className="px-6 py-4 text-right">Market Price</th>
                            <th className="px-6 py-4 text-right">52W High/Low</th>
                            <th className="px-6 py-4 text-right">P/L</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-600">
                                            <FolderPlus size={24} />
                                        </div>
                                        <p>This portfolio is empty.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const curr = item.currentPrice || item.buyPrice;
                                const pl = (curr - item.buyPrice) * item.quantity;
                                const plPercent = ((curr - item.buyPrice) / item.buyPrice) * 100;
                                const isPos = pl >= 0;

                                return (
                                    <tr key={item.id} className="group hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-gray-400 text-xs">
                                                    {item.symbol[0]}
                                                </div>
                                                <span className="font-bold text-white">{item.symbol}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-white font-medium">{item.quantity}</div>
                                            <div className="text-gray-500 text-xs">Avg. ₹{item.buyPrice}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-white font-mono">₹{curr.toLocaleString('en-IN')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-xs text-gray-400">
                                                <span className="text-green-500/80">H: ₹{item.high?.toLocaleString('en-IN') || '-'}</span>
                                                <br />
                                                <span className="text-red-500/80">L: ₹{item.low?.toLocaleString('en-IN') || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`font-bold ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                                                {isPos ? '+' : ''}₹{Math.abs(pl).toFixed(0)}
                                            </div>
                                            <div className={`text-xs ${isPos ? 'text-green-500' : 'text-red-500'}`}>
                                                {plPercent.toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => removeStock(item.id)}
                                                className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
