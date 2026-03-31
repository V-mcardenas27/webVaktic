// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    // @ts-ignore
    adapter: vercel({
        webAnalytics: {
            enabled: true, // set to false when using @vercel/analytics@1.4.0
        },
    }),
});
