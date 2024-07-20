import db from "@astrojs/db";
import tailwind from "@astrojs/tailwind";
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	integrations: [
		db(),
		tailwind({
			nesting: true,
		}),
	],
	output: "server",
	adapter: cloudflare(),
	vite: {
		optimizeDeps: {
			exclude: ["astro:db"],
		},
		define: {
			"process.env.ASTRO_STUDIO_APP_TOKEN": JSON.stringify(
				process.env.ASTRO_STUDIO_APP_TOKEN,
			),
		},
	},
	experimental: {
		env: {
			schema: {
				GOOGLE_CLIENT_SECRET: envField.string({
					context: "server",
					access: "secret",
				}),
				GOOGLE_CLIENT_ID: envField.string({
					context: "server",
					access: "secret",
				}),
				GOOGLE_REDIRECT_URI: envField.string({
					context: "server",
					access: "secret",
				}),
			},
		},
	},
});
