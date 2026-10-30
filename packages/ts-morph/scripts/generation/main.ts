import { InspectorFactory } from "../inspectors/mod.ts";
import { createDeclarationFile } from "./createDeclarationFile.ts";
import { createForEachStructureChild } from "./createForEachStructureChild.ts";
import { createGetStructureFunctions } from "./createGetStructureFunctions.ts";
import { createKindToNodeMappings } from "./createKindToNodeMappings.ts";
import { createNodeTypeGuards } from "./createNodeTypeGuards.ts";
import { createStructurePrinterFactory } from "./createStructurePrinterFactory.ts";
import { createStructureTypeGuards } from "./createStructureTypeGuards.ts";

const args = [...process.argv.slice(2)];
const originalArgs = [...args];

if (checkHasArg("create-get-structure-functions")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating get structure functions...");
  createGetStructureFunctions(inspector.getStructures());
  await inspector.getProject().save();
}
if (checkHasArg("create-type-guards")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating node type guards...");
  createNodeTypeGuards(inspector, tsInspector);
  await inspector.getProject().save();
}
if (checkHasArg("create-structure-printer-factory")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating structure printer factory...");
  createStructurePrinterFactory(inspector);
  await inspector.getProject().save();
}
if (checkHasArg("create-kind-to-node-mappings")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating kind to node mappings...");
  createKindToNodeMappings(inspector, tsInspector);
  await inspector.getProject().save();
}
if (checkHasExplicitArg("create-declaration-file")) {
  console.log("Creating declaration file...");
  await createDeclarationFile();
}
if (checkHasArg("create-for-each-structure-child")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating for each structure child...");
  createForEachStructureChild(inspector);
  await inspector.getProject().save();
}
if (checkHasArg("create-structure-type-guards")) {
  using factory = new InspectorFactory();
  const inspector = factory.getTsMorphInspector();
  const tsInspector = factory.getTsInspector();
  console.log("Creating structure type guards utility class...");
  createStructureTypeGuards(inspector);
  await inspector.getProject().save();
}

if (args.length > 0)
  console.error(`Unknown args: ${args}`);

function checkHasArg(argName: string) {
  if (originalArgs.length === 0)
    return true; // run all

  return checkHasExplicitArg(argName);
}

function checkHasExplicitArg(argName: string) {
  const index = args.indexOf(argName);
  if (index === -1)
    return false;

  args.splice(index, 1);
  return true;
}
