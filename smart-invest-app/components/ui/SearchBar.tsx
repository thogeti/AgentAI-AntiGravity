'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
    const [query, setQuery] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/stock/${query.toUpperCase()}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-lg mx-auto">
            <div className="relative flex items-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for stocks (e.g., RELIANCE.NS)..."
                    className="w-full h-14 pl-12 pr-4 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-lg shadow-lg hover:shadow-green-900/10"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-6 bg-green-600 hover:bg-green-500 text-white rounded-full font-medium transition-colors"
                >
                    Track
                </button>
            </div>
        </form>
    );
}
