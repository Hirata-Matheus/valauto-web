import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { siteUrl } from '@/lib/env';
import { QueryProvider } from '@/components/providers/query-provider';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ValAuto — Avaliação de Veículos',
    template: '%s · ValAuto',
  },
  description:
    'Compare veículos por nota em desempenho, conforto, segurança, economia e tecnologia. Avaliações de quem realmente usa.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'ValAuto',
    url: siteUrl,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#04110d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-token focus:bg-accent-400 focus:px-4 focus:py-2 focus:text-content-inverse"
        >
          Pular para o conteúdo
        </a>
        <QueryProvider>
          <SiteHeader />
          <main id="conteudo" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </QueryProvider>
      </body>
    </html>
  );
}
