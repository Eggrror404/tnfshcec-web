import fg from "fast-glob";
import fs from "fs/promises";
import yamlFront from "yaml-front-matter";
import yaml from "js-yaml";

const filePath = (postPath: string) => `cec/${postPath}.md`;

export async function listPosts(pattern = "**/*.md") {
  const list = await fg(pattern, { cwd: "cec" });

  // omit the `.md` part
  return list.map((path) => path.substring(0, path.length - 3));
}

export async function parsePost<B extends boolean = true>(
  path: string,
  withContent?: B
): Promise<App.PostData & (B extends true ? { md: string } : Record<string, never>)>;

export async function parsePost(path: string, withContent = true) {
  const file = await fs.readFile(filePath(path), { encoding: "utf8" });
  const { __content, ...fm } = yamlFront.loadFront(file);

  if (withContent) {
    return {
      ...fm,
      url: path,
      md: __content.trim()
    };
  }
  return {
    ...fm,
    url: path
  };
}

export async function deletePost(path: string) {
  console.log("DELETING POST", filePath(path));
  await fs.rm(filePath(path));
}

export async function savePost(path: string, data: App.PostData, content: string) {
  const { url, ...fmData } = data;
  const fm = Object.keys(fmData).length ? yaml.dump(fmData, { schema: yaml.JSON_SCHEMA }) : "";

  return writePost(filePath(path), fm, content.trim());
}

async function writePost(filePath: string, fm: string, content: string) {
  if (fm) {
    content = `---\n${fm}---\n\n${content}`;
  }

  content += "\n";

  await fs.writeFile(filePath, content);

  return content;
}