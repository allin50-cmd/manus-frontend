import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/audit`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/law`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/compliance`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/sitemap`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
