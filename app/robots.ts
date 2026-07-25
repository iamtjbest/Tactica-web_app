import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Most of the engine sits behind login (tactics modules, chat, FPL
      // Scout), so there's usually little value in Google crawling them —
      // and it can even confuse rankings if login-walled pages get indexed.
      // Update these paths to match your actual protected routes.
      disallow: ['/api/', '/dashboard/', '/onboarding/'],
    },
    sitemap: 'https://app.tactica.com.ng/sitemap.xml',
  }
}
