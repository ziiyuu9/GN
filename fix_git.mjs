import { readFileSync, writeFileSync } from "fs";

let content = readFileSync(".gitignore", "utf8");
// strip BOM if exists
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
// remove weird powershell encodings
content = content.replace(/\0/g, "");
if (!content.includes("source/node_modules")) {
  content += "\nsource/node_modules\n";
}
writeFileSync(".gitignore", content, "utf8");
