import type { NextConfig } from 'next'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const apiProxyTarget = process.env.MURIKA_API_PROXY_TARGET || 'http://localhost:8000'

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER

  return {
    distDir: isDev ? '.next-dev' : '.next',
    ...(isDev ? {} : { output: 'export' as const }),
    trailingSlash: false,
    images: { unoptimized: true },
    ...(isDev
      ? {
          async rewrites() {
            return {
              afterFiles: [
                {
                  source: '/api/:path*',
                  destination: `${apiProxyTarget}/api/:path*`
                },
                {
                  source: '/assets/:path*',
                  destination: `${apiProxyTarget}/assets/:path*`
                },
                {
                  source: '/login',
                  destination: '/'
                },
                {
                  source: '/logout',
                  destination: `${apiProxyTarget}/logout`
                }
              ]
            }
          }
        }
      : {})
  }
}
