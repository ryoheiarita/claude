# BMSG SHOP マイページ (/account) レイアウト改修

| ファイル | 用途 |
|---|---|
| `account-mypage.css` | 新スタイル。Shopify の `assets/` に配置 |
| `account-mypage.liquid` | 本文マークアップ。`sections/main-account.liquid` の `.btown-section` 〜 `#logout_btn` を置き換え |
| `preview.html` | ローカル確認用の静的モック (ダミーデータ入り) |

## 適用手順
1. `account-mypage.css` を `assets/` にアップロード
2. `main-account.liquid` 内のインライン `<style>`（`.fanclub-wrap` 系）を削除
3. `.btown-section` 〜 `#logout_btn` のマークアップを `account-mypage.liquid` の内容で置き換え
4. 既存のファンクラブ行ループ（`fanclubs` の部分）と各リンク URL を実データに差し替え
5. ⓘモーダルの JS は既存のまま

## 要確認
- **チケット先行用住所の保存先**（metafield 名 / 別 address など）。現状は `customer.metafields.custom.ticket_address` を仮置き
- 性別・生年月日の metafield キー（Customer Fields アプリのキーに合わせる）

## デザイン
Design_System_V2 (Figma) のトークン準拠:
Surface `rgba(255,255,255,.08)` / Divider `rgba(255,255,255,.15)` / Text 100% / 75% / 50% / accent `#FF3E55` / radius 12px / Figtree

- PC: 基本情報は「ラベル | 値」のリスト、住所は 2 カラムのカード、加入済みは管理画面風テーブル
- SP (〜767px): 基本情報はラベル上・値下、住所カードは縦積み、テーブルは行ごとのカードリストに変換（`data-label` で項目名表示）
