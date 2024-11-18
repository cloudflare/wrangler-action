type Env = {
	SECRET1?: string;
	SECRET2?: string;
};

export default {
	fetch(request: Request, env: Env) {
		const url = new URL(request.url);

		if (url.pathname === "/secret-health-check") {
			const { SECRET1, SECRET2 } = env;

			if (SECRET1 !== "SECRET_1_VALUE" || SECRET2 !== "SECRET_2_VALUE") {
				throw new Error("SECRET1 or SECRET2 is not defined");
			}

			return new Response("OK");
		}

		return Response.json({
			...request,
			headers: Object.fromEntries(request.headers),
		});
	},
};
