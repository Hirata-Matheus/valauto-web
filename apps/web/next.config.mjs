import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

// Monorepo: o Next so le .env* da pasta do app (apps/web), mas o .env.local
// vive na raiz do repositorio, compartilhado com o futuro apps/mobile.
//
// `forceReload` e obrigatorio: loadEnvConfig memoiza o resultado e o proprio
// Next ja o chamou para apps/web (sem achar nada) antes de avaliar este
// arquivo — sem forcar, esta chamada devolve o cache vazio e nao le a raiz.
// Variaveis ja presentes no ambiente real (Vercel, CI) seguem prevalecendo.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
nextEnv.loadEnvConfig(repoRoot, process.env.NODE_ENV !== 'production', console, true);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Os packages do monorepo sao publicados como TypeScript cru.
  transpilePackages: ['@valauto/shared', '@valauto/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
