import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on :${env.port}`);
  });
}

export default app;
