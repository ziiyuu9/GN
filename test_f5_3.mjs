import { client, handle_file } from "@gradio/client";
import { writeFileSync } from "fs";

async function test() {
  console.log("Connecting to Hugging Face F5-TTS...");
  try {
    const app = await client("mrfakename/E2-F5-TTS");
    
    console.log("Generating audio...");
    const result = await app.predict("predict", [
      handle_file("./test_prompt.mp3"), // ref_audio
      "你好歡迎光臨", // ref_text
      "這是一個非常穩定的全新語音合成模型，F5 TTS 運作正常！", // gen_text
      true, // remove silences
    ]);
    
    console.log("Result:", result.data);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
