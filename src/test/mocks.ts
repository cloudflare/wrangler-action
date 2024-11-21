import { http, HttpResponse } from "msw";
import { z } from "zod";

export function mockGithubDeployments({
	githubUser,
	githubRepoName,
}: {
	githubUser: string;
	githubRepoName: string;
}) {
	return {
		handlers: [
			http.post(
				`https://api.github.com/repos/${githubUser}/${githubRepoName}/deployments`,
				async ({ request }) => {
					if (request.headers.get("Authorization") === null) {
						return HttpResponse.text("error: no auth token", { status: 400 });
					}
					const GithubDeploymentsRequest = z.object({
						auto_merge: z.literal(false),
						description: z.literal("Cloudflare Pages"),
						required_contexts: z.array(z.string()).length(0),
						environment: z.literal("production"),
						production_environment: z.literal(false),
					});
					// validate request body
					GithubDeploymentsRequest.parse(await request.json());

					return HttpResponse.json(null);
				},
			),
		],
	};
}
