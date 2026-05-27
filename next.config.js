/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SEO 최적화
  compress: true,
  poweredByHeader: false,
  // TODO: Turbopack 안정화 후 제거
  typescript: {
    ignoreBuildErrors: true, // 임시: Turbopack TypeScript 검증 우회
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/study-korea',
        destination: '/forum',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
