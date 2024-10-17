import { open, readdir } from 'fs/promises';

interface OutputEntryBase<T extends string> {
	version: number;
	type: T;
}

export interface OutputEntryPagesDeployment
	extends OutputEntryBase<"pages-deploy"> {
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


//COURT: name this better. same for the file
export async function getWranglerArtifacts(artifactDirectory: string): Promise<OutputEntryPagesDeployment | null> {

	// read files in asset directory
	const dirent = await readdir(artifactDirectory, {
		withFileTypes: true,
		recursive: false,
	})

	//  Match files to wrangler-output-<timestamp>-xxxxxx.json
    // COURT test comment
	const regex = new RegExp(
		/^wrangler-output-[\d]{4}-[\d]{2}-[\d]{2}_[\d]{2}-[\d]{2}-[\d]{2}_[\d]{3}-[A-Fa-f0-9]{6}\.json$/
	)
	const artifactFilePaths = dirent
		.filter((d) => d.name.match(regex))
		.map((d) => `${artifactDirectory}/${d.name}`)

	for (let i = 0; i < artifactFilePaths.length; i++) {
		const file = await open(artifactFilePaths[i])

		for await (const line of file.readLines()) {
			// parse each line of output
			const output = JSON.parse(line)

			// try-catch around zod parsing so we can fail open
			try {
				if (output.type === 'pages-deploy-detailed') {
                    //COURT: Assuming in the context of the action, for a specific pages command we'll want to output the first instance we see?
                    return output
					}
			} catch (err) {
				//COURT: what to do here??
			}
		}

		await file.close()
	}

	return null
}