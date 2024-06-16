const { execSync } = require("child_process");

function workerHealthCheck(workerName) {
	const url = `https://${workerName}.devprod-testing7928.workers.dev/secret-health-check`;

	const buffer = execSync(`curl ${url}`);

	const response = buffer.toString();

	if (response.includes("OK")) {
		console.log(`Status: Worker is up! Response: ${response}`);
	} else {
		throw new Error(`Worker is down! Response: ${response}`);
	}

	return response;
}

const args = Array.from(process.argv);
const workerName = args.pop();

if (!workerName) {
	throw new Error(
		"Please provide the worker name as an argument when calling this program.",
	);
}

workerHealthCheck(workerName);
