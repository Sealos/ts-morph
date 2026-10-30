import * as nodePath from "node:path";
import { fileURLToPath } from "node:url";
export const path = { ...nodePath, fromFileUrl: fileURLToPath };
export * as tsMorph from "ts-morph";
