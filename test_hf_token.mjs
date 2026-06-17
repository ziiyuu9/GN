import { client } from "@gradio/client";

async function test() {
  try {
    const token = "hf_dummy1234567890";
    console.log("Connecting...");
    const app = await client("mrfakename/E2-F5-TTS", { hf_token: token });
    console.log("Config:", app.config);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
