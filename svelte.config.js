import preprocess from "svelte-preprocess";
import adapterNode from "@sveltejs/adapter-node";
import adapterStatic from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/kit/vite";

const dev = process.argv.includes("dev");
const base = dev ? "" : process.env.BASE_PATH ?? "";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte"],

  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: [
    vitePreprocess(),
    preprocess({
      postcss: true
    })
  ],

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: process.env.PRERENDER ? adapterStatic({ strict: false }) : adapterNode(),
    paths: {
      base
    },
    prerender: {
      handleMissingId: "warn",
      handleHttpError: ({ path, referrer, message }) => {
        // TODO: Build auth pages. Currently using pages from Auth.js
        if (path.startsWith(base + "/auth")) {
          return;
        }

        throw new Error(message);
      }
    }
  }
};

export default config;
