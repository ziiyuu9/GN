import { client } from "@gradio/client";

async function test(space) {
  console.log(`Testing ${space}...`);
  try {
    const app = await client(space);
    console.log(`Success for ${space}:`, app.config.space_id);
  } catch (err) {
    console.log(`Error for ${space}:`, err.message);
  }
}

async function run() {
  await test("raajmaurya/SWivid-F5-TTS");
  await test("JoPmt/E2-F5-TTS_tstng");
  await test("ThreadAbort/E2-F5-TTS");
  await test("emilalvaro/E2-F5-TTS");
}
run();
