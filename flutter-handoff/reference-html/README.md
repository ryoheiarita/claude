# 記事画面 リファレンス実装（HTML / JS）

`article.html` の**動く実装そのもの**です。Flutter 実装の挙動確認用にご利用ください
（起動ローディング → ドミノ・ブラーリビール → インライン画像の遅延スケルトン、
ハート/ブックマークの Lottie アニメーションが実際に動きます）。

> 仕様の文章は親フォルダの `ARTICLE_SCREEN.md` を参照してください。

## 開き方（重要）

`article.html` は ES モジュールの `import` と `fetch` を使うため、
**ファイルを直接ダブルクリック（`file://`）すると動きません**。
簡易サーバ経由で開いてください。

```bash
# このフォルダ(reference-html)で実行
python3 -m http.server 8000
# → ブラウザで http://localhost:8000/article.html を開く
```

VS Code を使う場合は「Live Server」拡張で `article.html` を Open with Live Server でも可。

## 構成
| ファイル | 役割 |
| --- | --- |
| `article.html` | 記事画面本体（対象の実装） |
| `home.html` | 戻るボタンの遷移先（参考・スコープ外） |
| `loading-icon.js` | ローディングアイコン（canvas 版。Flutter は `loading_icon.dart` を使用） |
| `heart-like.json` / `bookmark-like.json` | ハート/ブックマークの Lottie |
| `assets/befirst-logo.svg` | インライン画像のプレースホルダ透かし |

## 注意
- 記事内の写真は Figma の URL を直接参照しているため、表示には**ネット接続**が必要です。
- 上部のステータスバー/ナビバー（戻るボタン）は実装スコープ外です。
