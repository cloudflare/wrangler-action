import { z } from "zod";
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
    stages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodEnum<["queued", "initialize", "clone_repo", "build", "deploy"]>;
        status: z.ZodEnum<["idle", "active", "canceled", "success", "failure", "skipped"]>;
        started_on: z.ZodNullable<z.ZodString>;
        ended_on: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "idle" | "active" | "canceled" | "success" | "failure" | "skipped";
        name: "deploy" | "queued" | "initialize" | "clone_repo" | "build";
        started_on: string | null;
        ended_on: string | null;
    }, {
        status: "idle" | "active" | "canceled" | "success" | "failure" | "skipped";
        name: "deploy" | "queued" | "initialize" | "clone_repo" | "build";
        started_on: string | null;
        ended_on: string | null;
    }>, "many">>;
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
    stages?: {
        status: "idle" | "active" | "canceled" | "success" | "failure" | "skipped";
        name: "deploy" | "queued" | "initialize" | "clone_repo" | "build";
        started_on: string | null;
        ended_on: string | null;
    }[] | undefined;
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
    stages?: {
        status: "idle" | "active" | "canceled" | "success" | "failure" | "skipped";
        name: "deploy" | "queued" | "initialize" | "clone_repo" | "build";
        started_on: string | null;
        ended_on: string | null;
    }[] | undefined;
    deployment_trigger?: {
        metadata: {
            commit_hash: string;
        };
    } | undefined;
}>;
export type OutputEntryPagesDeployment = z.infer<typeof OutputEntryPagesDeployment>;
/**
 * Parses file names in a directory to find wrangler artifact files
 *
 * @param artifactDirectory
 * @returns All artifact files from the directory
 */
export declare function getWranglerArtifacts(artifactDirectory: string): Promise<string[]>;
/**
 * Searches for detailed wrangler output from a pages deploy
 *
 * @param artifactDirectory
 * @returns The first pages-output-detailed found within a wrangler artifact directory
 */
export declare function getDetailedPagesDeployOutput(artifactDirectory: string): Promise<OutputEntryPagesDeployment | null>;
export {};
