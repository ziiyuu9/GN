import { client } from "@gradio/client";

async function test() {
  try {
    const app = await client("kevinwang676/CosyVoice-cpu");
    const endpoints = app.config.dependencies.map(d => ({ name: d.api_name, inputs: d.inputs, outputs: d.outputs }));
    console.log(JSON.stringify(endpoints, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
