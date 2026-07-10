# BwU チェックインパスポート — ブック開きアニメーション 引き継ぎ

Flutter エンジニア向けの実装仕様です。動きの正解は同ディレクトリの
**index.html**（テスト実装＋ジェネレーター）をブラウザで開いて確認してください。
ジェネレーターの「Dart をコピー」で、調整済みパラメータが焼き込まれた
`PassportBook` ウィジェットのコードが取得できます。

## 参照デザイン（Figma: Renewal_UI_Design / RBcywS6kYjz8ZCFfZ1Z4MP）

| ノード | 内容 |
|---|---|
| 9044-41658 | チェックイン画面。左上の「Artist_name PASSPORT」チップが起点 |
| 9044-41898 | ヘッダー（ナビバー＋パスポートチップ＋カウンター）※最新版 |
| Tabbar_set | タブバーコンポーネント（9044-41928 のインスタンス） |
| 1088-9906 | パスポートを開いた画面（スタンプページ） |
| 1088-10532 | `book` レイヤー。ページの外周に見える枠 = **開いた表紙の裏側** |

index.html のチェックイン画面は上記 Figma 準拠で実装済み
（マップ・ピンクピン・1/10ピル・斜めストライプのチケットカード・Tabbar_set。
アセットは `assets/` にダウンロード済み）。ブックアニメの背景として使用。

## 仕様

1. **左開き固定**: 背表紙が左端。表紙は左端を軸に、手前に持ち上がって
   左へ約176°回転して開く（`hingeRight = false`）。
2. **色の連動**: ブックの表紙色は可変。開いた時にページの外周に見える枠は
   裏表紙そのものなので、**必ず表紙と同色**にする（`coverColor` を共有）。
   開く途中に見える表紙の裏面は表紙色を約28%暗くした色（`insideCoverColor`）。
3. **質感（Paper By WeTransfer「sinta」を再現）**:
   - 背表紙側は**クロステープ**（幅 `spineWidth`、色 `tapeColor`。デフォルトは
     表紙色を80%白寄せの自動生成、ジェネレーターで個別指定も可 → JSON の
     `tapeColorMode` 参照）。
     テープの上に ①外端のエッジ線（黒22%→白55%→黒10%の細線）
     ②テープ中央の丸みハイライト（白30%） ③テープ先の折り溝（黒16%→フェード）
     をグラデーションで重ねる。数値は index.html の `.spine` レイヤーが正
   - **帯（背表紙）側の角丸はほぼ無し**（`spineCornerRadius` = 4）。
     小口側だけ `cornerRadius` で丸める → `PassportBookSpec.coverRadius`
   - 表紙上部にわずかな環境光、下部にわずかな落ち影
   - 紙のグレイン（微細ノイズ、opacity 3〜6% 程度。Flutter では
     `Image`/`ShaderMask` のノイズテクスチャか、省略も可）
   - 閉じた状態では下に大きく柔らかいドロップシャドウ
4. **シーケンス**（チップをタップ →）:
   1. 入場: 閉じたブックが中央へスケールイン（約420ms）
   2. 開く: 表紙が回転（`openDuration`）。同時に本体を数度だけ逆方向にチルトさせ
      奥行きを出し、開き切る頃に戻す（`bodyTiltDeg`、sin カーブ）
   3. ズーム: 開いたページが画面いっぱいへ（`zoomDuration`）。
      最終レイアウトは Figma 1088-9906（ヘッダー下〜画面下端、左右 4px）
   4. ページ上のスタンプ・ページカウンター・「戻る」「ページ送り」をフェードイン
   - **パスポートチップ**: 開いている間はもう一度押すと「戻る」と同じ閉じ挙動。
     開いている間はチップの枠線カラーを白にする（border rgba(255,255,255,.15) → #FFF）
5. **ページ内UI**（Figma 1088-9906 準拠、いずれも Figtree）:
   - ページカウンター（1088:10685）: 高さ28 / padding 4×12 / radius 99 /
     bg rgba(0,0,0,.65) / border rgba(255,255,255,.15) / blur 32 / 14px Regular。
     「1」は白、「/」「10」は白50%。**枠（表紙色）からページ内側に余白を取る**:
     ブック上端から top 20 / 右端から right 20（screen座標: top 138, right 24）
   - 戻るボタン（1088:11236）: 20,762 / 92×48 / 白 / radius 999 /
     padding 左16 右24 / gap 4 / Chevron_Left 20px + 「戻る」14px SemiBold 黒
   - ページ送り（2887:17662）: 282,762 / 88×48 / 白 / radius 999 / padding 16 /
     gap 16 / Chevron_Left（1ページ目は stroke-opacity 0.3 で無効表現）+ Chevron_Right 20px
   - アイコンSVG: assets/chevron_left_back.svg（戻る用・黒）,
     assets/chevron_left.svg（30%）, assets/chevron_right.svg
6. **閉じるシーケンス**（「戻る」またはパスポートチップ → 突然消さないこと）:
   1. ズームアウト: 閉時サイズへ戻る（`zoomDuration`）
   2. 表紙が閉じる（`openDuration`、開きの逆回転）
   3. **退場**: 出現の逆再生。scale 1→0.18 ＋ チップ方向（上）へ移動しつつ
      ease-in（`exitCurve` = Cubic(0.55, 0, 0.85, 0.36)）で加速フェードアウト
      （`exitDuration`）。背景の暗幕・シャドウも同時にフェード
   4. 完全に消えてからオーバーレイを非表示にする
5. **ページ**: オフホワイト（デフォルト #EBEBE8）＋ドットグリッド
   （17px 間隔、ページ色を14%暗くしたドット）。角丸はブック角丸より小さく
   `cornerRadius - pageFrameInset * 0.6`。

## Flutter 実装メモ

- 3D は `Transform` + `Matrix4.identity()..setEntry(3, 2, 0.0015)..rotateY(θ)`。
  表紙の `alignment` は背表紙側（右開きなら `Alignment.centerRight`）。
- 90° を境に表面/裏面を差し替える（裏面は `insideCoverColor` の平板でOK）。
  HTML 版は `backface-visibility: hidden` の2面構成で同じことをしている。
- イージングは CSS の `cubic-bezier(a,b,c,d)` = Flutter の `Cubic(a,b,c,d)` で
  そのまま互換。デフォルトは `Cubic(.35, 0, .15, 1)`。
- 回転の符号は座標系の解釈で逆に見える場合があるため、index.html と
  見比べて「手前に持ち上がって開く」ことを確認。逆なら符号を反転。
- 開く(2)とズーム(3)は直列ではなく、開き進捗 ~72% でズームを開始すると
  Paper に近い繋がりになる（HTML 版: `durIn + 160ms + durOpen * 0.72`）。

## パラメータ既定値

```json
{
  "coverColor": "#16324F",
  "frameColor": "= coverColor（仕様で固定）",
  "insideCoverColor": "coverColor を -28% shade",
  "tapeColor": "coverColor を +80% 白寄せ（背のクロステープ）",
  "pageColor": "#EBEBE8",
  "hinge": "left",
  "cornerRadius": 18,
  "spineCornerRadius": 4,
  "spineWidth": 28,
  "pageFrameInset": 10,
  "closedScale": 0.62,
  "entranceDurationMs": 420,
  "openDurationMs": 900,
  "zoomDurationMs": 650,
  "exitDurationMs": 420,
  "openCurve": [0.35, 0, 0.15, 1],
  "exitCurve": [0.55, 0, 0.85, 0.36],
  "bodyTiltDeg": 7,
  "coverOpenDeg": 176
}
```
