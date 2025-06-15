// next.config.ts
import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // expose the basePath/assetPrefix here if you need it later
  // basePath: '/my-app',
  // assetPrefix: '/my-app/',

  webpack(config) {
    // 1) register the @public alias
    config.resolve.alias = {
      // preserve any existing aliases
      ...(config.resolve.alias ?? {}),
      '@public': path.resolve(__dirname, 'public'),
    }

    // 2) add SVGR so `.svg` imports work
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

export default nextConfig
