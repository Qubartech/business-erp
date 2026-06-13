import { createApp } from "./app.js";
import { env } from "./lib/env.js";

const app = createApp();
app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on :${env.port}`);
});
