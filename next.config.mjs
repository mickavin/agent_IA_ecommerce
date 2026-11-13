/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Résoudre l'erreur "Critical dependency" de Supabase Realtime
    config.module.exprContextCritical = false;
    return config;
  },
}

export default nextConfig
