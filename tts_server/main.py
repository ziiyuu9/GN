import os
import io
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch

app = FastAPI(title="Fish Speech TTS Mock Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("=========================================")
    print("TTS 伺服器啟動中...")
    if torch.cuda.is_available():
        print(f"CUDA 可用! 偵測到 GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("CUDA 不可用，模型將在 CPU 上運行 (速度較慢)")
    print("=========================================")

@app.post("/api/clone_and_synthesize")
async def clone_and_synthesize(
    voice_sample: UploadFile = File(...),
    text: str = Form(...),
    language: str = Form("en")
):
    try:
        # 1. 讀取音訊樣本
        audio_bytes = await voice_sample.read()
        print(f"收到聲音樣本: {voice_sample.filename}, 大小: {len(audio_bytes)} bytes")
        print(f"欲合成的文本: {text}")

        # NOTE: This is a mock TTS endpoint for local testing only.
        # The real Fish Speech TTS server is implemented in
        # source/tts_server/fish-speech/tools/api_server.py and exposes /v1/tts.
        # This stub returns silent WAV audio; to get actual cloned audio,
        # start the real Fish Speech server and point LOCAL_TTS_BASE_URL at it.
        
        # FIXME: 這裡將整合真實的 Fish Speech Inference
        # 目前暫時返回一個假的 Audio 檔案 (這裡用簡單的空 wav 標頭代替，實際需回傳真實 wav)
        # TODO: 使用模型將 audio_bytes 轉換為 speaker embedding，並用 text 進行語音合成
        
        # 建立一個假的 1秒空白 wav 檔案
        import wave
        with io.BytesIO() as mock_wav_io:
            with wave.open(mock_wav_io, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(24000)
                wav_file.writeframes(b'\x00\x00' * 24000) # 1 sec of silence
            
            audio_buffer = mock_wav_io.getvalue()

        return Response(content=audio_buffer, media_type="audio/wav")

    except Exception as e:
        print(f"Error during voice cloning: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
