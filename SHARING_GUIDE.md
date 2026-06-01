# 🌐 網路分享使用指南

## ✅ 已完成的修正

1. ✓ 所有 API 路由已啟用 **CORS 支援**（跨域請求）
2. ✓ `next.config.ts` 已配置跨域標頭
3. ✓ 建立公開啟動腳本 (`scripts/start_public.ps1`)

---

## 🚀 讓其他人存取你的應用

### **方法 1：同網路環境（最簡單）**

1. **啟動公開伺服器**：
   ```powershell
   .\scripts\start_public.ps1
   ```

2. **取得你的機器 IP 位址**：
   ```powershell
   ipconfig
   ```
   找到 `IPv4 地址` 欄位（通常類似 `192.168.x.x` 或 `10.x.x.x`）

3. **分享網址給其他人**：
   ```
   http://你的IP位址:3000
   ```
   例如：`http://192.168.1.100:3000`

4. **防火牆設定**：
   - 確保 Windows 防火牆允許 TCP 連接埠 3000
   - 或在 PowerShell 執行：
     ```powershell
     New-NetFirewallRule -DisplayName "GoodNight Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
     ```

---

### **方法 2：跨網路分享（使用 ngrok）**

適用於遠端訪問或網際網路分享

1. **安裝 ngrok**：
   - 下載：https://ngrok.com/download
   - 或用 Chocolatey：`choco install ngrok`

2. **啟動開發伺服器**：
   ```powershell
   npm run dev
   ```

3. **另開新終端，執行 ngrok**：
   ```powershell
   ngrok http 3000
   ```

4. **複製公開 URL**：
   - ngrok 會顯示類似 `https://xxxx-xx-xxx-xxx-xx.ngrok.io` 的連結
   - 分享這個 URL 給其他人使用

---

## ⚠️ 重要注意事項

### **關鍵限制**

1. **後端模型服務**：
   - 故事生成依賴本地 **Ollama** 或 **Text Generation WebUI**
   - 其他人也需要有這些服務，或者你需要配置**遠端 API 伺服器**
   - 當前設定為 `http://localhost:11434`（僅限本機）

2. **語音合成服務**：
   - 語音克隆依賴本地 **TTS 服務**（Fish Speech）
   - 同樣需要配置為可遠端訪問

### **解決方案**

若要完全開放應用，需要：

#### **選項 A：統一後端**
```
環境變數配置（在 .env.local 中）：
STORY_BASE_URL=http://遠端Ollama地址:11434
LOCAL_TTS_BASE_URL=http://遠端TTS地址:8000
```

#### **選項 B：Docker 部署**
```dockerfile
# 整個應用打包並部署到雲端（AWS, Vercel, Render 等）
```

#### **選項 C：使用 ngrok 隧道後端服務**
```powershell
# 同時暴露前端和後端
ngrok http 3000
ngrok http 11434  # Ollama
ngrok http 8000   # TTS
```

---

## 🧪 驗證連結

測試前確保：

1. ✓ 開發伺服器運行中
2. ✓ 防火牆已配置
3. ✓ 後端服務可用（Ollama 或 WebUI）
4. ✓ 在同一網路或使用 ngrok 公開

---

## 📝 快速啟動命令

### **本機開發**
```powershell
npm run dev
```

### **網路分享（同網路）**
```powershell
.\scripts\start_public.ps1
```

### **網路分享（遠端）**
```powershell
# 終端 1：
npm run dev

# 終端 2：
ngrok http 3000
```

---

若有進一步問題，請檢查 `docs/architecture.md` 或專案日誌。
