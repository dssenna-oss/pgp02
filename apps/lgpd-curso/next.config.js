/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Banner "AMBIENTE DE TREINAMENTO" — não cachear pra evitar confusão
  // entre runs de turma.
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Training-Environment', value: 'true' },
      ],
    },
  ],
};

module.exports = nextConfig;
