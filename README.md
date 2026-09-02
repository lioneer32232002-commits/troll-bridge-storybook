# 巨魔怪的故事 — 課堂投影繪本

國中課堂投影用的線上繪本（16:9、大圖大字、一頁一景），加上可列印的紙本學習單。

**網址：** https://troll-bridge-storybook.pages.dev

- 直接跳頁：網址後面加 `#p7` 就會跳到第 7 頁。
- 學習單 PDF：https://troll-bridge-storybook.pages.dev/worksheet.pdf

## 投影操作

| 動作 | 按鍵 / 手勢 |
| --- | --- |
| 下一頁 | `→`　`↓`　空白鍵　`Enter`　`PageDown`　點畫面右半邊　向左滑 |
| 上一頁 | `←`　`↑`　`Backspace`　`PageUp`　點畫面左半邊　向右滑 |
| 第一頁 / 最後一頁 | `Home` / `End` |
| 全螢幕 | `F` |

- `PageUp` / `PageDown` 就是一般簡報筆的兩顆按鍵，插上就能用。
- 第 15 頁「三個啟發」是**逐條點出**：按三次各出一條，第四次才會翻到下一頁。
- 右下角有「頁碼 / 總頁數」，左下角有淡淡的操作提示。

## 專案結構

```
繪本/
├─ site/                  ← Cloudflare Pages 的部署根目錄
│  ├─ index.html
│  ├─ style.css
│  ├─ app.js              ← 翻頁、字級自動計算、圖片預載
│  ├─ pages.js            ← 由 pages.json 產生，不要手改
│  ├─ worksheet.pdf       ← 結尾頁的下載連結指到這裡
│  └─ img/p01.jpg … p16.jpg   （2752×1536，16:9）
├─ pages.json             ← 每頁定稿文字（真源）＋生圖 prompt
├─ PLAN.md                ← 製作規劃與生圖流程
├─ story.txt              ← 從老師原稿抽出的純文字
├─ 01巨魔怪的故事.docx      ← 老師原稿
└─ worksheet/             ← 學習單原始檔（docx / html / pdf）
```

## 文字怎麼改

**`pages.json` 是文字的唯一真源**，`site/pages.js` 由它產生。

規則：`text` / `text2` 陣列裡**一個字串就是一行**，網頁上不會自動折行，
所以斷句要自己斷好（`text2` 是同一頁的第二段，中間會空半行）。

改完 `pages.json` 後重新產生 `pages.js`：

```bash
cd D:/繪本
python -c "
import json,io
d=json.load(io.open('pages.json',encoding='utf-8'))
pages=[{k:v for k,v in p.items() if k!='prompt'} for p in d['pages']]
s=json.dumps({'title':d['title'],'pages':pages},ensure_ascii=False,indent=1)
io.open('site/pages.js','w',encoding='utf-8').write('// 由 pages.json 自動產生，請勿手改\nwindow.BOOK = '+s+';\n')
"
```

字級是**自動算的**：程式會從最大字級往下試，直到每一行都不折行、
文字面板也不會擠掉圖片為止，所以 1920×1080 和 1280×720 都不會出現孤字。
行加長了字就會自動變小，不用手動調 CSS。

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
