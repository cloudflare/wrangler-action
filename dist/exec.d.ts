import { exec as _childProcessExec } from "node:child_process";
export { exec } from "@actions/exec";
declare const childProcessExec: typeof _childProcessExec.__promisify__;
export declare function execShell(command: string, { silent, ...options }?: Parameters<typeof childProcessExec>[1] & {
    silent?: boolean;
}): Promise<number | null>;
