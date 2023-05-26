// @ts-check

import { promises as fs } from "fs";
import path from "path";

const config = {
  postDir: "cec",
  postRoute: "src/routes/post",
  assetRoute: "static/post",
  componentRoute: "src/lib/post",
  ext: {
    asset: ["jpg", "png", "webp", "avif"],
    post: ["md"],
    component: ["svelte"]
  }
};

/**
 * Get file type from its path name.
 *
 * @param {string} src Path of the file
 * @returns {keyof typeof config.ext} File type
 */
function getFileType(src) {
  // get rid of the dot
  let ext = path.extname(src).substring(1);
  for (let [type, exts] of Object.entries(config.ext)) {
    // @ts-ignore (`type` is obviously `keyof config.ext`)
    if (exts.includes(ext)) return type;
  }

  // for any other files
  return "asset";
}

/**
 * Get where the file route should be on the site. (Relative path from `cec`)
 *
 * @param {string} src Path of the file
 * @returns {string} Where the file should end up in
 */
function getPostRoute(src) {
  return path.relative("cec", src);
}

/**
 * Build a md post to their path in site route.
 *
 * @param {string} src Path of the post file
 */
async function mkPost(src) {
  let post = path.join(config.postRoute, getPostRoute(src));

  await fs.mkdir(post);
  await fs.copyFile(src, path.join(post, `+page.md`));

  console.log("Post: ", post);
}

/**
 * Copy a file to where it should be.
 * Destinations are determined by its file type.
 *
 * @param {string} src Path to the file
 */
async function cpFile(src) {
  let route = getPostRoute(src);

  switch (getFileType(src)) {
    case "post":
      await mkPost(src).catch(({ message }) => console.warn(message));
      break;
    case "asset":
      await fs
        .copyFile(src, path.join(config.assetRoute, route))
        .catch(({ message }) => console.warn(message));
      break;
    case "component":
      await fs
        .copyFile(src, path.join(config.componentRoute, route))
        .catch(({ message }) => console.warn(message));
      break;
  }
}

/**
 * Build md source files into site route.
 *
 * @param {string} src Source of the file directory
 */
async function buildDir(src) {
  let files = await fs.readdir(src, { withFileTypes: true });

  files.forEach((file) => {
    // file.name => path/to/post.md (actual route on the site)
    // fileSrc   => cec/path/to/post.md (relative route from the project root)
    const fileSrc = path.join(src, file.name);

    if (file.isDirectory()) {
      [config.postRoute, config.assetRoute, config.componentRoute].forEach((route) => {
        let dir = path.join(route, file.name);

        fs.mkdir(dir).catch(({ message }) => console.warn(message));
      });

      buildDir(fileSrc);
      return;
    }

    cpFile(fileSrc);
  });
}

async function clearRoutes() {
  console.log("Clearing posts...");

  for (let route of [config.postRoute, config.assetRoute, config.componentRoute]) {
    let files = await fs.readdir(route, { withFileTypes: true });

    for (let file of files) {
      if (file.isDirectory()) {
        await fs.rm(path.join(route, file.name), { recursive: true });
      } else {
        await fs.unlink(path.join(route, file.name));
      }
    }
  }
}

async function ensureRoutes() {
  for (let route of [config.postRoute, config.assetRoute, config.componentRoute]) {
    fs.mkdir(route).catch((err) => {
      if (err.code != "EEXIST") {
        throw err;
      }
    });
  }
}

await ensureRoutes();

const argFile = process.argv[2];

if (argFile) {
  await cpFile(argFile);
} else {
  await clearRoutes();
  await buildDir(config.postDir);
}
