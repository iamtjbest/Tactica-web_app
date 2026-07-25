import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://app.tactica.com.ng',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Add any other genuinely PUBLIC routes here (e.g. a public login page,
    // a public pricing/plans page inside the app, etc). Most of the six
    // engine modules are login-gated, so there may not be much else worth
    // listing here — tell me if there's a public-facing route beyond the
    // homepage and I'll add it.
  ]
}
