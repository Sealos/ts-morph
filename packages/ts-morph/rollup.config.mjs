import { existsSync } from "node:fs";
import * as path from "node:path";

export default {
  input: "./dist-cg/main.js",
  external: id => !id.startsWith(".") && !id.startsWith("/"),
  output: { file: "./dist/ts-morph.js", format: "cjs", interop: "compat" },
  plugins: [{
    name: "extensionless-imports",
    resolveId(source, importer) {
      if (importer == null || !source.startsWith(".")) return null;
      const file = path.resolve(path.dirname(importer), source);
      for (const candidate of [file + ".js", path.join(file, "index.js")])
        if (existsSync(candidate)) return candidate;
      return null;
    },
  }],
};
