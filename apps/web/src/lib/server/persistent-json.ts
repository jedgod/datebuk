import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const storageRoot = join(process.cwd(), ".data");

export function readJsonStore<T>(name: string, fallback: T): T {
  const filePath = join(storageRoot, `${name}.json`);
  if (!existsSync(filePath)) return fallback;

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonStore<T>(name: string, value: T): void {
  const filePath = join(storageRoot, `${name}.json`);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}
