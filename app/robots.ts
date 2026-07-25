import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No login/signup gate yet — every module route is public, so there's
      // nothing to block except internal API calls. Once auth ships, add
      // any newly-gated paths here (e.g. '/dashboard/').
      disallow: ['/api/'],
    },
    sitemap: 'https://app.tactica.com.ng/sitemap.xml',
  }
}
