import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ExternalLink } from "lucide-react";

interface NewsItem {
    id?: string;
    uuid?: string;
    title: string;
    publisher?: string;
    link: string;
    providerPublishTime?: number;
    thumbnail?: {
        resolutions?: { url: string }[]
    }
}

interface NewsFeedProps {
    news: any[]; // Using any to match yahoo-finance2 loose typing, or interface
}

export function NewsFeed({ news }: NewsFeedProps) {
    if (!news || news.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-gray-500">
                    No recent news found.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                Latest News
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
                {news.map((item: NewsItem, idx: number) => (
                    <Card key={item.uuid || idx} className="h-full hover:bg-gray-800/60 transition-colors group">
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <span className="text-xs font-medium text-green-400 bg-green-900/20 px-2 py-1 rounded-full border border-green-900/50">
                                    {item.publisher || "News"}
                                </span>
                                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white mb-2 line-clamp-2">
                                {item.title}
                            </h3>
                            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500">
                                <span>{item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toLocaleDateString() : 'Recent'}</span>
                            </div>
                        </a>
                    </Card>
                ))}
            </div>
        </div>
    );
}
