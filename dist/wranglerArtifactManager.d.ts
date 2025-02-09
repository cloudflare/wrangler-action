import { z } from "zod";
export type OutputEntryPagesDeployment = z.infer<typeof OutputEntryPagesDeployment>;
declare const OutputEntryPagesDeployment: z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"pages-deploy-detailed">;
    pages_project: z.ZodNullable<z.ZodString>;
    deployment_id: z.ZodNullable<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    alias: z.ZodOptional<z.ZodString>;
    environment: z.ZodEnum<["production", "preview"]>;
    production_branch: z.ZodOptional<z.ZodString>;
    deployment_trigger: z.ZodOptional<z.ZodObject<{
        metadata: z.ZodObject<{
            /** Commit hash of the deployment trigger metadata for the pages project */
            commit_hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            commit_hash: string;
        }, {
            commit_hash: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        metadata: {
            commit_hash: string;
        };
    }, {
        metadata: {
            commit_hash: string;
        };
    }>>;
}>, "strip", z.ZodTypeAny, {
    type: "pages-deploy-detailed";
    environment: "production" | "preview";
    version: 1;
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
    production_branch?: string | undefined;
    deployment_trigger?: {
        metadata: {
            commit_hash: string;
        };
    } | undefined;
}, {
    type: "pages-deploy-detailed";
    environment: "production" | "preview";
    version: 1;
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
    production_branch?: string | undefined;
    deployment_trigger?: {
        metadata: {
            commit_hash: string;
        };
    } | undefined;
}>;
export type OutputEntryDeployment = z.infer<typeof OutputEntryDeployment>;
declare const OutputEntryDeployment: z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"deploy">;
    /** A list of URLs that represent the HTTP triggers associated with this deployment */
    /** basically, for wrangler-action purposes this is the deployment urls */
    targets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}>, "strip", z.ZodTypeAny, {
    type: "deploy";
    version: 1;
    targets?: string[] | undefined;
}, {
    type: "deploy";
    version: 1;
    targets?: string[] | undefined;
}>;
export type OutputEntryVersionUpload = z.infer<typeof OutputEntryVersionUpload>;
declare const OutputEntryVersionUpload: z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"version-upload">;
    /** The preview URL associated with this version upload */
    preview_url: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    type: "version-upload";
    version: 1;
    preview_url?: string | undefined;
}, {
    type: "version-upload";
    version: 1;
    preview_url?: string | undefined;
}>;
export type SupportedOutputEntry = z.infer<typeof SupportedOutputEntry>;
declare const SupportedOutputEntry: z.ZodDiscriminatedUnion<"type", [z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"pages-deploy-detailed">;
    pages_project: z.ZodNullable<z.ZodString>;
    deployment_id: z.ZodNullable<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    alias: z.ZodOptional<z.ZodString>;
    environment: z.ZodEnum<["production", "preview"]>;
    production_branch: z.ZodOptional<z.ZodString>;
    deployment_trigger: z.ZodOptional<z.ZodObject<{
        metadata: z.ZodObject<{
            /** Commit hash of the deployment trigger metadata for the pages project */
            commit_hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            commit_hash: string;
        }, {
            commit_hash: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        metadata: {
            commit_hash: string;
        };
    }, {
        metadata: {
            commit_hash: string;
        };
    }>>;
}>, "strip", z.ZodTypeAny, {
    type: "pages-deploy-detailed";
    environment: "production" | "preview";
    version: 1;
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
    production_branch?: string | undefined;
    deployment_trigger?: {
        metadata: {
            commit_hash: string;
        };
    } | undefined;
}, {
    type: "pages-deploy-detailed";
    environment: "production" | "preview";
    version: 1;
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
    production_branch?: string | undefined;
    deployment_trigger?: {
        metadata: {
            commit_hash: string;
        };
    } | undefined;
}>, z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"deploy">;
    /** A list of URLs that represent the HTTP triggers associated with this deployment */
    /** basically, for wrangler-action purposes this is the deployment urls */
    targets: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}>, "strip", z.ZodTypeAny, {
    type: "deploy";
    version: 1;
    targets?: string[] | undefined;
}, {
    type: "deploy";
    version: 1;
    targets?: string[] | undefined;
}>, z.ZodObject<z.objectUtil.extendShape<{
    version: z.ZodLiteral<1>;
    type: z.ZodString;
}, {
    type: z.ZodLiteral<"version-upload">;
    /** The preview URL associated with this version upload */
    preview_url: z.ZodOptional<z.ZodString>;
}>, "strip", z.ZodTypeAny, {
    type: "version-upload";
    version: 1;
    preview_url?: string | undefined;
}, {
    type: "version-upload";
    version: 1;
    preview_url?: string | undefined;
}>]>;
/**
 * Parses file names in a directory to find wrangler artifact files
 *
 * @param artifactDirectory
 * @returns All artifact files from the directory
 */
export declare function getWranglerArtifacts(artifactDirectory: string): Promise<string[]>;
/**
 * Searches for a supported wrangler OutputEntry
 *
 * @param artifactDirectory
 * @returns The first SupportedOutputEntry found within a wrangler artifact directory
 */
export declare function getOutputEntry(artifactDirectory: string): Promise<SupportedOutputEntry | null>;
export {};
