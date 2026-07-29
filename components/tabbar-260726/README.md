# Floating Tab Bar **260726** — bwu の正式タブバー

> ✅ **現行が「正」** — スナップショットは `baseline/`(壊したら書き戻す。旧版は `_archive/`)。
>
> 📍 **実体はリポジトリ内 `badge/components/tabbar-260726/`**(git管理下)。
> 従来の `bwu/components/tabbar-260726` は同じ場所を指すシンボリックリンクなので、
> どちらのパスで開いても中身は同一。コマンドは今までどおり bwu 直下から:
> `node components/tabbar-260726/build-docs.mjs`

## 他のセッション / 他プロジェクトで使う → **`dist/`**
持ち出すのは **`dist/` の5ファイルだけ**。手順とAPIは [`dist/README.md`](dist/README.md)。
まず `dist/example.html` を開けば、dist だけで動くことを確認できる。

```
dist/tabbar.css          コンポーネントCSS
dist/tabbar.markup.html  <nav class="tabbar"> 一式
dist/tabbar.js           コントローラー(window.Tabbar)
dist/tabbar-adjust.js    確定した微調整値(★これが無いとサイズ/位置指定が外れる)
dist/lottie-icons.js     アイコン7つの Lottie(file:// でも動く)
```

組み込みは4ステップ: ①5ファイルをコピー ②head で lottie-web → lottie-icons → tabbar-adjust → tabbar.css
の順に読み込む ③markup を **position:relative な親**の直下に貼る ④body 末尾で tabbar.js。

⚠️ `dist/` と `badge/docs/tabbar/` は**自動生成**。直すのは本体 `index.html` で、
そのあと必ず `node components/tabbar-260726/build-docs.mjs` を実行する。

**形は `ui_prototype/checkin_motion` のタブバーを【そのまま】**(CSS・マークアップ・
寸法 h64 / item48 / icon24 / label11・中央75pxの丸がバー上端から10pxはみ出す形・
すりガラス丸+HANAフラワーロゴまで verbatim)。

その形のまま、**バーの4アイコンを animated iconsax Lottie に差し替え**、
**More タップの展開メニュー**を追加:
Design_System_V2 `Tabbar_set` node `322:1202`(variant Opened)。
More を押すと丸が白反転(ロゴ黒)し、バーの上に3つのサテライトが展開する。

## 構成

| 場所 | key | ラベル | アイコン |
|---|---|---|---|
| バー | home | Home | **Lottie** home-2(animated iconsax) |
| バー | poppin | Poppin' | **Lottie** messages-4(データkeyは`talk`) |
| バー | more | More | すりガラス丸48 + HANAフラワー(静的SVG、checkin_motionそのまま) |
| バー | shop | Shop | **Lottie** bag-2 |
| バー | mypage | Mypage | **Lottie** profile-circle |
| Moreメニュー | checkin | Check In | **Lottie** location |
| Moreメニュー | gallery | Library | **Lottie** gallery |
| Moreメニュー | calendar | Calendar | **Lottie** calendar |

Lottieは白ストローク焼き込み。バーの inactive = opacity 50%(ラベルは色で50%、
checkin_motionと同じ見た目)。タップでアクティブ化+1回再生。
**再生は「最初に動き出すキーフレーム」から開始**(iconsaxのLottieは冒頭に160〜534msの
無動作フレームが焼き込まれているため、そこをスキップして即動くようにしている。
JS `firstMotionFrame()` で自動計測 / Flutter側は `kIconStartFraction` に同値をハードコード)。
サテライトは開くときスタッガーでポップし、各 Lottie が1回再生される。
外側タップ(スクリム)で閉じる。

## Moreメニュー実測スペック(Figma 322:1202)
| token | value |
|---|---|
| サテライト丸 | 56px(アイコン24px中央) |
| 列ピッチ | 80px(丸56+間隔24) |
| サイド列の下げ | 中央より +32px |
| メニュー下端→バー上端 | 12px |
| 丸のスタイル | bg rgba(255,255,255,.10) / border rgba(255,255,255,.08) / blur 8 |
| ラベル | 11px / rgba(255,255,255,.75)、丸の2px下 |
| Opened中央丸 | #fff、HANAロゴ黒 |

## Moreメニューの選択仕様
- サテライト3つのアイコンは **通常タブの非アクティブと同じ**(白 Lottie を opacity 0.5)。ラベルも white50。
- **閉じる操作**: サテライトをタップ / **バーの通常タブをタップ** / More 再タップ / バー外(スクリム)タップ。
- サテライトを選ぶと中央 More が **白背景 + 選んだアイコン(黒) + そのラベル(白100%)** に変わる。
  アイコンは同じ Lottie を流用し `filter:invert(1)`(Flutterは `ColorFiltered` + `BlendMode.srcIn` 黒)で反転、
  選択時に1回再生。微調整値はサテライトと同じものを中央にも適用。
- バーのタブを押すと解除され通常の More に戻る。
  JS API: `Tabbar.selectMore(key)` / `Tabbar.clearSelection()` / `Tabbar.selected`。

## 出現アニメ(画面表示時)
画面下(-110px)から **遅れて ease-out でせり上がる** → 到着に合わせて **バー4アイコンを1回ずつ再生**。

| 項目 | 値 |
|---|---|
| 遅れ | 400ms |
| 移動 / duration / easing | bottom -110px → 24px / 700ms / `cubic-bezier(.16,1,.3,1)` |
| アイコン再生開始 | 動き出し +380ms、70msずつスタッガー(Home→Poppin'→Shop→Mypage) |

⚠️ 移動は **`bottom`(レイアウトプロパティ)**で行う。transform/opacity で動かすと合成レイヤー化して
**動作中だけ blur が消える**(実測で `.tabbar::before` の blur(16px) が生きていることを確認済み)。
JS API: `Tabbar.enter()` で再生、タイミングは `Tabbar.ENTER = {delay, iconLeadIn, iconStagger}`。
Flutter は `autoEnter`(既定 true)/ GlobalKey 経由の `enter()`。

## 背景グラデーション(Figma 322:1202 コンテナ・高さ268)
| 状態 | 値 |
|---|---|
| 通常時 `261:414` | `linear-gradient(180deg, rgba(0,0,0,0) 52.404%, rgba(0,0,0,0.6) 100%)` / blurなし |
| 展開時 `316:1059` | 黒グラデ `rgba(0,0,0,0) 0% → .08 40% → .5 70% → #000 100%` + background blur 32 |
| 切替 | 色グラデ = opacity 0.3s / blur = **半径 0→32 をアニメ** |

⚠️ **展開時のblurは「上に向かって透明になるblur」**。Figmaのbackground-blurはレイヤー自身の
アルファで変調されるため、グラデが透明な上側ではblurも効かない。CSSでは blur層(`.tabbar-bg__blur`)に
`mask-image: linear-gradient(180deg, transparent 0%, transparent 38%, #000 70%)` を掛けて再現。
**38%(中央 Library ラベルのすぐ上)から 70% へ緩やかに強くする**。位置は
`--tabbar-bg-blur-from` / `--tabbar-bg-blur-to`。
⚠️ 全開位置を下げすぎる(100%等)と、その頃には黒グラデが濃くて **blur が見えなくなる**。
黒グラデ側も上〜中盤を薄く保つカーブにして、blur が見える帯(38〜70%)を確保している。
フェードは opacity ではなく **backdrop-filter の半径そのもの**をtransitionする(opacityだと合成
レイヤー化でblurが飛ぶ)。層順は `::before`(通常グラデ)→ `__blur` → `::after`(展開グラデ)。

## Files
- **`index.html`** — コンポーネント本体＋微調整ツール。3コピーブロック構成
  (BEGIN/END TABBAR CSS・`<nav>`+スクリム・BEGIN/END TABBAR JS)。
  JS API: `Tabbar.setActive(i)` / `Tabbar.openMore()` / `Tabbar.closeMore()` / `Tabbar.play(key)`
- `lottie-icons.js` — 7つの Lottie JSON を `window.TABBAR_ICONS` としてインライン(file:// OK)。
  バー4つ(home / talk / shop / mypage)+サテライト3つ(checkin / gallery / calendar)全て使用
- `assets/*.json` — Lottie 元ファイル(**Flutter へは7つ全部渡す**)
- `assets/svg/` — 静的SVG。Flutter で使うのは `ic_hana.svg`(中央More)のみ。
  ic_home 等の塗りアイコン版も残してある(アニメを外したくなった場合用)
- **`build-docs.mjs`** — 公開ページ(badge/docs/tabbar/)を本コンポーネントから生成する。
  `node components/tabbar-260726/build-docs.mjs`(bwu直下)で
  デモ index.html・仕様書の上部プレビュー・adjust/lottie/dart のコピーが一括で同期される。
  **手でdocs側を編集しないこと**(次のビルドで上書きされる)
- `docs-template.html` — デモページの外枠(携帯フレーム/スマホ全画面表示)のテンプレート
- `flutter/tab_bar_260726.dart` — エンジニア渡し用 Flutter 実装
  (バー+サテライト = lottie、中央HANA = flutter_svg、展開アニメ込み)

## ⚠️ 微調整値は `tabbar-adjust.js` に焼き込む(最重要)
微調整ツールの値は **localStorage(ブラウザ内)にしか残らない**。
確定値は `tabbar-adjust.js`(`window.TABBAR_ADJUST`)が保持し、これを読み込むだけで
ツール無しでも適用される。**このファイルを更新しないと公開ページ/他PCでは「指定が外れた」状態になる。**

反映先は3つ。調整したら必ず全部やる:
1. `tabbar-adjust.js` ← ツールの **「① 確定値をコピー」** で丸ごと置換
2. `flutter/tab_bar_260726.dart` の `kMoreSpec`/`kTabAdjust` ← **「② Flutterコードをコピー」**
3. `badge/docs/tabbar/tabbar-adjust.js` ← 1のファイルをコピー(公開ページ用)

## 微調整ワークフロー
1. localhost で開く: `http://localhost:8931/components/tabbar-260726/`(bwu-static サーバー)
2. 左上 **「微調整」ON**(Moreメニューが自動で開く)
3. アイコンをクリックで選択(青破線)→ **ドラッグ** or **矢印キー**
   - 矢印 = 0.5px / Shift = 2px / Alt = 0.1px / `[` `]` = スケール ±0.01
   - バーの静的アイコン(HANAロゴ含む)も、サテライトの Lottie も同じ操作で調整可
4. パネルで Moreメニューのレイアウト(丸サイズ・ピッチ・サイド下げ・バー上gap)も調整可
5. 値は localStorage 自動保存(キー `tabbar260726_adj_v3`)
6. **「Flutterコードをコピー」** → `kMoreSpec` / `kTabAdjust` の Dart ブロックを
   `flutter/tab_bar_260726.dart` に貼り替えてエンジニアへ

## Flutter 側の受け取り
- `pubspec.yaml`: `lottie: ^3.1.0` + `flutter_svg: ^2.0.0`
- assets: `assets/tabbar/` に Lottie 7つ(home/talk/shop/mypage/checkin/gallery/calendar)
  + `ic_hana.svg`(assets/svg/ から)
- `TabBar260726(index: i, onChanged: ..., onMoreItem: (key) {...})` を `Stack` 内 `bottom: 24` に配置
- `onMoreItem` に `'checkin' | 'gallery' | 'calendar'` が飛んでくる(遷移はアプリ側で実装)

## 注意(checkin_motion / 元コンポーネントから継承)
- ⚠️ **Lottieホルダー(span.tab-item__lottie)には `display:block` 必須**(CSS内蔵済み)。
  span は非置換インライン要素で、**インライン要素への transform は描画で無視される**
  (getComputedStyle には値が出るので気づきにくい)。無いと微調整の移動/スケールが一切効かない。
  検証は computed style でなく `getBoundingClientRect()` かスクショで行うこと(実際にこれで見逃した)
- ⚠️ **box-sizing:border-box 必須**(このコンポーネントは `.tabbar, .tabbar *` にスコープ付きで内蔵済み)。
  バーの寸法は border-box 前提(h64 = padding込み)。グローバルリセットの無いページに
  素のCSSだけコピーすると **バーが78pxに膨らみ、中央ボタンのはみ出しが消える**。
  過去に実際にこのミスが起きたので、コピー時は必ず `.tabbar, .tabbar *{box-sizing:border-box;}` の行ごと持っていくこと
- バーの blur は `.tabbar::before` に置く(`.tabbar` 本体だと内側の More 丸・サテライトの
  backdrop-filter が死ぬ)
- バーを動かすアニメは transform ではなく `bottom` 等のレイアウトプロパティで
- `.tabbar` は z-index:6、スクリムは z-index:5(バーより下)。この上下関係を崩さないこと
