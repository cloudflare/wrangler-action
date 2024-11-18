import { http, HttpResponse } from "msw";

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

					return HttpResponse.json(null);
				},
			),
		],
	};
}
