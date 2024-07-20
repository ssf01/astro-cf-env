import { generateCodeVerifier, generateState } from "arctic";
import { google } from "../../../lib/test";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await google().createAuthorizationURL(state, codeVerifier, {
		scopes: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		],
	});

	context.cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax",
	});
	context.cookies.set("google_code_verifier", codeVerifier, {
		secure: import.meta.env.PROD,
		path: "/",
		httpOnly: true,
		maxAge: 60 * 10, // 10 min
	});

	return context.redirect(url.toString());
}
