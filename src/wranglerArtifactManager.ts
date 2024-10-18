import { open, readdir } from "fs/promises";

interface OutputEntryBase<T extends string> {
	version: number;
	type: T;
}

export interface OutputEntryPagesDeployment
	extends OutputEntryBase<"pages-deploy-detailed"> {
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

/**
 * Parses file names in a directory to find wrangler artifact files
 *
 * @param artifactDirectory
 * @returns All artifact files from the directory
 */
export async function getWranglerArtifacts(
	artifactDirectory: string,
): Promise<string[]> {
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
		const file = await open(artifactFilePaths[i]);

		for await (const line of file.readLines()) {
			try {
				const output = JSON.parse(line);
				if (output.type === "pages-deploy-detailed") {
					// Assume, in the context of the action, the first detailed deploy instance seen will suffice
					return output;
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
