# ライブ配信UI 制作ハンドオフ（動画詳細画面をベースに）

別セッションで **ライブ配信用UI** を作るための引き継ぎ資料。
**`video.html`（縦型動画記事のUI）を土台に流用**する前提でまとめています。
まずこのファイルと `video.html` を読めば、ゼロから組み直さずに着手できます。

---

## 0. ベースになる成果物

| 種類 | 場所 |
| --- | --- |
| 動くベース（HTML/CSS/JSプロトタイプ） | `video.html`（このフォルダ＝作業ディレクトリ） |
| Lottie素材（ハート/ブックマーク）同梱JS | `lottie-data.js`（`window.HEART_LOTTIE` / `window.BOOKMARK_LOTTIE`） |
| Lottie元データ | `heart-like.json` / `bookmark-like.json` |
| Flutterエンジニア向け仕様書 | `VIDEO_SCREEN.md` |
| 公開URL（スマホ確認用） | https://ryoheiarita.github.io/claude/video/ |

外部依存: Vimeo iframe（CDN）/ lottie-web（CDN）/ Figtree（Google Fonts）。ローカル依存は `lottie-data.js` のみ。

**着手の最初の一歩**: `cp video.html live.html`（公開するなら `docs/live/index.html`）してから §4 に沿って差し替える。

---

## 1. そのまま流用できる「土台」（再利用推奨）

ライブUIでも 9 割そのまま使える共通基盤：

1. **フルスクリーン端末フレーム**
   - `.phone { width:100%; height:100dvh; overflow:clip; }`、`<body>` は全幅。
   - viewport meta は `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`。
2. **ステータスバー非表示 ＋ 戻るボタン**（`--top-inset = env(safe-area-inset-top) + 16px`）。
3. **右側アクションボタン3つ**（ハート/ブックマーク＝Lottie、コメント＝アイコン）。
   - Lottieは `lottie-data.js` を `<script src>` で読む（`fetch` は file:// でCORS失敗するため不可）。
   - 押下/解除のフレーム: `LIKE_START=17 / FILLED=90 / UNLIKE_START=105`、アウトライン白塗り、連打ガード。
4. **ボトムシート機構**（コメント欄）
   - `bottom:0` アンカー＋`transform: translateY()` で開閉、`0.42s cubic-bezier(.22,.61,.36,1)`。
   - **シート外タップで閉じる**（`phone` の click で `commentSheet`/`actions` 外を判定）。
   - **端オーバースクロールで開閉**：PC=`wheel`、スマホ=`touchstart/move`（上スワイプで展開、先頭で下スワイプで畳む）。
5. **状態管理**：`#phone` に **クラスを付けてCSSで切替**（無段階リサイズしない）。
   - `.s-comment`（コメント開）/ `.s-desc`（概要シート展開）。JSは `classList.add/remove` のみ。
6. **デザイントークン**（`:root` のカラー、Figtree+和文）。`VIDEO_SCREEN.md` §3 に一覧。

---

## 1.5 再利用コンポーネント（Web Component・他の縦動画でも使える）

`video.html` から切り出した、ドロップインで使える共通部品。`<script src>` で読み込み、タグを置くだけ。
Shadow DOM でスタイル隔離。`window.lottie` + `lottie-data.js`（`HEART_LOTTIE`/`BOOKMARK_LOTTIE`）があれば Lottie、無ければ静的SVGにフォールバック。

| ファイル | タグ | 中身 | 主なイベント / API |
| --- | --- | --- | --- |
| `bwu-action-rail.js` | `<bwu-action-rail>` | 縦動画の**右側5ボタン**（♥/🔖/💬/📄概要/⛶全画面） | events: `heart`/`bookmark`（`detail.on`）, `comment`, `detail`, `fullscreen`／method: `setActive(name,on)`, **`setCommentArtists(urls)`**／attr: `buttons="…"`（選択・並べ替え可）, `comment-artists="url1,url2,url3"` |
| `bwu-action-bar.js` | `<bwu-action-bar>` | **横モード下部の浮遊バー**（コメントピル＋♥🔖、Figma 9448-27814/27815/27824） | events: `comment`, `heart`, `bookmark`／attr: `label`, `avatars` |

使い方（右側5ボタン）:
```html
<script src="./lottie-data.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script src="./bwu-action-rail.js"></script>
...
<bwu-action-rail id="rail"></bwu-action-rail>
<script>
  rail.addEventListener('comment',    () => openComments());
  rail.addEventListener('detail',     () => openDetail());
  rail.addEventListener('fullscreen', () => vimeoPlayer.requestFullscreen()); // Vimeo SDK で標準全画面
  rail.setActive('comment', true);  // シートが開いている間は枠を表示
</script>
```
- 配置は呼び出し側（`position:absolute; right:16px; top:…`）。`:host` が縦並び(flex column gap8)。
- ♥/🔖 はコンポーネント内でトグル＋Lottie完結。`comment`/`detail`/`fullscreen` は通知のみ（挙動はホスト側）。
- **アーティストコメント時のアイコン巡回**（2026-07-03）: `rail.setCommentArtists([url1,url2,url3])` で、コメントボタンの中身が `吹き出し→①→②→③→吹き出し…` と巡回（アバター各1s、吹き出しに戻ると5s待機）。`scale` の「ポワン」切替。空配列で通常アイコンに戻る。仕様は `VIDEO_SCREEN.md §5.1`。
- 全画面を「Vimeo標準ボタンと同じ挙動」にするには **Vimeo Player SDK**（`player.js`）の `player.requestFullscreen()` を `fullscreen` イベントで呼ぶ（`iframe.requestFullscreen` は別挙動なので不可）。

## 2. レイアウトの数式（CSS変数）

`:root` の主要変数（すべて高さ基準は `100dvh`）:

```
--top-inset:        env(safe-area-inset-top,0) + 16px   /* 戻るボタン位置 */
--actions-h:        160px                                /* 3ボタン: 48×3 + gap8×2 */
--vid-normal-h:     100dvh - var(--desc-peek)            /* 通常時の動画高さ */
--vid-comment-top:  var(--top-inset)                     /* コメント開時:上揃え */
--vid-comment-h:    var(--actions-h)                     /* コメント開時:3ボタンと同じ高さ */
--vid-comment-bottom: vid-comment-top + vid-comment-h    /* =動画/ボタン下端 */
--comment-sheet-h:  100dvh - var(--vid-comment-bottom) - 16px
--desc-peek:        264px                                /* 概要シートのピーク */
--desc-expanded-top:116px                                /* 概要シート展開時の上端 */
```

- **動画は 9:16 固定**：`width = calc(var(--vid-XXX-h) * 9 / 16)`、`left:50% + translateX(-50%)` で中央。
- **通常時(A)**：動画は上の領域いっぱい（`--vid-normal-h`）。3ボタンは `top: var(--vid-normal-h) - 208px`。
- **コメント開時(B)**：動画も3ボタンも **上揃え（top=--top-inset）・高さ160**。コメント上端＝ボタン下端＋16。
- **概要シート展開時**：3ボタンは右下（`top: 100dvh - 184px`）。本文は下余白 `200px` でボタンを回避。

---

## 3. ライブUIで「変える/足す」もの（チェックリスト ※デザインは別途確定）

土台はそのまま、以下を差し替え/追加する想定。実デザインは別セッションで詰める。

- [ ] **動画 → ライブ配信プレイヤー**：全画面 `cover`。Vimeoライブ/HLS等。横動画を全面に出すなら §1 video.htmlの cover手法（iframe拡大クリップ）を参照。コントローラ有無は要件次第。
- [ ] **「動画概要」ボトムシート**：ライブでは不要 or 「配信情報（タイトル/開始時刻/タグ）」に置換。
- [ ] **コメント → リアルタイムチャット**：下から流れる/自動スクロール/入力欄を常時表示。既存コメントUI（アバター/名前/バッジ/リアクションchip）を流用可。
- [ ] **追加要素候補**：LIVEバッジ、視聴者数（👁 1,234）、配信者プロフィール、**ハートの浮遊リアクション**（タップで♥が上に流れる）、アーカイブ/ライブ切替。
- [ ] **アクションボタン3つ**：流用可。コメント＝チャット開閉に。ハートを「投げ銭/応援」に転用も。

---

## 4. ハマりどころ（必読 / 過去に踏んだ地雷）

1. **`.phone` は `overflow: clip`**（`hidden` 不可）。画面外へ隠したシート（translateY）が `scrollHeight` を増やし、`hidden` だとコンテナが ~86px 勝手にスクロールして `bottom:0` の基準がズレる。`clip` でスクロールコンテナ化を防ぐ。
2. **高さは `100dvh` ベース**（固定 `844px` にしない）。スマホSafari/Chromeの可視領域は端末論理高より小さい。幅は `width:100%`、viewportは `width=device-width`。
3. **Lottie は `fetch` 禁止 → `lottie-data.js` を `<script src>`**。file:// 直開きでも動かすため。
4. **プレビュー(ヘッドレス)はツール呼び出し間でCSSトランジションのクロックが止まる**。`getComputedStyle`/`getBoundingClientRect` が遷移“開始値”を返し誤検証の原因に。検証は **(a) 実スクリーンショット**、または **(b) `*{transition:none!important}` を一時注入して実測**。
5. **状態遷移はクラス駆動**（`.s-comment` 等）。JSでインラインstyleを直接いじらない（トランジションと競合）。

---

## 5. 公開ワークフロー（スマホ確認）

- リポジトリ: `git@github.com:ryoheiarita/claude.git`（branch **main**）。GitHub Pages を **`docs/`** から配信。
- 手順:
  1. `docs/<name>/index.html`（＋必要なら `lottie-data.js`）を置く
  2. `docs/index.html` のカード一覧に1枚追加（`.card-icon.<name>` の色も追加）
  3. `docs/` の対象ファイルだけ `git add` → commit → `git push origin main`（**node_modules等の未追跡は混ぜない**）
  4. ~1分で `https://ryoheiarita.github.io/claude/<name>/` に反映
- 例（動画画面）: `docs/video/index.html` + `docs/video/lottie-data.js`、トップに「縦型動画記事のUI」カード。

---

## 6. 進め方サマリ
1. `video.html` と本書を読む → 土台(§1)を把握
2. `cp video.html docs/live/index.html` ＋ `lottie-data.js` をコピー
3. §3 チェックリストでライブ向けに差し替え（§2の数式・§4の地雷に注意）
4. §5 で公開して実機確認

> 動画画面の挙動仕様（Flutter向け）は `VIDEO_SCREEN.md` に詳細あり。ライブUIの仕様書も同様式で起こすと引き継ぎやすい。
