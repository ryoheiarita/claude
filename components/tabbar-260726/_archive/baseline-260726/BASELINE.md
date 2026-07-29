# BASELINE 2026-07-26 — 確定版スナップショット(編集禁止)

ユーザー承認済みの「正」の状態。親ディレクトリの index.html を今後いじって
壊れた場合は、この2ファイル(index.html / lottie-icons.js)を親に書き戻せば復元できる。

状態の定義:
- 形 = checkin_motion のタブバー verbatim(h64 / item48 / icon24 / label11、
  中央HANA丸がバー上端から10pxはみ出す)
- バー4アイコン = animated iconsax Lottie(home-2 / messages-4 / bag-2 / profile-circle)、
  inactive=opacity50%、タップで1回再生。中央More = HANAフラワー静的SVG
- Moreタップ → 丸白反転+ロゴ黒、Check In / Book / Calendar 展開(Figma 322:1202、
  丸56 / ピッチ80 / サイド+32 / バー上12)
- 微調整値 = 全てゼロ(dx0/dy0/scale1)がベースライン
- 修正済みの罠: box-sizing:border-box 内蔵 / .tab-item__lottie{display:block} 内蔵
