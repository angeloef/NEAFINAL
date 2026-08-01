import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allJsonSchemas } from "../jsonSchema.js";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "json-schema");
mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries(allJsonSchemas())) {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(schema, null, 2) + "\n");
  console.log(`wrote json-schema/${name}.json`);
}
