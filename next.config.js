/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SEO 최적화
  compress: true,
  poweredByHeader: false,
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['picsum.photos'], // 외부 이미지 도메인 추가
  },
}

module.exports = nextConfig
