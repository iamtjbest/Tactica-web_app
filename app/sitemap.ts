import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: 'https://app.tactica.com.ng',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://app.tactica.com.ng/chat',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tactica.com.ng/fpl',
      lastModified: now,
      changeFrequency: 'daily', // FPL data changes constantly during the season
      priority: 0.9,
    },
    {
      url: 'https://app.tactica.com.ng/simulator',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tactica.com.ng/tactics',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tactica.com.ng/opponent',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tactica.com.ng/sandbox',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]
}
