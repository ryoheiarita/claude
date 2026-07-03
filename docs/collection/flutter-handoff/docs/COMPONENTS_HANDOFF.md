# 共通コンポーネント 実装指示書（Flutter）

BWU（BE:FIRST/BMSG アプリ）の動画・LIVE 画面で**使い回している再利用コンポーネント**と、
**画面をまたいで共通の挙動**をまとめた指示書。Flutter では各コンポーネントを**1回作って全画面で流用**する前提で実装する。

HTML 側は Web Components（Shadow DOM、`<script src>` でドロップイン）。挙動イメージのソースは
`ui_prototype/media/collection/` 配下（公開版は `docs/collection/`）。
個別画面の状態遷移は `VIDEO_SCREEN.md` / `LIVE_UI_HANDOFF.md`、Vimeo プレイヤーは `VIMEO_PLAYER_SPEC.md` / `VIMEO_PLAYER_FLUTTER.md` を参照。

---

## 0. コンポーネント一覧

| ファイル | タグ / 種別 | 中身 | 使用画面 |
| --- | --- | --- | --- |
| `bwu-action-rail.js` | `<bwu-action-rail>` | 縦動画の**右側 縦並びアクションボタン**（♥/🔖/💬/📄概要/⛶全画面） | 縦動画・縦LIVE |
| `bwu-action-bar.js` | `<bwu-action-bar>` | **横モード下部の浮遊バー**（コメントピル＋♥🔖） | 横動画・横LIVE |
| `bwu-vimeo-controls.js` | 初期化スクリプト | Vimeo 標準UIを隠し**自前の再生/シーク/全画面**を重ねる | 全 Vimeo 画面（video/live × tate/yoko） |
| Lottie ♥/🔖 | 素材 `heart-like.json` / `bookmark-like.json` | 記事画面と**同一の Lottie トグルボタン** | 全画面共通（rail / bar の中） |
| `BWU_SHEET_PULL_DISMISS` | インライン挙動 | ボトムシートを**最上部からさらに引き下げると閉じる** | コメント/概要シートを持つ全画面 |

すべて **Lottie が読めない環境では静的SVGにフォールバック**（`window.lottie` + `lottie-data.js` があれば Lottie）。

---

## 1. 共通デザイントークン（全コンポーネント共通）

| トークン | 値 | Flutter |
| --- | --- | --- |
| ボタン円（fab） | `48×48`、`border-radius 42` | 実質フル円 |
| ボタン背景（rail） | `rgba(0,0,0,0.55)` + `blur(20)` + ボーダー `rgba(255,255,255,0.15)` | `BackdropFilter` + 半透明黒 |
| ピル背景（bar） | `#303030` + `blur(10)` + ボーダー `rgba(255,255,255,0.15)` | 同上 |
| アイコン | `24×24`、線 white | |
| 縦並び gap | `8` | rail は `flex column gap8` |
| **標準モーションカーブ** | `cubic-bezier(0.22, 0.61, 0.36, 1)` / **0.42s** | シート開閉・動画サイズ遷移で共通使用 |
| ♥ ON ボーダー | `rgba(255,62,62,0.6)` = `0x99FF3E3E` | |
| 🔖 ON ボーダー | `rgba(255,209,51,0.6)` = `0x99FFD133` | |
| アクティブ枠（コメント/概要 開） | ボーダー `rgba(255,255,255,0.6)` | rail `setActive` |
| フォント（数字・ラベル） | Figtree | |

---

## 2. Lottie ♥/🔖 ボタン（記事画面と同一素材・全画面共通）

rail・bar のハート/ブックマークは**記事画面と同じ Lottie ボタン**。

- 素材: `heart-like.json` / `bookmark-like.json`（`lottie-data.js` に同梱し `<script src>` で読み込む。**`fetch` は file:// で CORS 失敗**するので不可）。
- アウトライン系レイヤーを白に変更: `data.layers[0].shapes[1].c.k = [1,1,1,1]` / 同 `layers[2]`。
- フレーム: `LIKE_START=17`、`FILLED=90`（押下＝17→90 で停止）、`UNLIKE_START=105`（解除＝105→終端→0）。
- **連打ガード**（アニメ中は無視）。
- ON 時はボタンのボーダー色を上記トークンへ。
- 記事画面の `LikeButton` パターンをそのまま流用可（`badge/flutter-handoff/ARTICLE_SCREEN.md`）。

---

## 3. `<bwu-action-rail>` — 縦動画の右側アクションボタン

縦画面の右側に**縦並び**で並ぶ 5 ボタン。既定 `heart,bookmark,comment,detail,fullscreen`。

- 各 `48×48` 円、`gap 8`。配置はホスト側（`position:absolute; right:16px; top:…`）。
- **♥/🔖 = トグル**（§2 の Lottie、コンポーネント内で完結）。
- **💬/📄/⛶ = ワンショット**（タップで Lottie を頭から1回再生し、イベント通知のみ。開閉・全画面化はホスト側）。

**イベント**（`bubbles: true, composed: true`）:
| event | 意味 | detail |
| --- | --- | --- |
| `heart` / `bookmark` | トグル | `{ on: bool }` |
| `comment` | コメントシート開閉トリガ | — |
| `detail` | 概要シート開閉トリガ | — |
| `fullscreen` | 全画面トリガ | — |

**メソッド / 属性**:
- `setActive(name, on)` … コメント/概要シートが開いている間、そのボタンのボーダーを white60% にする。
- `setCommentArtists(urls)` … §3.1（アーティストコメント時のアイコン巡回）。
- 属性 `buttons="heart,bookmark,comment,detail,fullscreen"` … 表示ボタンの選択・並べ替え。
- 属性 `comment-artists="url1,url2,url3"` … 起動時にアーティスト巡回を開始（最大3）。

**全画面**は「Vimeo 標準ボタンと同じ挙動」にするため、`fullscreen` イベントで **Vimeo Player SDK** の `player.requestFullscreen()` を呼ぶ（`iframe.requestFullscreen` は別挙動なので不可）。

### 3.1 コメントボタン：アーティストコメント時のアイコン巡回（2026-07-03 追加）

そのコンテンツに**アーティスト本人のコメントが付いている場合**、コメントボタンの中身が
吹き出しアイコン⇄アーティストのアバターに「ポワン」と切り替わりながら巡回する。
**ボタンの背景ピルはそのまま**、中身のアイコンだけが差し替わる。

- **巡回順**: `吹き出し → アーティスト① → ② → ③ → 吹き出し …`（無限ループ）。最大 **3 人**。
- **保持時間**: アーティストは**各 1.0s**。1周して吹き出しに戻ったら **5.0s 待機**してから次の周へ（＝吹き出しが基準・休止点）。
  - タイマは「index が 0（吹き出し）に戻ったら 5s、それ以外は 1s」の**可変ディレイ**（等間隔 1s ではない）。
- **切替アニメ（＝「ポワン」）**: 中身を中央に重ね、表示側だけ `scale(1)`。
  - **入り**: `scale 0→1`、`transform 0.40s cubic-bezier(0.34, 1.56, 0.64, 1)`（オーバーシュートで弾む）＋ `opacity 0→1 / 0.26s`。
  - **抜け**: `scale 1→0`、`transform 0.28s cubic-bezier(0.4, 0, 1, 1)`（素早く縮む）＋ `opacity 1→0 / 0.18s`。
  - 入り・抜けは**同時進行**（前の面が縮みながら次の面が弾んで出る）。
- **アバターの見た目**: `30×30` 円、`object-fit: cover`、**白 1.5px リング**（`box-shadow 0 0 0 1.5px rgba(255,255,255,0.85)`）でアーティストと分かるよう縁取り。
- **アーティストコメントが無い場合**: 巡回しない（通常の吹き出しアイコン固定）。API 的には `setCommentArtists([])`。

Flutter 実装方針:
- コメントボタンを `Stack` + `AnimatedScale`/`AnimatedOpacity`（または `AnimatedSwitcher`）で実装。子 = `[吹き出し, avatar①, avatar②, avatar③]` を index で切替。
- 入りカーブ `cubic-bezier(0.34, 1.56, 0.64, 1)`（≒ `Curves.easeOutBack`）、抜け `cubic-bezier(0.4, 0, 1, 1)`（≒ `Curves.easeIn`）。
- 参照実装: `collection/bwu-action-rail.js` の `setCommentArtists(urls)`。

---

## 4. `<bwu-action-bar>` — 横モード下部の浮遊バー

横画面（16:9）下部の**フローティングバー**。Figma 9448-27814/27815/27824。
背景なし＝浮遊。中の各グループだけ `#303030` ピル。`:host` は `pointer-events:none`（ピルだけ `auto`、余白タップは背面へ通す）。

構成（左→右）:
- **コメントピル**: 吹き出しアイコン ＋ ラベル ＋ コメント者アバター（`28×28` 円、`margin-left:-8` で重ね、`border 2px #303030`）＋ 「+3」等の more テキスト。
  - **アイコン↔ラベルの gap は `4px`**（Figma 10121-28405 準拠。2026-07-03 統一。余分な margin を足さないこと）。
- **アクションピル**: ♥（§2）＋ `divider`（1×24, white20%）＋ 🔖。

**イベント**: `comment` / `heart`（`{on}`）/ `bookmark`（`{on}`）。
**属性**:
- `label` … コメントボタンのラベル（既定 `Comments`）。
- `avatars` … アバター色インデックス CSV（例 `"0,2,4"`、空で非表示）。
- `more` … アバター右のテキスト（既定 `+3`）。

配置はホスト側（`position:absolute; left:0; right:0; bottom:0` + 左右 padding + セーフエリア下端）。

---

## 5. `bwu-vimeo-controls.js` — 自前の Vimeo プレイヤーUI

全 Vimeo 画面（video/live × tate/yoko）で **Vimeo 標準コントローラーを隠し、自前UIを重ねる**共通スクリプト。
`</body>` 直前で `<script src="../bwu-vimeo-controls.js">`（Vimeo SDK が未ロードなら自動ロード）。

要点（詳細は `VIMEO_PLAYER_SPEC.md` / `VIMEO_PLAYER_FLUTTER.md`）:
- `controls=0` ＋ iframe `pointer-events:none`。中央 再生/停止・上下の黒グラデ・タップで表示トグル・**2.5s 自動消滅**を `.video-stage` に注入。
- **VOD（`video-*`）**: ドラッグ可能なシークバー＋ Figtree 時刻ラベル。
- **LIVE（`live-*`、パスに `/live-`）**: 再生/停止のみ＋ `● LIVE` バッジ（**シーク不可**）。
- 全画面ボタンは**横モードのみ**シークバー右上（VOD）／右下（LIVE）。
- **横展開ルール**: 適用画面の既存の戻るボタンは削除し Vimeo 側に一本化（重複防止）。ただし縦の rail 戻る/右アクションは維持。
- iOS 初回 muted 対策: 再生タップのジェスチャ内で `setMuted(false)` → 再生後に再アサート（tate で特に必要）。

---

## 6. `BWU_SHEET_PULL_DISMISS` — シートの引き下げ閉じ（共通挙動）

コメント/概要ボトムシートに共通の閉じ操作。**シート最上部（スクロール位置 top）からさらに下へ少し引っ張ると閉じる**。

- 対象: `.comment-sheet` / `.desc-sheet`。中のスクロール要素が `scrollTop<=0` のときだけドラッグ開始。
- 引っ張り中はシートを指追従（`transform: translateY`）、離した時に **`PULL_CLOSE_PX = 50` を超えていれば閉じる**（既存の ✕ クローズ動作を再利用）。50 未満は元位置へスナップバック。
- 実装はドロップインのインライン IIFE（`video-tate-*/index.html` 等の末尾）。Flutter では `DraggableScrollableSheet` / スクロール最上部での下方向ドラッグ量で `Navigator.pop` 相当。

---

## 7. 共通の状態管理・落とし穴

- **状態はクラス駆動**: `#phone` に `.s-comment` / `.s-detail`（概要）/ `.vid-landscape` などを付け外し。JS でインライン style を直接いじらない（CSS トランジションと競合）。
- **`.phone` は `overflow: clip`**（`hidden` 不可）: 画面外へ退避したシートが `scrollHeight` を増やし、`hidden` だとコンテナが数十px スクロールして `bottom:0` アンカーが崩れる。
- **高さは `100dvh` 基準**（固定 844px ではない。実機可視領域は小さい）。
- ボタンは**複製せず 1 セットを移動**（`AnimatedPositioned` 等）。Lottie インスタンスの二重生成を避ける。

---

## 8. 使用状況（2026-07-04 時点）

- コレクション（記事一覧 `collection/`）から ph2/ph3 × 縦/横 × video/live の各画面へ遷移。各画面は 1 モード固定。
- **通常記事（article）も `collection/article/` に統合**。コメントボタンは §4 の `<bwu-action-bar>` を共用。
- rail は縦画面、bar は横画面、vimeo-controls は全 Vimeo 画面で共通ロード。
- アーティストコメント巡回（§3.1）は現状 `video-tate-ph2` / `video-tate-ph3` で配線（仮アバター）。本番はアーティストアバターURLを `setCommentArtists()` に渡す。

---

## 9. 更新履歴（直近）

**2026-07-03/04**
- コメントボタン（bar/rail 内）: アイコン↔ラベル gap を **4px** に統一（Figma 10121-28405）。
- コメントシートヘッダー（全8画面）: 見出しのアイコン↔「Comments」gap を **4px** に統一。
- アーティスト絞り込みトグルのラベルを **「Artist」** に変更（live 4画面）。
- **縦 LIVE（tate ph2/ph3）: 初期表示はコメントシート閉**（💬 で開閉）。
- video-tate ph2/ph3 の gate.js 復元、通常記事を `collection/article/` へ移設。
