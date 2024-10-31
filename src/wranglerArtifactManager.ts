import { access, open, readdir } from "fs/promises";
import { z } from "zod";

const OutputEntryBase = z.object({
	version: z.literal(1),
	type: z.string(),
});

const OutputEntryPagesDeployment = OutputEntryBase.merge(
	z.object({
		type: z.literal("pages-deploy-detailed"),
		pages_project: z.string().nullable(),
		deployment_id: z.string().nullable(),
		url: z.string().optional(),
		alias: z.string().optional(),
		environment: z.enum(["production", "preview"]),
	}),
);

type OutputEntryPagesDeployment = z.infer<typeof OutputEntryPagesDeployment>;

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
 * Searches for detailed wrangler output from a pages deploy
 *
 * @param artifactDirectory
 * @returns The first pages-output-detailed found within a wrangler artifact directory
 */
export async function getDetailedPagesDeployOutput(
	artifactDirectory: string,
): Promise<OutputEntryPagesDeployment | null> {
	const artifactFilePaths = await getWranglerArtifacts(artifactDirectory);

	for (let i = 0; i < artifactFilePaths.length; i++) {
		const file = await open(artifactFilePaths[i], "r");

		for await (const line of file.readLines()) {
			try {
				const output = JSON.parse(line);
				const parsedOutput = OutputEntryPagesDeployment.parse(output);
				if (parsedOutput.type === "pages-deploy-detailed") {
					// Assume, in the context of the action, the first detailed deploy instance seen will suffice
					return parsedOutput;
				}
			} catch (err) {
				// If the line can't be parsed, skip it
				continue;
			}
		}

		await file.close();
	}

	return null;
}
