import { getProject } from "./common/mod.ts";
import { printDiagnostics } from "./deps.ts";

using project = getProject();
const diagnostics = project.getPreEmitDiagnostics();

printDiagnostics(diagnostics);

console.log(`Found ${diagnostics.length} diagnostics.`);

if (diagnostics.length > 0)
  process.exitCode = 1;
