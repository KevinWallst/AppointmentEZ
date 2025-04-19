/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure server configuration
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
  // Ensure client knows server port
  publicRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
};

module.exports = nextConfig;
