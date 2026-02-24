/**
 * Knowledge Base Page
 * Semantic search with local caching and article previews
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  BookOpen, Search, Clock, Tag, ExternalLink, Star, Database,
  Trash2, RefreshCw, FileText, TrendingUp, Bookmark,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn, timeAgo, formatDate } from '@/lib/utils';
import { executeTool } from '@/services/mcpTools';
import { cacheArticle, getCachedArticle, getCacheStats, clearCache } from '@/services/kbCache';
import { useToast } from '@/components/ui/toast';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  score: number;
  url?: string;
  updatedAt: string;
  readTimeMin?: number;
  tags?: string[];
}

const CATEGORIES = ['all', 'corporate', 'tax', 'employment', 'property', 'general'];

const FEATURED_ARTICLES: Article[] = [
  { id: 'kb001', title: 'Late Filing Penalties — Annual Accounts (2024 Guide)', excerpt: 'Companies House levies automatic late filing penalties for accounts filed after their due date. For private companies, the penalty starts at £150 for up to one month late, rising to £1,500 for more than 6 months.', category: 'corporate', score: 1, updatedAt: '2024-01-15', readTimeMin: 5, tags: ['penalties', 'annual accounts', 'companies house'] },
  { id: 'kb002', title: 'Confirmation Statement — Everything You Need to Know', excerpt: 'Every UK company must file a confirmation statement (formerly annual return) once a year, within 14 days of the confirmation date. Failure to file can result in compulsory strike-off.', category: 'corporate', score: 1, updatedAt: '2024-02-01', readTimeMin: 4, tags: ['confirmation statement', 'filing'] },
  { id: 'kb003', title: 'HMRC Corporation Tax — Deadlines and Payment', excerpt: 'Corporation tax must be paid within 9 months and 1 day of your accounting period end. Returns are due within 12 months. Small companies may pay in a single instalment; large companies pay quarterly.', category: 'tax', score: 1, updatedAt: '2024-01-10', readTimeMin: 7, tags: ['corporation tax', 'HMRC', 'deadline'] },
  { id: 'kb004', title: 'Directors\' Duties Under the Companies Act 2006', excerpt: 'Company directors owe statutory duties under s171-177 of the Companies Act 2006, including acting within their powers, promoting the success of the company, and avoiding conflicts of interest.', category: 'corporate', score: 1, updatedAt: '2024-01-20', readTimeMin: 8, tags: ['directors', 'duties', 'companies act'] },
];

export default function KnowledgeBase() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const [cacheStats, setCacheStats] = useState(getCacheStats());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);

    try {
      const cacheKey = `search:${query}:${category}`;
      const cached = await getCachedArticle<Article[]>(cacheKey);
      if (cached) {
        setResults(cached);
        setSearched(true);
        toast.success('Results from cache');
        return;
      }

      type KBResult = { results: Array<{ id: string; title: string; excerpt: string; score: number; category?: string; updatedAt?: string }> };
      const rawResult = await executeTool('search_knowledge_base', {
        query,
        top_k: 8,
        ...(category !== 'all' ? { categories: [category] } : {}),
      });
      const res = (rawResult.output as KBResult) ?? { results: [] };

      const articles: Article[] = (res.results || []).map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category ?? 'general',
        score: r.score,
        updatedAt: r.updatedAt ?? new Date().toISOString(),
        readTimeMin: 5,
        tags: [],
      }));

      await cacheArticle(cacheKey, articles);
      setCacheStats(getCacheStats());
      setResults(articles);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, [query, category, toast]);

  const handleClearCache = async () => {
    await clearCache();
    setCacheStats(getCacheStats());
    toast.success('Cache cleared');
  };

  const displayArticles = searched ? results : FEATURED_ARTICLES;

  return (
    <DashboardLayout
      title="Knowledge Base"
      subtitle="Compliance and legal guidance — search powered by AI"
    >
      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            leftIcon={<Search className="w-3.5 h-3.5" />}
            placeholder="Search compliance articles, legislation, guidance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button variant="primary" onClick={handleSearch} loading={searching}>
            Search
          </Button>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn('px-3 py-1 text-xs rounded-full border capitalize shrink-0 transition-colors', category === cat ? 'bg-brand-purple border-brand-purple text-white' : 'border-white/10 text-gray-400 hover:text-white')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Articles List */}
        <div className={cn('space-y-3', selected ? 'lg:col-span-1' : 'lg:col-span-2')}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">
              {searched ? `${results.length} results` : 'Featured Articles'}
            </h2>
            {searched && (
              <button onClick={() => { setSearched(false); setResults([]); setQuery(''); }} className="text-xs text-gray-500 hover:text-white">
                Clear
              </button>
            )}
          </div>

          {displayArticles.map((article) => (
            <Card
              key={article.id}
              className={cn('cursor-pointer hover:border-white/20 transition-colors', selected?.id === article.id && 'border-brand-purple/50')}
              onClick={() => setSelected(article)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={article.category === 'corporate' ? 'purple' : article.category === 'tax' ? 'gold' : 'cyan'} className="text-[10px]">
                        {article.category}
                      </Badge>
                      {article.score < 1 && (
                        <Badge variant="gray" className="text-[10px]">
                          {Math.round(article.score * 100)}% match
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1 leading-tight">{article.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {article.readTimeMin ?? 5} min read
                      </span>
                      <span className="text-[10px] text-gray-600">{formatDate(article.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setBookmarked(prev => { const n = new Set(prev); n.has(article.id) ? n.delete(article.id) : n.add(article.id); return n; }); }}
                    className={cn('p-1 rounded transition-colors shrink-0', bookmarked.has(article.id) ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400')}
                  >
                    <Bookmark className="w-3.5 h-3.5" fill={bookmarked.has(article.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Side panel: article preview + cache stats */}
        <div className="space-y-4">
          {selected ? (
            <Card glow="purple">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="leading-snug">{selected.title}</CardTitle>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white shrink-0 text-xs">✕</button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant={selected.category === 'corporate' ? 'purple' : 'cyan'}>{selected.category}</Badge>
                  {selected.tags?.map((tag) => <Badge key={tag} variant="gray" className="text-[10px]">{tag}</Badge>)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 leading-relaxed mb-4">{selected.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.readTimeMin} min</span>
                  <span>Updated {formatDate(selected.updatedAt)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" className="flex-1" onClick={async () => { await cacheArticle(selected.id, selected); setCacheStats(getCacheStats()); toast.success('Cached for offline access'); }}>
                    <Database className="w-3.5 h-3.5 mr-1.5" /> Cache Offline
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Quick Search Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-gray-400">
                  {[
                    'Try "confirmation statement deadline"',
                    'Search "VAT registration threshold"',
                    'Ask "what penalties for late accounts"',
                    'Look up "director disqualification rules"',
                  ].map((tip) => (
                    <li key={tip} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors" onClick={() => setQuery(tip)}>
                      <Search className="w-3 h-3 shrink-0 text-brand-purple" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Cache Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Offline Cache</CardTitle>
                <Button variant="ghost" size="xs" onClick={handleClearCache}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xl font-bold text-white">{cacheStats.count}</p>
                  <p className="text-[10px] text-gray-500">Cached articles</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xl font-bold text-white">{cacheStats.sizeKb}KB</p>
                  <p className="text-[10px] text-gray-500">Storage used</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-3 text-center">Articles cached locally for offline access</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
