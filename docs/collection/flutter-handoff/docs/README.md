# BWU 動画/LIVE UI — Flutter 指示書

共通コンポーネントと Vimeo カスタムプレイヤーを Flutter に横展開するための指示書群。
動作リファレンス: `vimeo-test.html`（縦9:16）／ `vimeo-test-landscape.html`（横16:9・全画面ボタン付き）、
各画面のプロトタイプは `ui_prototype/media/collection/`。

## ファイル
| ファイル | 内容 |
|---|---|
| [`COMPONENTS_HANDOFF.md`](COMPONENTS_HANDOFF.md) | **共通コンポーネント指示書**。rail / bar / vimeo-controls / Lottie♥🔖 / シート引き下げ閉じ など、画面をまたいで使い回す部品と共通挙動。まずこれを読む |
| [`VIMEO_PLAYER_SPEC.md`](VIMEO_PLAYER_SPEC.md) | **挙動仕様（プラットフォーム非依存）**。全Vimeo画面で守るUI/操作仕様 |
| [`VIMEO_PLAYER_FLUTTER.md`](VIMEO_PLAYER_FLUTTER.md) | **Flutter実装ガイド**。WebView+Stack構成のフルコード・対応表・注意点 |

## 要点（30秒サマリ）
- Vimeo標準コントローラーは出さない（`controls=0` ＋ iframe `pointer-events:none`）
- 自前で **再生/停止ボタン・戻るボタン・シークバー（タップ&ドラッグ可）** を重ねる
- **戻るボタンは Figma デザイン**（40px / 角丸42 / 黒30%+白ボーダー8% / blur16 / chevron-left）・**左12px**
- **横動画のときだけ**、シークバー右上に **40pxの全画面ボタン**
- 視認性のため **下端＋上端に黒グラデーション**
- 数字テキストは **Figtree**
- UIは **2.5秒で自動消滅**。映像タップでトグル（表示中→消す／非表示→出す）。再生・バー・全画面ボタン操作ではUI維持。全画面ボタンも消滅グループに含む
- **【横展開ルール】他画面に適用時、既存の戻るボタンは削除し Vimeo側に一本化**（重複防止）
- Flutterでも **WebView + Stack + Vimeo Player SDK(postMessage)** で同一挙動を再現可能
