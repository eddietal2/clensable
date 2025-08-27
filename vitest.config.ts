import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    // Use jsdom so Svelte's client-only lifecycle functions work
    environment: 'jsdom',

    // File to run before tests (optional, for setup like expect.extend)
    setupFiles: ['./vitest-client-setup.ts'],

    // Glob pattern for test files
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'tests/**/*.test.svelte'],

    // Disable SSR for component tests
    globals: true,

    // Enable DOM APIs like fetch, localStorage, etc.
    deps: {
      inline: [/svelte/, /@sveltejs/]
    },

    // Optional: run tests in parallel
    // threads: true
  }
});
