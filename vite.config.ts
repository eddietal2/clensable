import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: true
	},
	plugins: [tailwindcss(), sveltekit()],
	test: {
  expect: { requireAssertions: true },
  projects: [
    {
      extends: './vite.config.ts',
      test: {
        name: 'client',
        environment: 'browser',
        browser: {
          enabled: true,
          provider: 'playwright',
          instances: [{ browser: 'chromium' }]
        },
        include: ['tests/client/**/*.spec.ts', 'tests/client/**/*.test.ts'],
        setupFiles: ['./vitest-setup-client.ts']
      }
    },
    {
      extends: './vite.config.ts',
      test: {
        name: 'server',
        environment: 'node',
        include: ['tests/api/**/*.test.ts', 'tests/lib/**/*.test.ts'],
        exclude: ['tests/client/**/*']
      }
    }
  ]
	}
});
