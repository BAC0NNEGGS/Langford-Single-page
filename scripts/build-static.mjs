import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const accessKey = process.env.WEB3FORMS_ACCESS_KEY;

if (!accessKey) {
  throw new Error(
    "Missing WEB3FORMS_ACCESS_KEY. Add it to the Vercel project's environment variables before deploying."
  );
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/assets", { recursive: true });
const html = readFileSync("index.html", "utf8").replaceAll(
  "__WEB3FORMS_ACCESS_KEY__",
  accessKey
);
writeFileSync("dist/index.html", html);
cpSync("assets", "dist/assets", { recursive: true });
