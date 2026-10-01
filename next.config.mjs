/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: "renewed",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
