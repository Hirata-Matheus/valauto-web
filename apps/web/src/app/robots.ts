import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Telas de conta não têm valor de busca e podem carregar parâmetros.
      disallow: ['/api/', '/login', '/cadastro', '/verificar-email', '/auth/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
