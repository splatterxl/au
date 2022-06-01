import * as fs from "node:fs/promises";

export async function* load<T>(dir: string): AsyncGenerator<[{ name: string; path: string; }, T]> {
  for (const file of await fs.readdir(dir)) {
    const path = `${dir}/${file}`;
    const stat = await fs.stat(path);

    if (stat.isDirectory()) {
      yield* await load<T>(path);
    } else {
      const name = file.replace(/\.js$/, "");
      const data = await import(path);

      yield [{ name, path }, data as T]
    }
  }
}
