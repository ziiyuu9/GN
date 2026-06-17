async function searchSpaces() {
  const res = await fetch("https://huggingface.co/api/spaces?search=CosyVoice&limit=10");
  const data = await res.json();
  console.log(JSON.stringify(data.map(d => d.id), null, 2));
}
searchSpaces();
