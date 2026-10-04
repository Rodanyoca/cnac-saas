/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Le serveur de développement et les builds de production ne doivent pas
  // écrire dans le même répertoire : sinon un build lancé pendant `next dev`
  // peut laisser la page HTML visible mais casser tous ses contrôles React.
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
}

export default nextConfig
