/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure server configuration
  serverRuntimeConfig: {
    port: 3000,
  },
  // Ensure client knows server is on port 3000
  publicRuntimeConfig: {
    port: 3000,
  },
};

module.exports = nextConfig;
