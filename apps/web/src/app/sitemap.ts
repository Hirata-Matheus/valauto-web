import type { MetadataRoute } from 'next';
import { getRepository } from '@/lib/data';
import { siteUrl } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repository = await getRepository();
  const slugs = await repository.listVehicleSlugs();

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    ...slugs.map((slug) => ({
      url: `${siteUrl}/veiculos/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
