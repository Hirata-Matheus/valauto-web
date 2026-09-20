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
