import { client } from "@gradio/client";

async function test() {
  console.log("Testing cocktailpeanut/E2-F5-TTS...");
  try {
    const app = await client("cocktailpeanut/E2-F5-TTS");
    console.log("Success:", app.config.space_id);
    const apiNames = app.config.dependencies.map(d => d.api_name).filter(Boolean);
    console.log("Endpoints:", apiNames);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
