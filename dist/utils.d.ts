import { WranglerActionConfig } from "./wranglerAction";
/**
 * A helper function to compare two semver versions. If the second arg is greater than the first arg, it returns true.
 */
export declare function semverCompare(version1: string, version2: string): boolean;
export declare function checkWorkingDirectory(workingDirectory?: string): string;
export declare function info(config: WranglerActionConfig, message: string, bypass?: boolean): void;
export declare function warn(config: WranglerActionConfig, message: string, bypass?: boolean): void;
export declare function error(config: WranglerActionConfig, message: string, bypass?: boolean): void;
