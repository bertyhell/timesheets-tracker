import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:55577/docs-yaml',
  output: {
    path: './src/generated/api',
    clean: true,
  },
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@tanstack/react-query',
      queryOptions: true,
      mutationOptions: true,
    },
  ],
});
