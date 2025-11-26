import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
    ...baseConfig,
    test: {
        ...baseConfig.test,
        include: ['src/test/e2e/**/*.e2e.test.ts'],
        testTimeout: 30000, // E2E tests may take longer
        hookTimeout: 30000,
        teardownTimeout: 10000,
        globals: true,
        environment: 'node',
        // Run E2E tests sequentially to avoid database conflicts
        maxConcurrency: 1,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
});
