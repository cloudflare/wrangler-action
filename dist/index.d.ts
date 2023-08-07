declare function getNpxCmd(): "npx.cmd" | "npx";
/**
 * A helper function to compare two semver versions. If the second arg is greater than the first arg, it returns true.
 */
declare function semverCompare(version1: string, version2: string): boolean;
declare function checkWorkingDirectory(workingDirectory?: string): string | undefined;
declare function installWrangler(): void;
declare function authenticationSetup(): void;
declare function execCommands(commands: string[], cmdType: string): Promise<void>;
declare function uploadSecrets(): Promise<void>;
declare function wranglerCommands(): Promise<void>;
export { wranglerCommands, execCommands, uploadSecrets, authenticationSetup, installWrangler, checkWorkingDirectory, getNpxCmd, semverCompare, };
