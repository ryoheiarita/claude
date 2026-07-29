# BASELINE 2026-07-27 — 確定版スナップショット(編集禁止)

ユーザー承認済みの「今の状態が正」。親の index.html を壊した場合は
このフォルダのファイルを親に書き戻せば復元できる。

## この時点で確定している内容
- 形 = checkin_motion のタブバー verbatim(h64 / item48 / icon24 / label11、
  中央HANA丸がバー上端から10pxはみ出す。box-sizing:border-box 必須)
- バー4アイコン + Moreメニュー3アイコン = animated iconsax Lottie。
  非アクティブは opacity .5、タップで1回再生。再生は「最初に動き出すフレーム」から
- 出現アニメ: 画面外(下110px)で待機 → 400ms遅れて 700ms / cubic-bezier(.16,1,.3,1) で
  bottom 24px へ。到着に合わせて4アイコンを 70ms ずつ再生
- More展開(Figma Tabbar_set 322:1202 Opened): 中央丸が白反転しロゴ黒、
  Check In / Gallery / Calendar が丸56・ピッチ80・サイド+32・バー上12で展開
- 背景グラデ: 通常 transparent 52.404%→rgba(0,0,0,.6) /
  展開 rgba(16,16,16,0)→#101010 + **上に向かって消える** blur 8(mask で再現)
- 選択: サテライトを選ぶと閉じ、中央Moreが白背景+選んだアイコン(黒)+その項目名に。
  バーのタブを押すと解除。展開中はバーの通常タブを押しても閉じる
- 微調整の確定値は tabbar-adjust.js に焼き込み済み(home1.30 / poppin1.55 / shop1.45 ほか)

## 派生物(すべて index.html から生成)
- `dist/` … 他プロジェクトへ持ち出す一式(build-docs.mjs が生成)
- `badge/docs/tabbar/` … 公開デモ + 仕様書(同上)
- `flutter/tab_bar_260726.dart` … Flutter 実装(値は手動同期)
