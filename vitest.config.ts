import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Browser-side tests opt in with `// @vitest-environment happy-dom`
    environment: 'node',
  },
});
