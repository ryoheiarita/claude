# アニメーション素材 引き渡しパッケージ（Flutter 向け）

`article.html` で使用している 3 つのアニメーションを、Flutter で再現するための素材一式です。

| 素材 | 形式 | ファイル |
| --- | --- | --- |
| ① ローディングアイコン | Dart（CustomPainter / 依存ゼロ） | `loading_icon/loading_icon.dart` |
| ② ハートアイコン（動き付き） | Lottie JSON | `lottie/heart-like.json` |
| ③ ブックマークアイコン（動き付き） | Lottie JSON | `lottie/bookmark-like.json` |
| ②③ の組み込みサンプル | Dart | `lottie/like_button.dart` |

**記事画面そのものの実装指示書**も同梱しています（ヘッダー・戻るボタンを除く本文の構造・タイポグラフィ・3 つのアニメーション）:
👉 [`ARTICLE_SCREEN.md`](ARTICLE_SCREEN.md)

さらに、**記事画面の動くリファレンス実装（HTML/JS）一式**も同梱しています。Flutter での挙動確認用にローカルで開けます:
👉 [`reference-html/`](reference-html/)（開き方は `reference-html/README.md` 参照）

> 現状、記事画面**全体**の Flutter コードは未提供です。素材ウィジェット（`LoadingIcon` / `LikeButton`）＋
> 指示書（`ARTICLE_SCREEN.md`）＋動く HTML リファレンス（`reference-html/`）を元に実装してください。

---

## ① ローディングアイコン

モーフィングする図形 + 有機的なグラデーションブロブのプロシージャルアニメーションです。
画像でも Lottie でもなく、`CustomPainter` で描画するため**外部依存はありません**。

### 使い方

`loading_icon/loading_icon.dart` をプロジェクトに追加して、ウィジェットとして配置するだけです。

```dart
import 'loading_icon.dart';

// 背景なし（オーバーレイの上に重ねる場合）
const LoadingIcon(size: 100, backgroundColor: Colors.transparent)

// 黒背景で単体表示
const LoadingIcon(size: 200)
```

| パラメータ | 既定値 | 説明 |
| --- | --- | --- |
| `size` | `200` | 表示サイズ(px)。内部は 400px で描画し縮尺します。 |
| `backgroundColor` | `Colors.black` | 背景色。透過させる場合は `Colors.transparent`。 |

> Web 版（`article.html`）では 100px / 透過背景で、ローディングオーバーレイの中央に表示しています。

---

## ②③ ハート / ブックマークアイコン（Lottie）

[lottie-web](https://airbnb.io/lottie/) 形式の JSON です。
Flutter では公式の [`lottie`](https://pub.dev/packages/lottie) パッケージで再生できます。

両ファイルとも**フレーム構成は共通**です:

| 区間 | フレーム | 内容 |
| --- | --- | --- |
| 初期状態 | `0` | 枠線のみ |
| ON | `17 → 90` | 枠線 → 塗りつぶし + バースト |
| OFF | `105 → 181` | 塗りつぶし → 枠線 |

- フレームレート: **60fps** / 全 **181** フレーム
- 枠線の色: **白を JSON に焼き込み済み**（Web 版と同じ見た目）
  - 色を変えたい場合は JSON 内の `"heart"` / `"heart 3"` レイヤーの塗り色を編集してください。

### セットアップ

`pubspec.yaml` に lottie パッケージとアセットを登録します。

```yaml
dependencies:
  lottie: ^3.1.2

flutter:
  assets:
    - assets/lottie/heart-like.json
    - assets/lottie/bookmark-like.json
```

### 使い方

`lottie/like_button.dart` に、タップでトグルする組み込みサンプルを同梱しています。
ON 時の枠線色は Web 版に合わせています（ハート=赤 / ブックマーク=黄）。

```dart
import 'like_button.dart';

// ハート
LikeButton(
  asset: 'assets/lottie/heart-like.json',
  activeBorderColor: const Color(0x99FF3E3E), // rgba(255,62,62,0.6)
)

// ブックマーク
LikeButton(
  asset: 'assets/lottie/bookmark-like.json',
  activeBorderColor: const Color(0x99FFD133), // rgba(255,209,51,0.6)
  onChanged: (isOn) => debugPrint('bookmark: $isOn'),
)
```

`LikeButton` がやっていること（自分で実装する場合の要点）:

1. `AnimationController` の長さを `composition.duration`（= 181f / 60fps）に合わせる。
2. フレーム `f` への移動は `controller.value = f / 181`。
3. ON タップ: `17/181` から `90/181` まで `animateTo`（区間の長さ = `(90-17)/60` 秒）。
4. OFF タップ: `105/181` から `181/181` まで再生し、最後に `value = 0` で初期状態へ。
5. 連打対策に再生中フラグ（`_animating`）でガード。

---

## 参照元

- Web 実装: `article.html`（ローディング = `loading-icon.js` / Lottie = 上記 2 ファイル）
- このパッケージは Web 版と同じ挙動・見た目になるように切り出しています。
