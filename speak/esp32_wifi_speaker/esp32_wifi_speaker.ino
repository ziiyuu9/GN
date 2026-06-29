/*
 * ESP32-S3 WiFi 小喇叭
 * --------------------------------------------------------------
 * 手機連上同一個 WiFi → 開瀏覽器進這台的網頁 → 上傳 MP3 → 按播放。
 * 音檔存在板子的 flash（FFat / FAT 檔案系統），透過 I2S 推給 MAX98357A → 喇叭。
 *
 * 第一次開機（或找不到 WiFi）會自己開一個熱點「ESP32-Speaker」，
 * 手機連上去就會跳出設定頁，選你家 WiFi、輸入密碼即可，不用改程式。
 *
 * 接線（MAX98357A → ESP32-S3）：
 *   Vin  → 5V
 *   GND  → GND
 *   BCLK → GPIO 5
 *   LRC  → GPIO 6
 *   DIN  → GPIO 7
 *   GAIN → 不接（預設 9dB）
 *   SD   → 不接（懸空＝啟用）
 *   ＋ / － → 喇叭紅 / 黑
 *
 * 需要的函式庫（Arduino IDE → 管理函式庫）：
 *   1. ESP32-audioI2S   （作者 schreibfaul1）   ← MP3 解碼 + I2S 輸出
 *   2. WiFiManager      （作者 tzapu）          ← 開機跳設定頁
 *
 * 開發板設定（Tools 選單）：
 *   Board:            ESP32S3 Dev Module
 *   USB CDC On Boot:  Enabled
 *   Flash Size:       16MB
 *   PSRAM:            OPI PSRAM
 *   Partition Scheme: 一定要選含 FATFS 的方案（本程式用 FFat），例如
 *                     "16M Flash (3MB APP/9.9MB FATFS)"。
 *                     ⚠ 不要選 SPIFFS 方案（如 "Default 4MB with spiffs"），
 *                       FFat 掛載會失敗，上傳/播放都不會動、喇叭沒聲音。
 */

#include <WiFi.h>
#include <WebServer.h>
#include <FFat.h>
#include <WiFiManager.h>      // tzapu
#include "Audio.h"            // schreibfaul1 / ESP32-audioI2S

// ---- I2S 腳位（對應上面接線）----
#define I2S_BCLK  5
#define I2S_LRC   6
#define I2S_DOUT  7

Audio audio;
WebServer server(80);

int   currentVolume = 12;     // 0~21
String nowPlaying = "";
bool  ffatOK = false;         // FFat 是否掛載成功（失敗時網頁會顯示紅字警告）

// ====== 網頁首頁 ======
String htmlPage() {
  String html =
    "<!DOCTYPE html><html><head><meta charset='utf-8'>"
    "<meta name='viewport' content='width=device-width,initial-scale=1'>"
    "<title>WiFi 小喇叭</title><style>"
    "body{font-family:-apple-system,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;color:#222}"
    "h1{font-size:20px}h2{font-size:16px;margin-top:24px}"
    "a.btn,button{display:inline-block;padding:8px 14px;margin:2px;border-radius:8px;border:1px solid #ccc;"
    "background:#f5f5f5;text-decoration:none;color:#222;font-size:15px;cursor:pointer}"
    "a.play{background:#2d7;border-color:#2c6;color:#fff}"
    "a.del{background:#f55;border-color:#e44;color:#fff}"
    "li{margin:8px 0;list-style:none}ul{padding:0}"
    ".now{background:#eef;padding:10px;border-radius:8px}"
    ".err{background:#fee;border:1px solid #e44;color:#b00;padding:12px;border-radius:8px;margin:12px 0}"
    "input,select{padding:8px;border:1px solid #ccc;border-radius:8px;font-size:15px;width:100%;box-sizing:border-box;margin:4px 0}"
    "</style></head><body>";

  html += "<h1>🔊 WiFi 小喇叭</h1>";

  // 目前連線資訊：連到哪個 WiFi、IP 多少（不用開 Serial 也看得到）
  if (WiFi.status() == WL_CONNECTED)
    html += "<p class='now'>已連線 WiFi：<b>" + WiFi.SSID() + "</b>"
            "&nbsp;｜&nbsp;IP：<b>" + WiFi.localIP().toString() + "</b></p>";

  // 檔案系統掛載失敗：上傳/播放都不會動，明確警告（否則只印在 Serial，網頁看不出來）
  if (!ffatOK)
    html += "<p class='err'>⚠ <b>FFat 檔案系統掛載失敗</b><br>"
            "上傳與播放都無法運作、喇叭不會有聲音。<br>"
            "請在 Arduino IDE 的 <b>Tools → Partition Scheme</b> 改選含 <b>FATFS</b> 的方案"
            "（例如 16M Flash 3MB APP/9.9MB FATFS），重新燒錄即可。</p>";

  if (nowPlaying.length())
    html += "<p class='now'>正在播放：<b>" + nowPlaying + "</b> "
            "&nbsp;<a class='btn' href='/stop'>⏹ 停止</a></p>";

  // 音量
  html += "<h2>音量：" + String(currentVolume) + " / 21</h2>";
  html += "<a class='btn' href='/vol?v=" + String(max(0, currentVolume - 2)) + "'>－</a> ";
  html += "<a class='btn' href='/vol?v=" + String(min(21, currentVolume + 2)) + "'>＋</a>";

  // 檔案清單
  html += "<h2>音檔清單</h2><ul>";
  File root = FFat.open("/");
  File f = root.openNextFile();
  bool any = false;
  while (f) {
    String name = String(f.name());
    if (!f.isDirectory() &&
        (name.endsWith(".mp3") || name.endsWith(".wav") ||
         name.endsWith(".MP3") || name.endsWith(".WAV"))) {
      any = true;
      html += "<li><b>" + name + "</b><br>";
      html += "<a class='btn play' href='/play?file=" + name + "'>▶ 播放</a> ";
      html += "<a class='btn del' href='/delete?file=" + name + "'>🗑 刪除</a></li>";
    }
    f = root.openNextFile();
  }
  if (!any) html += "<li>（還沒有音檔，先在下面上傳）</li>";
  html += "</ul>";

  // 上傳表單
  html += "<h2>上傳音檔（MP3 / WAV）</h2>"
          "<form method='POST' action='/upload' enctype='multipart/form-data'>"
          "<input type='file' name='audio' accept='.mp3,.wav'><br><br>"
          "<button type='submit'>上傳</button></form>";

  // 設定 / 切換 WiFi（直接在網頁輸入，不必再連 ESP32-Speaker 熱點）
  html += "<h2 style='margin-top:32px'>設定 / 切換 WiFi</h2>"
          "<form method='POST' action='/setwifi'>"
          "<select id='ssidsel' onchange=\"document.getElementsByName('ssid')[0].value=this.value\">"
          "<option>掃描中…</option></select>"
          "<button type='button' onclick='scanWifi()'>🔄 重新掃描</button>"
          "<input name='ssid' placeholder='WiFi 名稱 (SSID)，或從上方選' required>"
          "<input name='pass' type='password' placeholder='WiFi 密碼（沒密碼留空）'>"
          "<button type='submit'>連線並記住</button></form>"
          "<p style='color:#888;font-size:13px'>從上方下拉選單挑你家的 WiFi（也可手動輸入隱藏網路）。"
          "儲存後板子會重開並連上新網路，IP 可能會變；請改連到新的 WiFi 再重整本頁。</p>";

  // 重設 WiFi
  html += "<h2 style='margin-top:32px'>其他</h2>"
          "<a class='btn' href='/resetwifi' "
          "onclick=\"return confirm('確定要清除 WiFi 設定並重開機？')\">重設 WiFi</a>";

  // 掃描附近 WiFi，填進上方下拉選單（依訊號強度排序）
  html += "<script>"
          "function scanWifi(){"
          "var s=document.getElementById('ssidsel');"
          "s.innerHTML='<option>掃描中…</option>';"
          "fetch('/scan').then(r=>r.json()).then(l=>{"
          "l.sort((a,b)=>b.rssi-a.rssi);"
          "s.innerHTML='<option value=\"\">— 選擇 WiFi —</option>';"
          "l.forEach(w=>{var o=document.createElement('option');o.value=w.ssid;"
          "o.textContent=(w.lock?'\\uD83D\\uDD12 ':'')+w.ssid+' ('+w.rssi+'dBm)';s.appendChild(o);});"
          "}).catch(e=>{s.innerHTML='<option value=\"\">掃描失敗，請手動輸入</option>';});"
          "}"
          "scanWifi();"
          "</script>";

  html += "</body></html>";
  return html;
}

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleRoot() { 
  sendCORSHeaders();
  server.send(200, "text/html", htmlPage()); 
}

// ====== 上傳處理 ======
File uploadFile;
void handleUpload() {
  HTTPUpload &up = server.upload();
  if (up.status == UPLOAD_FILE_START) {
    String fn = "/" + up.filename;
    uploadFile = FFat.open(fn, "w");
  } else if (up.status == UPLOAD_FILE_WRITE) {
    if (uploadFile) uploadFile.write(up.buf, up.currentSize);
  } else if (up.status == UPLOAD_FILE_END) {
    if (uploadFile) uploadFile.close();
  }
}

void setup() {
  Serial.begin(115200);

  ffatOK = FFat.begin(true);
  if (!ffatOK) {
    Serial.println("FFat 掛載失敗：請把 Arduino IDE 的 Partition Scheme 改成含 FATFS 的方案");
  }

  // 診斷：PSRAM 沒啟用的話 Audio 解碼器會配不到緩衝區、播放沒聲音也沒 audio_info
  Serial.printf("PSRAM 偵測：found=%d, size=%u bytes\n", psramFound(), (unsigned)ESP.getPsramSize());

  // ---- WiFi：開機跳設定頁 ----
  WiFiManager wm;
  // 找不到已存的 WiFi 就開熱點「ESP32-Speaker」，手機連上會自動跳設定頁
  if (!wm.autoConnect("ESP32-Speaker")) {
    Serial.println("WiFi 連線失敗，重開機");
    ESP.restart();
  }
  Serial.print("已連上 WiFi，IP 位址：");
  Serial.println(WiFi.localIP());   // ← 手機瀏覽器輸入這個 IP

  // ---- I2S 音訊 ----
  audio.setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
  audio.setVolume(currentVolume);

  // ---- 網頁路由 ----
  server.on("/", HTTP_GET, handleRoot);

  // 處理所有 OPTIONS 預檢請求 (CORS)
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCORSHeaders();
      server.send(204);
    } else {
      sendCORSHeaders();
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.on("/status", HTTP_GET, []() {
    sendCORSHeaders();
    String json = "{\"playing\": ";
    json += (nowPlaying.length() > 0 && audio.isRunning()) ? "true" : "false";
    json += ", \"paused\": ";
    json += (nowPlaying.length() > 0 && !audio.isRunning()) ? "true" : "false";
    json += ", \"file\": \"" + nowPlaying + "\"}";
    server.send(200, "application/json", json);
  });

  server.on("/upload", HTTP_POST,
            []() { 
              sendCORSHeaders();
              // 如果是瀏覽器表單上傳，回應 303 導回首頁；如果是 JS fetch()，收到 303 也是沒問題的
              server.sendHeader("Location", "/"); 
              server.send(303); 
            },
            handleUpload);

  server.on("/play", HTTP_GET, []() {
    if (server.hasArg("file")) {
      String f = server.arg("file");
      if (!f.startsWith("/")) f = "/" + f;
      
      Serial.println("--- 收到播放要求 ---");
      Serial.println("檔名: " + f);
      File testF = FFat.open(f, "r");
      if (!testF) {
        Serial.println("錯誤：FFat 找不到這個檔案！");
      } else {
        Serial.println("成功：FFat 找到檔案，大小 = " + String(testF.size()) + " bytes");
        testF.close();
      }

      audio.stopSong();
      bool res = audio.connecttoFS(FFat, f.c_str());
      Serial.println("audio.connecttoFS 回傳值 = " + String(res));
      // 診斷：true=解碼器真的在跑（問題在硬體輸出）；false=I2S/解碼沒起來（PSRAM 或函式庫版本問題）
      Serial.println("audio.isRunning() = " + String(audio.isRunning()));

      nowPlaying = f;
    }
    sendCORSHeaders();
    server.sendHeader("Location", "/"); server.send(303);
  });

  server.on("/stop", HTTP_GET, []() {
    audio.stopSong();
    nowPlaying = "";
    sendCORSHeaders();
    server.sendHeader("Location", "/"); server.send(303);
  });

  server.on("/pause", HTTP_GET, []() {
    audio.pauseResume();
    sendCORSHeaders();
    server.sendHeader("Location", "/"); server.send(303);
  });

  server.on("/vol", HTTP_GET, []() {
    if (server.hasArg("v")) {
      currentVolume = constrain(server.arg("v").toInt(), 0, 21);
      audio.setVolume(currentVolume);
    }
    sendCORSHeaders();
    server.sendHeader("Location", "/"); server.send(303);
  });

  server.on("/delete", HTTP_GET, []() {
    if (server.hasArg("file")) {
      String f = server.arg("file");
      if (!f.startsWith("/")) f = "/" + f;
      FFat.remove(f);
    }
    sendCORSHeaders();
    server.sendHeader("Location", "/"); server.send(303);
  });

  // 掃描附近 WiFi，回傳 JSON 清單給網頁下拉選單用
  server.on("/scan", HTTP_GET, []() {
    sendCORSHeaders();
    int n = WiFi.scanNetworks();
    String json = "[";
    for (int i = 0; i < n; i++) {
      if (i) json += ",";
      String s = WiFi.SSID(i);
      s.replace("\\", "\\\\");   // 跳脫，避免 SSID 含特殊字元破壞 JSON
      s.replace("\"", "\\\"");
      json += "{\"ssid\":\"" + s + "\",\"rssi\":" + String(WiFi.RSSI(i)) +
              ",\"lock\":" + ((WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "false" : "true") + "}";
    }
    json += "]";
    WiFi.scanDelete();
    server.send(200, "application/json", json);
  });

  // 從網頁設定 / 切換 WiFi：存帳密 → 重開機 → autoConnect 會連上新網路
  server.on("/setwifi", HTTP_POST, []() {
    sendCORSHeaders();
    String ssid = server.arg("ssid");
    String pass = server.arg("pass");
    if (ssid.length() == 0) {
      server.send(400, "text/html; charset=utf-8",
                  "<meta charset='utf-8'>請輸入 WiFi 名稱 (SSID)。");
      return;
    }
    server.send(200, "text/html; charset=utf-8",
                "<meta charset='utf-8'>已儲存，板子正在重新連線到「<b>" + ssid + "</b>」…<br>"
                "請把手機改連到那個 WiFi，等約 10 秒後再開新的 IP（Serial Monitor 會印出新 IP）。");
    delay(500);
    // WiFi.begin 會把帳密寫進板子 NVS；重開後 setup() 的 autoConnect 就會自動連這個
    WiFi.persistent(true);
    WiFi.begin(ssid.c_str(), pass.c_str());
    delay(1000);
    ESP.restart();
  });

  server.on("/resetwifi", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "text/html", "WiFi 已重設，重開機中…連上熱點 ESP32-Speaker 重新設定。");
    delay(800);
    WiFiManager wm; wm.resetSettings();
    ESP.restart();
  });

  server.begin();
}

void loop() {
  audio.loop();          // 音訊解碼必須持續呼叫
  server.handleClient();
}

// 播放結束時的回呼（清掉「正在播放」狀態）
void audio_eof_mp3(const char *info) {
  nowPlaying = "";
  Serial.print("eof_mp3: "); Serial.println(info);
}

void audio_info(const char *info) {
  Serial.print("audio_info: "); Serial.println(info);
}

void audio_id3data(const char *info) {
  Serial.print("audio_id3: "); Serial.println(info);
}
