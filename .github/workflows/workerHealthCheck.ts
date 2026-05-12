import { Result } from "better-result";

async function workerHealthCheck(workerName) {
	const url = `https://${workerName}.devprod-testing7928.workers.dev/secret-health-check`;

	const response = await fetch(url);
	const text = await response.text();

	if (text.includes("OK")) {
		console.log(`Status: Worker is up! Response: ${text}`);
	} else {
		throw new Error(`Worker is down! Response: ${text}`);
	}

	return text;
}

const args = Array.from(process.argv);
const workerName = args.pop();

if (!workerName) {
	throw new Error(
		"Please provide the worker name as an argument when calling this program.",
	);
}

const result = await Result.tryPromise(() => workerHealthCheck(workerName), {
	retry: {
		times: 5,
		delayMs: 2000,
		backoff: "exponential",
	},
});

result.match({
	ok: () => {},
	err: (error) => {
		console.error(error);
		process.exit(1);
	},
});
