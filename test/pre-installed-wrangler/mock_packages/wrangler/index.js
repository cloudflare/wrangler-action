#!/usr/bin/env node
"use strict";

const args = Array.from(process.argv);
const command = args.pop();
switch (command) {
	case "--version":
		console.log(`
⛅️ wrangler 1.1.1 (update available 1.2.3)
------------------------------------------`
		);
		process.exit(0);
	case "action-test":
		console.log("Test successful.");
		process.exit(0);
	default:
		console.error("Invalid command");
		process.exit(1);
}
