import { client, handle_file } from "@gradio/client";
import { writeFileSync } from "fs";

async function test() {
  console.log("Downloading sample audio...");
  const ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&q=你好歡迎光臨&tl=zh-TW&client=tw-ob";
  const res = await fetch(ttsUrl);
  const mp3Buffer = Buffer.from(await res.arrayBuffer());
  const tmpPath = "./test_prompt.mp3";
  writeFileSync(tmpPath, mp3Buffer);

  console.log("Connecting to Hugging Face F5-TTS...");
  try {
    const app = await client("mrfakename/E2-F5-TTS");
    console.log("Connected!");
    
    // We need to check the API dependencies first
    const deps = app.config.dependencies;
    const predictDep = deps.find(d => d.api_name === "basic_tts" || d.api_name === "infer" || d.api_name === "predict");
    console.log("API spec:", JSON.stringify(predictDep, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
