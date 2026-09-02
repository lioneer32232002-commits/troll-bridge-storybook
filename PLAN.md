# 巨魔怪的故事 — 繪本網站 + 學習單

## 目標
- 課堂投影用的繪本網頁（16:9、圖大、字大、每頁文字短）。
- 紙本學習單（A4 列印，docx + pdf）。
- 部署：GitHub repo + Cloudflare Pages。

## 素材
- `01巨魔怪的故事.docx`：老師原稿（故事 + 學習單）。`story.txt` 是抽出的純文字。
- `pages.json`：每頁定稿文字（已手動斷行，**一個字串 = 一行，不可再自動換行**）與英文生圖 prompt。
- `site/img/pNN.jpg`：Gemini 生成的插圖（2752×1536，Sempé 水彩風）。p04 是驗證通過的樣板。

## 文字改動（需向老師說明）
- 第二回合原文「我還沒和她發生關係」改成「我還沒學會怎麼好好愛一個人」，投影給國中生看比較合適。

## 生圖流程（已驗證）
1. Chrome（claude-in-chrome）tab 1151270708，Gemini 對話 https://gemini.google.com/app/d452f9ba88f1b0cc，**同一個對話**接著生，風格才一致。
2. `find` 輸入框「請輸入 Gemini 提示詞」→ click ref → `type` prompt → `key Return`（點送出鈕不可靠，用 Enter）。
3. 等 40–60 秒，screenshot 確認圖出來、沒有文字/字母。
4. 用 JS 點**最後一個**「下載原尺寸圖片」按鈕：
   `[...document.querySelectorAll('button[aria-label="下載原尺寸圖片"]')].at(-1).click()`
5. 檔案落在 `C:/Users/User/Downloads/Gemini_Generated_Image_*.jpg`，搬到 `site/img/pNN.jpg`，PIL 檢查尺寸。

## 網站規格
- 純靜態，`site/` 是部署根目錄。無 build。
- 每頁：上方圖片區 68vh（object-fit: contain），下方 32vh 文字面板。文字改成 `beats` 逐拍顯示（一拍 ≤4 行、一行 ≤15 字），按一下出一拍，全站統一字級（1280×720 ≥38px）。每行 `white-space: nowrap`，不可折行。
- 2026-09-02 第一版把文字塞滿整頁、圖縮成縮圖，已退回重做。
- 操作：←/→、空白鍵、PageUp/PageDown（簡報筆）、點左右半邊、觸控滑動、F 全螢幕、`#p3` 直接跳頁、預載下一張圖。
- 圖片缺檔時顯示灰底佔位＋頁碼，不可壞掉。
- 啟發頁三條逐次點出。
- 結尾頁附學習單 PDF 連結（`site/worksheet.pdf`）。

## 部署
- GitHub：`lioneer32232002-commits/troll-bridge-storybook`（public）。
- Cloudflare Pages：個人帳號 wizard32232002@gmail.com（`wrangler whoami` 先確認），專案 `troll-bridge-storybook`，`wrangler pages deploy site`。
- ⚠️ 絕對不要跑 `wrangler login`。
