async function test() {
  const url = "https://mrfakename-e2-f5-tts.hf.space/gradio_api/file=/tmp/gradio/defff1671e2e54df7bdcb020fb7e3942996199ca253e7afeb5fcacf3cc037c4c/tmp_73m7141.wav";
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  console.log("Audio size bytes:", buf.byteLength);
}
test();
