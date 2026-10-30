import { execNpmScript, folders } from "../deps.ts";

export async function createDeclarationFile() {
  await execNpmScript("build:declarations", folders.tsMorph);
}
