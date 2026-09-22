import { Result } from "better-result";

const previewUrl = process.argv.at(-1);

if (!previewUrl) {
	throw new Error(
		"Please provide the Workers Preview URL as an argument when calling this program.",
	);
}

const result = await Result.tryPromise(
	async () => {
		const response = await fetch(previewUrl);

		if (!response.ok) {
			throw new Error(
				`Workers Preview is not healthy. HTTP status: ${response.status}`,
			);
		}

		return response.status;
	},
	{
		retry: {
			times: 5,
			delayMs: 2000,
			backoff: "exponential",
		},
	},
);

result.match({
	ok: (status) => {
		console.log(`Workers Preview is healthy. HTTP status: ${status}`);
	},
	err: (error) => {
		console.error(error);
		process.exit(1);
	},
});
