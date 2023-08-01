const { execSync } = require("child_process");

function workerHealthCheck() {
	const url =
		"https://wrangler-action-test.devprod-testing7928.workers.dev/secret-health-check";

	const buffer = execSync(`curl ${url}`);

	const response = buffer.toString();

	response.includes("OK")
		? console.log(`Status: Worker is up! Secrets: ${response}`)
		: console.log(`Worker is down!`);

	return response;
}

workerHealthCheck();
