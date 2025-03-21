import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  return {
    session: await event.locals.getSession()
  };
};

export const prerender = Boolean(process.env.PRERENDER);
