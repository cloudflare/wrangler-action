import {
	exec as _childProcessExec,
	type ExecException,
} from "node:child_process";
import { EOL } from "node:os";
import { promisify } from "node:util";

export { exec } from "@actions/exec";

const childProcessExec = promisify(_childProcessExec);

type ExecAsyncException = ExecException & {
	stderr: string;
	stdout: string;
};

function isExecAsyncException(err: unknown): err is ExecAsyncException {
	return err instanceof Error && "code" in err && "stderr" in err;
}

export async function execShell(
	command: string,
	{
		silent = false,
		...options
	}: Parameters<typeof childProcessExec>[1] & { silent?: boolean } = {},
) {
	if (!silent) {
		process.stdout.write("[command]" + command + EOL);
	}

	try {
		const promise = childProcessExec(command, {
			...options,
		});

		const { child } = promise;

		if (!silent) {
			child.stdout?.on("data", (data: Buffer) => process.stdout.write(data));
			child.stderr?.on("data", (data: Buffer) => process.stderr.write(data));
		}

		await promise;
		return child.exitCode;
	} catch (err) {
		if (isExecAsyncException(err)) {
			process.stderr.write(err.stderr);
			throw new Error(`Process failed with exit code ${err.code}`);
		}

		throw err;
	}
}
