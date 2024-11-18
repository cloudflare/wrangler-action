import { WranglerActionConfig } from "../wranglerAction";

export function getTestConfig({
	config = {},
}: {
	config?: Partial<WranglerActionConfig>;
} = {}): WranglerActionConfig {
	return Object.assign(
		{
			WRANGLER_VERSION: "3.81.0",
			didUserProvideWranglerVersion: false,
			secrets: [],
			workingDirectory: "/src/test/fixtures",
			CLOUDFLARE_API_TOKEN: "foo",
			CLOUDFLARE_ACCOUNT_ID: "bar",
			ENVIRONMENT: "dev",
			VARS: [],
			COMMANDS: [],
			QUIET_MODE: false,
			PACKAGE_MANAGER: "npm",
			WRANGLER_OUTPUT_DIR: "/tmp/wranglerArtifacts",
			GITHUB_TOKEN: "xxxxyy23213123132131",
		} as const satisfies WranglerActionConfig,
		config,
	);
}
