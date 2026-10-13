import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

for (const file of walk(".next/static")) if (file.endsWith(".map")) rmSync(file);
