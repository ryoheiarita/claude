# BMSG SHOP マイページ (/account) レイアウト改修

| ファイル | 用途 |
|---|---|
| `account-mypage.css` | 新スタイル（ページ＋住所モーダル）。Shopify の `assets/` に配置 |
| `account-mypage.liquid` | 本文マークアップ。`sections/main-account.liquid` の `.btown-section` 〜 `#logout_btn` を置き換え。末尾コメントに `snippets/mp-address-modal.liquid` |
| `preview.html` | ローカル確認用の静的モック（ダミーデータ・住所モーダルは JS デモ） |
| `handoff.html`（docs 側） | Shopify 実装指示ページ |

## 構成（Figma mypage_pc 1119:5276 / detail_sp_limited 1386:12398 準拠）
- マイページ見出し → 基本情報（7行リスト・注記・編集ボタン）→ 配送用住所（複数カード＋追加カード、モーダルで追加/編集/削除）→ 支払い方法・変更確認（加入済みテーブル）→ 注文履歴 → ログアウト
- PC は編集/管理ボタンを見出し右、SP はリスト下全幅（`.mp-pc-only` / `.mp-sp-only`）
- SP (〜767px) はテーブルをカードリスト化、モーダルはボトムシート

## 要確認
- 基本情報に出す郵便番号・住所（チケット先行用）の保存先。現状 `customer.metafields.custom.ticket_zip / ticket_address` を仮置き
- 性別・生年月日の metafield キー
- 住所モーダルのエラー表示（`form.errors`）は未実装
