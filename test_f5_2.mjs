import { client } from "@gradio/client";

async function test() {
  try {
    const app = await client("mrfakename/E2-F5-TTS");
    const comps = app.config.components.filter(c => [0, 1, 2, 3, 4].includes(c.id));
    console.log(JSON.stringify(comps, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
