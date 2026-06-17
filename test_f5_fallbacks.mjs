import { client } from "@gradio/client";

async function test(space) {
  console.log(`Testing ${space}...`);
  try {
    const app = await client(space);
    console.log(`Success for ${space}`);
  } catch (err) {
    console.error(`Error for ${space}:`, err.message);
  }
}

async function run() {
  await test("cocktailpeanut/E2-F5-TTS");
  await test("banditsmile/F5-TTS");
  await test("LeonEr/SWivid-F5-TTS");
}
run();
