type Env = {
	SECRET1?: string;
	SECRET2?: string;
};

export default {
	fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		if (url.pathname === "/secret") {
			const { SECRET1 = "", SECRET2 = "" } = env;
			return new Response(`${SECRET1} ${SECRET2}`);
		}

		return Response.json({
			...request,
			headers: Object.fromEntries(request.headers),
		});
	},
};
