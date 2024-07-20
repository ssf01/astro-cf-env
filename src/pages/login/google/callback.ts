import { lucia } from "../../../lib/auth";
import { google } from "../../../lib/test";
import { OAuth2RequestError } from "arctic";
import { generateId } from "lucia";
import { db, user, eq } from "astro:db";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	const code = context.url.searchParams.get("code");
	const state = context.url.searchParams.get("state");
	const storedState = context.cookies.get("google_oauth_state")?.value ?? null;
	const storedCodeVerifier =
		context.cookies.get("google_code_verifier")?.value ?? null;

	if (!code || !storedState || !storedCodeVerifier || state !== storedState) {
		return new Response(null, {
			status: 400,
		});
	}

	try {
		const tokens = await google().validateAuthorizationCode(
			code,
			storedCodeVerifier,
		);

		const googleUserResponse = await fetch(
			"https://openidconnect.googleapis.com/v1/userinfo",
			{
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`,
				},
			},
		);
		const googleUser: GoogleUser = await googleUserResponse.json();

		const existingUser = await db
			.select()
			.from(user)
			.where(eq(user.google_id, googleUser.sub));

		if (existingUser.length) {
			const session = await lucia.createSession(existingUser[0].id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			context.cookies.set(
				sessionCookie.name,
				sessionCookie.value,
				sessionCookie.attributes,
			);
			return context.redirect("/");
		}

		const userId = generateId(15);
		await db.insert(user).values({
			id: userId,
			email: googleUser.email,
			picture: googleUser.picture,
			name: googleUser.name,
			google_id: googleUser.sub.toString(),
		});

		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes,
		);
		return context.redirect("/");
	} catch (e) {
		console.error(e);
		if (
			e instanceof OAuth2RequestError &&
			e.message === "bad_verification_code"
		) {
			// invalid code
			return new Response(null, {
				status: 400,
			});
		}
		return new Response(null, {
			status: 500,
		});
	}

	// return new Response();
}

interface GoogleUser {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
}
