# tabbar 260726 — 他プロジェクト / 他セッションで使う

**このフォルダ(dist)は自動生成。編集しても次のビルドで上書きされる。**
直すときは `components/tabbar-260726/index.html`(本体)を直して
`node components/tabbar-260726/build-docs.mjs` を実行する。

## 何が入っているか
| ファイル | 中身 |
|---|---|
| `tabbar.css` | コンポーネントのCSS(box-sizing ガード・出現アニメ・More展開・背景グラデを含む) |
| `tabbar.markup.html` | `<nav class="tabbar">` 一式(背景グラデ層 + スクリム + バー + Moreメニュー) |
| `tabbar.js` | コントローラー(`window.Tabbar`) |
| `tabbar-adjust.js` | **確定した微調整値**。これが無いとアイコンのサイズ/位置指定が外れる |
| `lottie-icons.js` | アイコン7つの Lottie を `window.TABBAR_ICONS` にインライン(file:// でも動く) |
| `example.html` | dist だけで動く最小サンプル(まずこれを開いて確認) |

## 組み込み手順(4ステップ)
1. `dist` の5ファイルをコピーする。
2. `<head>` で読み込む(**この順番**):
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
   <script src="lottie-icons.js"></script>
   <script src="tabbar-adjust.js"></script>
   <link rel="stylesheet" href="tabbar.css">
   ```
3. `tabbar.markup.html` の中身を、**position:relative な親**の直下に貼る。
4. `</body>` の直前で `<script src="tabbar.js"></script>`。

## JS API
| 呼び出し | 動作 |
|---|---|
| `Tabbar.setActive(i)` | バーのタブを選択(0=Home 1=Poppin' 3=Shop 4=Mypage)。Moreの選択は解除され、展開中なら閉じる |
| `Tabbar.openMore()` / `closeMore()` / `toggleMore()` | Moreメニューの開閉 |
| `Tabbar.selectMore(key)` | 'checkin' / 'gallery' / 'calendar' を選択(中央Moreが白背景+そのアイコン+ラベルに) |
| `Tabbar.clearSelection()` / `Tabbar.selected` | 選択の解除 / 現在の選択キー |
| `Tabbar.enter()` | 出現アニメ(下から遅れて ease-out + 4アイコン再生)を再生 |
| `Tabbar.ENTER` | 出現のタイミング `{delay:400, iconLeadIn:380, iconStagger:70}` |
| `Tabbar.play(key)` | 任意アイコンの Lottie を1回再生 |

遷移は自前で: サテライトの click で `Tabbar.selectMore(key)` が走るので、
`document.querySelectorAll('.more-item')` に自分の遷移処理を足す。

## 触ってはいけない所(壊れる)
- `box-sizing:border-box`(CSS先頭のガード) … 無いとバーが78pxに膨らみ**中央ボタンのはみ出しが消える**。
- バーのぼかしは `.tabbar::before` に置く … `.tabbar` 本体に置くと内側(More丸/サテライト)のぼかしが死ぬ。
- バーを動かすときは `bottom` … `transform`/`opacity` で動かすと**動作中だけぼかしが消える**。
- `.tab-item__lottie` の `display:block` … span のままだと transform が描画に効かない。
- `z-index`: 背景グラデ 4 < スクリム 5 < バー 6。

## Flutter
`components/tabbar-260726/flutter/tab_bar_260726.dart` と `assets/`(Lottie7 + ic_hana.svg)を渡す。
仕様書: `badge/docs/tabbar/handoff.html`(公開ページ)。
