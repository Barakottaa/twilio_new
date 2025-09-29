/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move to correct location (Next.js 15+)
  serverExternalPackages: ['sqlite3'],
  
  // Performance optimizations
  experimental: {
    // Reduce compilation overhead
    optimizeCss: false,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce module resolution overhead
      config.resolve.symlinks = false;
      config.resolve.cacheWithContext = false;
      
      // Optimize for development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    return config;
  },
  
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;