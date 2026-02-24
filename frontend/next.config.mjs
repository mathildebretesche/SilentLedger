/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Dépendances optionnelles de WalletConnect/pino qui n'existent pas
    // dans ce projet – on les marque externe pour éviter les erreurs webpack.
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
