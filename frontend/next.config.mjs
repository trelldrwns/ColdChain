/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://coldchain-nwi7.onrender.com/api/:path*'
      },
      {
        source: '/auth/:path*',
        destination: 'https://coldchain-nwi7.onrender.com/auth/:path*'
      },
      {
        source: '/socket.io/:path*',
        destination: 'https://coldchain-nwi7.onrender.com/socket.io/:path*'
      }
    ];
  }
};

export default nextConfig;
