# 巨魔怪的故事 — 課堂投影繪本

國中課堂投影用的線上繪本（16:9、大圖大字、一頁一景），加上可列印的紙本學習單。

**網址：** https://troll-bridge-storybook.pages.dev

- 直接跳頁：網址後面加 `#p7` 就會跳到第 7 頁。
- 學習單 PDF：https://troll-bridge-storybook.pages.dev/worksheet.pdf

## 投影操作

每一頁的文字分成「拍」（beat），一次只顯示一拍，按下一步才換下一拍，
整頁的拍出完了才翻到下一頁。

| 動作 | 按鍵 / 手勢 |
| --- | --- |
| 下一步（下一拍／下一頁） | `→`　`↓`　空白鍵　`Enter`　`PageDown`　點畫面右半邊　向左滑 |
| 上一步（上一拍／上一頁） | `←`　`↑`　`Backspace`　`PageUp`　點畫面左半邊　向右滑 |
| 第一頁 / 最後一頁 | `Home` / `End` |
| 全螢幕 | `F` |

- `PageUp` / `PageDown` 就是一般簡報筆的兩顆按鍵，插上就能用。
- 從一頁的第一拍再按「上一步」，會回到**上一頁的最後一拍**。
- 面板下方的小圓點顯示這頁有幾拍、現在是第幾拍。
- 第 15 頁「三個啟發」是逐拍點出，而且會**累積**：出第 2 條時第 1 條還在（變淡）。
- 右下角有「頁碼 / 總頁數」，左下角有淡淡的操作提示。網址的 `#p7` 只記頁、不記拍。

## 專案結構

```
繪本/
├─ site/                  ← Cloudflare Pages 的部署根目錄
│  ├─ index.html
│  ├─ style.css
│  ├─ app.js              ← 分拍翻頁、字級自動計算、圖片預載
│  ├─ pages.js            ← 由 pages.json 產生，不要手改
│  ├─ worksheet.pdf       ← 結尾頁的下載連結指到這裡
│  └─ img/p01.jpg … p16.jpg   ← 投影用縮圖（1920 寬，約 300KB），由 tools/optimize_img.py 產生
├─ pages.json             ← 每頁定稿文字（真源，分拍）＋生圖 prompt
├─ PLAN.md                ← 製作規劃與生圖流程
├─ story.txt              ← 從老師原稿抽出的純文字
├─ 01巨魔怪的故事.docx      ← 老師原稿
└─ worksheet/             ← 學習單原始檔（docx / html / pdf）
```

## 文字怎麼改

**`pages.json` 是文字的唯一真源**，`site/pages.js` 由它產生。

一般頁用 `beats`：**陣列的陣列**。外層一個元素 = 一拍，內層一個字串 = 一行。

```json
{"id": 5, "beats": [
  ["小男孩嚇壞了，卻靈機一動：", "「不要吃我！", "我姐姐比較好吃，", "你吃她就好了！」"],
  ["巨魔怪搖搖頭：", "「不！我要吃你！」"]
]}
```

規則（超過會被自動縮小字級，全站字級是一起算的，一頁太長會拖累所有頁）：

- 一拍最多 **4 行**，一行最多 **15 字**。
- 網頁不會自動折行，斷句要自己斷好。
- 對話行會自動用金色標示：以**頁**為單位追蹤引號，遇到「進入引用、遇到」離開，
  中間沒帶引號的行（例如「我姐姐比較好吃，」）也會一起算成對話。

`cover` 用 `title` / `subtitle`，`lessons` 用 `title` / `items`（三條），
`end` 用 `title` + `beats`（一拍）。

改完 `pages.json` 後重新產生 `pages.js`：

```bash
cd D:/繪本
python -c "
import json,io
d=json.load(io.open('pages.json',encoding='utf-8'))
pages=[{k:v for k,v in p.items() if k!='prompt'} for p in d['pages']]
s=json.dumps({'title':d['title'],'pages':pages},ensure_ascii=False,indent=1)
io.open('site/pages.js','w',encoding='utf-8').write('// 由 pages.json 自動產生，請勿手改
window.BOOK = '+s+';
')
"
```

字級是**自動算的**：程式先用 100px 量一次每一拍的實際尺寸（文字寬度用 Range 量實際字寬），
換算出「剛好塞得下」的字級，再實測校正。分成四組：

- **一般頁**：全站所有頁所有拍共用同一個字級，翻頁時字不會忽大忽小。
- **提問頁（第 14 頁）**：自成一組，塞得下就盡量大（有上限，1080p 約 125px）。
- **啟發頁（第 15 頁）**：圖是裝飾性的，版面改成圖 50% ／面板 50%，字級自成一組。
- **結尾頁**：多了標題與按鈕，自成一組。

版面比例：一般頁圖片區 68%、文字面板 32%；啟發頁 50% / 50%；封面滿版。

## 換圖

把新圖放進 `site/img/`，檔名 `p01.jpg`…`p16.jpg`，尺寸 2752×1536（16:9）。
缺檔不會壞版，該頁會顯示灰底佔位＋頁碼。生圖流程寫在 `PLAN.md`。

## 更新網站（改完之後要做的三件事）

```bash
cd D:/繪本
git add -A
git commit -m "更新內容"
git push
npx wrangler pages deploy site --project-name troll-bridge-storybook --commit-dirty=true
```

`git push` 只是備份到 GitHub，**真正讓網站更新的是最後那行 `wrangler pages deploy`**
（這個專案沒有接 GitHub 自動建置）。

⚠️ 不要執行 `wrangler login`。目前已經登入 wizard32232002@gmail.com，跑 login 會把它踢掉。

## 本機預覽

```bash
cd D:/繪本
python -m http.server 8765 --directory site
# 瀏覽器開 http://localhost:8765
```

不要用 `file://` 直接開 `index.html`——雖然資料是用 `pages.js` 內嵌的可以動，
但圖片路徑在某些瀏覽器會被擋。

## 部署資訊

- GitHub：https://github.com/lioneer32232002-commits/troll-bridge-storybook
- Cloudflare Pages 專案：`troll-bridge-storybook`（正式分支 `main`，帳號 wizard32232002@gmail.com）

## 插圖

- 風格：Jean-Jacques Sempé 式細線墨水＋淡水彩，Gemini 網頁生成；角色設定與每頁 prompt 都在 `pages.json`。
- 換圖流程：新圖存到 `art/pNN.jpg`（原尺寸），跑 `python tools/optimize_img.py`，再 commit + 部署。
- 文字改動：第二回合原文「還沒和她發生關係」投影版改為「還沒學會怎麼好好愛一個人」。
