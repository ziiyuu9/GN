import { client } from "@gradio/client";

async function test() {
  try {
    const app = await client("raajmaurya/SWivid-F5-TTS");
    console.log(JSON.stringify(app.config.dependencies.find(d => d.api_name === 'predict'), null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
