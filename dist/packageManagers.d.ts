export interface PackageManager {
    install: string;
    exec: string;
    execNoInstall: string;
}
export declare function getPackageManager(name: string, { workingDirectory }?: {
    workingDirectory?: string;
}): {
    readonly install: "npm i";
    readonly exec: "npx";
    readonly execNoInstall: "npx --no-install";
} | {
    readonly install: "yarn add";
    readonly exec: "yarn";
    readonly execNoInstall: "yarn";
} | {
    readonly install: "pnpm add";
    readonly exec: "pnpm exec";
    readonly execNoInstall: "pnpm exec";
} | {
    readonly install: "bun i";
    readonly exec: "bunx";
    readonly execNoInstall: "bun run";
};
