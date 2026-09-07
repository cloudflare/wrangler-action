import { access, open, readdir } from "fs/promises";
import { z } from "zod";

const OutputEntryBase = z.object({
	version: z.literal(1),
	type: z.string(),
});

export type OutputEntryPagesDeployment = z.infer<
	typeof OutputEntryPagesDeployment
>;
const OutputEntryPagesDeployment = OutputEntryBase.merge(
	z.object({
		type: z.literal("pages-deploy-detailed"),
		pages_project: z.string().nullable(),
		deployment_id: z.string().nullable(),
		url: z.string().optional(),
		alias: z.string().optional(),
		environment: z.enum(["production", "preview"]),
		// optional, added in wrangler@3.89.0
		production_branch: z.string().optional(),
		// optional, added in wrangler@3.89.0
		deployment_trigger: z
			.object({
				metadata: z.object({
					/** Commit hash of the deployment trigger metadata for the pages project */
					commit_hash: z.string(),
				}),
			})
			.optional(),
	}),
);

export type OutputEntryDeployment = z.infer<typeof OutputEntryDeployment>;
const OutputEntryDeployment = OutputEntryBase.merge(
	z.object({
		type: z.literal("deploy"),
		/** A list of URLs that represent the HTTP triggers associated with this deployment */
		/** basically, for wrangler-action purposes this is the deployment urls */
		targets: z.array(z.string()).optional(),
	}),
);

export type OutputEntryVersionUpload = z.infer<typeof OutputEntryVersionUpload>;
const OutputEntryVersionUpload = OutputEntryBase.merge(
	z.object({
		type: z.literal("version-upload"),
		/** The preview URL associated with this version upload */
		preview_url: z.string().optional(),
	}),
);

export type OutputEntryPreview = z.infer<typeof OutputEntryPreview>;
const OutputEntryPreview = OutputEntryBase.merge(
	z.object({
		type: z.literal("preview"),
		/** The name of the Worker */
		worker_name: z.string().nullable(),
		/** The ID of the Preview resource */
		preview_id: z.string(),
		/** The human-readable name of the Preview (typically the branch name) */
		preview_name: z.string(),
		/** The URL-safe slug of the Preview */
		preview_slug: z.string(),
		/** URLs associated with the Preview (e.g. branch preview URL) */
		preview_urls: z.array(z.string()).optional(),
		/** The ID of the deployment within this Preview */
		deployment_id: z.string(),
		/** Immutable URLs for this specific deployment */
		deployment_urls: z.array(z.string()).optional(),
	}),
);

export type SupportedOutputEntry = z.infer<typeof SupportedOutputEntry>;
const SupportedOutputEntry = z.discriminatedUnion("type", [
	OutputEntryPagesDeployment,
	OutputEntryDeployment,
	OutputEntryVersionUpload,
	OutputEntryPreview,
]);

/**
 * Parses file names in a directory to find wrangler artifact files
 *
 * @param artifactDirectory
 * @returns All artifact files from the directory
 */
export async function getWranglerArtifacts(
	artifactDirectory: string,
): Promise<string[]> {
	try {
		await access(artifactDirectory);
	} catch {
		return [];
	}

	// read files in asset directory
	const dirent = await readdir(artifactDirectory, {
		withFileTypes: true,
		recursive: false,
	});

	//  Match files to wrangler-output-<timestamp>-xxxxxx.json
	const regex = new RegExp(
		/^wrangler-output-[\d]{4}-[\d]{2}-[\d]{2}_[\d]{2}-[\d]{2}-[\d]{2}_[\d]{3}-[A-Fa-f0-9]{6}\.json$/,
	);
	const artifactFilePaths = dirent
		.filter((d) => d.name.match(regex))
		.map((d) => `${artifactDirectory}/${d.name}`);

	return artifactFilePaths;
}

/**
 * Searches for a supported wrangler OutputEntry
 *
 * @param artifactDirectory
 * @returns The first SupportedOutputEntry found within a wrangler artifact directory
 */
export async function getOutputEntry(
	artifactDirectory: string,
): Promise<SupportedOutputEntry | null> {
	const artifactFilePaths = await getWranglerArtifacts(artifactDirectory);

	for (const filePath of artifactFilePaths) {
		const file = await open(filePath, "r");
		try {
			for await (const line of file.readLines()) {
				try {
					// Attempt to parse and validate the JSON line against the union schema.
					// Assume, in the context of the action, the first OutputEntry seen will suffice
					return SupportedOutputEntry.parse(JSON.parse(line));
				} catch {
					// Skip lines that are invalid JSON or don't match any schema.
					continue;
				}
			}
		} finally {
			await file.close();
		}
	}

	return null;
}
