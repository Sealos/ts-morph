import { execFile } from "node:child_process";
import { promisify } from "node:util";

export async function execNpmScript(scriptName: string, cwd: string) {
  const result = await promisify(execFile)(process.platform === "win32" ? "npm.cmd" : "npm", ["run", scriptName], { cwd });
  return result.stdout;
}
