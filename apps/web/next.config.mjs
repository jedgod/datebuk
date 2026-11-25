import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default { 
  reactStrictMode: true,
  // Multiple local instances (user site and admin/staff portal) must not share
  // Next's development lock or generated asset manifest.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  turbopack: {
    root: dirname(dirname(__dirname)),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
};
