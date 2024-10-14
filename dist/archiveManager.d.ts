interface OutputEntryBase<T extends string> {
    version: number;
    type: T;
}
export interface OutputEntryPagesDeployment extends OutputEntryBase<"pages-deploy"> {
    version: 1;
    /** The name of the Pages project. */
    pages_project: string | null;
    /** A GUID that identifies this Pages deployment. */
    deployment_id: string | null;
    /** The URL associated with this deployment */
    url: string | undefined;
    /** The Alias url, if it exists */
    alias: string | undefined;
    /** The environment being deployed to */
    environment: "production" | "preview";
}
export declare function getWranglerArtifacts(artifactDirectory: string): Promise<OutputEntryPagesDeployment | null>;
export {};
