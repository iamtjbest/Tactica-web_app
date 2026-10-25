import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: 'https://app.tacticaengine.com',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://app.tacticaengine.com/chat',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/fpl',
      lastModified: now,
      changeFrequency: 'daily', // FPL data changes constantly during the season
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/simulator',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/tactics',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/opponent',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/sandbox',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://app.tacticaengine.com/nations',
      lastModified: now,
      changeFrequency: 'daily', // international break coverage changes daily right now
      priority: 0.9,
    },
  ]
}
