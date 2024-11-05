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
}>, "strip", z.ZodTypeAny, {
    environment: "production" | "preview";
    version: 1;
    type: "pages-deploy-detailed";
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
}, {
    environment: "production" | "preview";
    version: 1;
    type: "pages-deploy-detailed";
    pages_project: string | null;
    deployment_id: string | null;
    url?: string | undefined;
    alias?: string | undefined;
}>;
type OutputEntryPagesDeployment = z.infer<typeof OutputEntryPagesDeployment>;
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
