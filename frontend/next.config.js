/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.anili.st",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
    ],
  },
};

module.exports = nextConfig;
