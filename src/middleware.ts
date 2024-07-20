import { lucia } from "./lib/auth";
import { verifyRequestOrigin } from "lucia";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	console.log(
		"context.request.COOKIE",
		lucia.sessionCookieName,
		context.cookies.get(lucia.sessionCookieName)?.value,
	);
	// if (context.request.url.startsWith("/api")) {
	// 	return next();
	// }

	// if (context.request.method !== "GET") {
	// 	const originHeader = context.request.headers.get("Origin");
	// 	const hostHeader = context.request.headers.get("Host");
	// 	if (
	// 		!originHeader ||
	// 		!hostHeader ||
	// 		!verifyRequestOrigin(originHeader, [hostHeader])
	// 	) {
	// 		console.log("Invalid origin", originHeader, hostHeader);
	// 		return new Response(null, {
	// 			status: 403,
	// 		});
	// 	}
	// }

	const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
	if (!sessionId) {
		context.locals.user = null;
		context.locals.session = null;
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session?.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		context.cookies.set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes,
		);
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		context.cookies.set(
			sessionCookie.name,
			sessionCookie.value,
			sessionCookie.attributes,
		);
	}
	context.locals.session = session;
	context.locals.user = user;

	// console.log("context.locals", context.locals);
	console.log("Request URL", context.request.url);

	return next();
});
