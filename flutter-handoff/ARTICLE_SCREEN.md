# 記事画面 実装指示書（Flutter）

`article.html` の**記事本体**を Flutter で実装するための指示書です。
このパッケージ同梱の素材（ローディングアイコン / ハート / ブックマーク）と合わせて参照してください。

> **スコープ外**: 上部のステータスバー・ナビゲーションバー（戻るボタン）は対象外です。
> ここでは「スクロール領域＝記事コンテンツ」と、それに付随する**3 つのアニメーション**、
> および右下の FAB（ハート/ブックマーク）・下部コメントバーを扱います。

---

## 1. 画面の構造（上から下へ）

```
Scaffold (背景 #101010)
└─ Stack
   ├─ スクロール領域(ScrollArea)          … 記事本体
   │   └─ 角丸コンテナ(上だけ R16, 背景 white 8%)
   │       └─ Column(gap 16, 左右 padding 16)
   │           ├─ ① 日付 + タイトル(H1)
   │           ├─ ② バッジ行
   │           ├─ ③ 本文
   │           ├─ ④ メイン画像
   │           ├─ ⑤ H2 見出し
   │           ├─ ⑥ 本文
   │           ├─ ⑦ H3 見出し
   │           ├─ ⑧ 本文
   │           ├─ ⑨ インライン画像(独立スケルトン)
   │           ├─ ⑩ 本文(ハイライト付き)
   │           ├─ ⑪ H2 / ⑫ 本文
   │           ├─ ⑬ インライン画像(独立スケルトン)
   │           ├─ ⑭ H3 / ⑮ 箇条書きリスト
   │           └─ ⑯ H2 / ⑰ 本文
   ├─ 起動ローディングオーバーレイ          … アニメ A（最前面→消える）
   ├─ FAB グループ(ハート/ブックマーク)      … 右下固定
   └─ コメントバー                          … 下部固定
```

- 画面幅は **390px** のモバイルデザイン（実機では画面幅にフィットさせて OK）。
- スクロール領域の角丸コンテナ: `borderRadius: top 16px`、背景 `Colors.white.withValues(alpha: 0.08)`。
- 上方向の余白 `paddingTop: 120`（ナビバー分）、下方向 `paddingBottom: 100`（コメントバー/FAB 分）。
- Column の各ブロック間隔は **16px**、左右 padding **16px**。

---

## 2. デザイントークン

### カラー
| 用途 | 値 | Flutter |
| --- | --- | --- |
| 画面背景 | `#101010` | `Color(0xFF101010)` |
| スクロール領域 背景 | white 8% | `Colors.white.withValues(alpha: 0.08)` |
| 見出し/タイトル 文字 | white 100% | `Colors.white` |
| 本文 文字 | white 70% | `Colors.white.withValues(alpha: 0.70)` |
| 日付 文字 | white 50% | `Colors.white.withValues(alpha: 0.50)` |
| H3 文字 | white 90% | `Colors.white.withValues(alpha: 0.90)` |
| バッジ 背景 | white 15% | `Colors.white.withValues(alpha: 0.15)` |
| H2 下線 | white 12% | `Colors.white.withValues(alpha: 0.12)` |
| リスト●(ドット) | white 35% | `Colors.white.withValues(alpha: 0.35)` |
| ハイライトマーカー 背景 | `rgba(255,179,71,0.22)` | `Color(0x38FFB347)` |
| ハイライト 文字 | white 85% | `Colors.white.withValues(alpha: 0.85)` |
| FAB / コメントバー 背景 | black 65% | `Colors.black.withValues(alpha: 0.65)` |
| FAB / バー ボーダー | white 15% | `Colors.white.withValues(alpha: 0.15)` |

### タイポグラフィ
フォントは Latin が **Figtree**、日本語はシステム標準フォントにフォールバックします（実装側で和文フォント指定があればそれを使用）。

| 要素 | size | weight | line-height | letterSpacing | 備考 |
| --- | --- | --- | --- | --- | --- |
| 日付 | 14 | w400 | 20 | — | white 50% |
| H1 タイトル | 24 | w600 | 1.4 (≈33.6) | -0.4 | white |
| バッジ | 14 | w400 | — | -0.28 | white |
| 本文 | 16 | w400 | 28 (height 1.75) | — | white 70%、段落間 24px |
| H2 | 20 | w700 | 30 (height 1.5) | 0.8 (0.04em) | 下線 + 上下 padding 10px |
| H3 | 18 | w700 | 30 (height 1.5) | 0.8 (0.04em) | white 90% |
| リスト項目 | 16 | w400 | 30 (height 1.875) | — | white 70%、項目間 9px |
| コメントラベル | 16 | w600 | 22 | — | 「コメント」 |
| コメント件数 | 16 | w400 | 24 | — | 「1,234」white 75% |

### 各ブロックの仕様
- **バッジ**: `padding: 2px 8px`、`borderRadius: 24`、背景 white15%。横並び、`gap 4`、`Wrap` で折り返し。
- **本文段落**: 段落ごとに下マージン 24px（最後の段落は 0）。
- **ハイライト**: 本文インラインの背景マーカー。Flutter では `RichText`/`Text.rich` の `WidgetSpan`（角丸背景）または `TextSpan` + `background: Paint()` で表現。`padding: 1px 5px`、`borderRadius: 3`。
- **画像（メイン ④）**: `aspectRatio: 382/240 ≈ 1.592`、`borderRadius: 上14 / 下8`、`BoxFit.cover`。
- **箇条書きリスト**: 行頭に 5px の丸ドット（white35%）。テキストは左 indent 18px。
- **H2 下線**: 文字の下に 1px ライン（width 100%）。`Border(bottom: ...)` + 上下 padding 10px。

---

## 3. アニメーション仕様（この画面の肝）

起動から表示完了まで、**3 つ**のアニメーションが連動します。

### A. 起動ローディング（オーバーレイ）
- 画面起動と同時に、全面オーバーレイ（背景 `#101010`）を最前面に表示。
- 中央に同梱の **`LoadingIcon(size: 100, backgroundColor: Colors.transparent)`** を回す。
- **1000ms** 経過したらオーバーレイを **0.3s でフェードアウト**。
- フェードアウト後に **B（ドミノ・リビール）** を開始する。

タイムライン:
```
t=0      ローディングアイコン表示開始
t=1000   オーバーレイ フェードアウト開始(300ms)
t=1300   B 開始（記事のドミノ・リビール）
```

### B. ドミノ・ブラーリビール（記事本体の出現）
記事内の各ブロック（①〜⑰ = 全 17 要素）を、上から順に「ブラー → くっきり」で**ずらしながら**出現させます。

各要素の 1 つあたりのアニメーション:
- duration: **500ms**
- curve: **`Cubic(0.25, 0.46, 0.45, 0.94)`**
- 値の変化:
  - blur: `12px → 0px`
  - opacity: `0 → 1`
  - translateY: `8px → 0`
- **stagger（ずらし）**: i 番目の要素は `i × 80ms` 遅れて開始（i = 0,1,2,…,16）。

Flutter 実装方針:
- 各ブロックを `RevealItem`（下のサンプル）でラップし、`delay: Duration(milliseconds: index * 80)` を渡す。
- ブラーは `ImageFiltered(imageFilter: ImageFilter.blur(sigmaX: s, sigmaY: s))`、
  `Opacity`、`Transform.translate` を 1 つの `AnimationController` で駆動。
- `sigma` は `blurPx` をそのまま使って問題なし（12 → 0）。

```dart
class RevealItem extends StatefulWidget {
  final Widget child;
  final Duration delay;
  const RevealItem({super.key, required this.child, required this.delay});

  @override
  State<RevealItem> createState() => _RevealItemState();
}

class _RevealItemState extends State<RevealItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
  late final Animation<double> _t =
      CurvedAnimation(parent: _c, curve: const Cubic(0.25, 0.46, 0.45, 0.94));

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () { if (mounted) _c.forward(); });
  }

  @override
  void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      builder: (context, child) {
        final v = _t.value;            // 0→1
        final blur = (1 - v) * 12.0;   // 12→0
        final dy = (1 - v) * 8.0;      // 8→0
        return Opacity(
          opacity: v,
          child: Transform.translate(
            offset: Offset(0, dy),
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
              child: child,
            ),
          ),
        );
      },
      child: widget.child,
    );
  }
}
```

> 起動時に全 `RevealItem` をマウントし、A のフェードアウト後（t=1300）に一斉に `forward()` を始めるのが基本。
> 各 `RevealItem` は内部で `delay` を持つので、`index * 80ms` のずらしは自動で効きます。

### C. インライン画像の遅延スケルトン → リビール（⑨ / ⑬）
本文中の 2 枚のインライン画像（⑨ / ⑬）は、**B とは独立に**スケルトン表示します。

挙動:
1. 最初はシマー（skeleton）+ 中央にグレーのロゴ透かし（`assets/befirst-logo.svg` を 50% opacity / グレースケール、幅 90px）を表示。
2. その画像ブロックが**スクロールでビューポートに 20% 入った瞬間**を起点に、
3. **1000ms** 待ってから、スケルトンを 0.35s でフェードアウトしつつ、実画像を **B と同じ blurReveal（500ms）** で出現。

実装方針:
- 「ビューポートに入ったら」は [`visibility_detector`](https://pub.dev/packages/visibility_detector)（`onVisibilityChanged` で `visibleFraction >= 0.2`）が簡単。一度発火したら以降は無視（フラグ管理）。
- スケルトンのシマーは、`LinearGradient`（white 6%→12%→6%）を `-200% → 200%` で 1.5s ループ移動させた `AnimatedBuilder`、または `shimmer` パッケージ。
- 発火後は内部状態を `revealed = true` にし、実画像を `RevealItem` 相当（blur 12→0 / opacity 0→1 / translateY 8→0、500ms）で表示。スケルトンは `AnimatedOpacity(0.35s)` で消す。

```dart
// 擬似コード
VisibilityDetector(
  key: const Key('inline-img-1'),
  onVisibilityChanged: (info) {
    if (!_triggered && info.visibleFraction >= 0.2) {
      _triggered = true;
      Future.delayed(const Duration(milliseconds: 1000), () {
        if (mounted) setState(() => _revealed = true); // skeleton→画像
      });
    }
  },
  child: Stack(children: [
    AnimatedOpacity(opacity: _revealed ? 0 : 1, duration: 350.ms, child: Shimmer(...)),
    if (_revealed) RevealImage(...),   // blurReveal で出現
  ]),
)
```

### スケルトン（シマー）の色
```
LinearGradient(
  colors: [white6%, white12%, white6%],  // 0x0FFFFFFF, 0x1FFFFFFF, 0x0FFFFFFF
  stops:  [0.25, 0.5, 0.75],
)
// 1.5s で background-position 相当を -200%→200% にループ
```

---

## 4. FAB（ハート / ブックマーク）
右下に固定。同梱の **`LikeButton`** を使ってください（`lottie/like_button.dart`、`README.md` 参照）。

- 配置: 画面右下、`bottom: 92`、`right: 16`、2 つ横並び `gap 8`。
- ボタン枠: `48×48` の円、背景 black65%、ボーダー white15%（`LikeButton` の `size: 48` 相当に調整）。
- ハート ON 枠線色 `Color(0x99FF3E3E)` / ブックマーク ON 枠線色 `Color(0x99FFD133)`。

## 5. コメントバー
下部固定のバー。

- サイズ: 幅いっぱい（デザイン上 390）、高さ 80、上だけ角丸 R20。
- 背景 black65%、上ボーダー white15%。
- 中身: 上に細いハンドル（57×4、white50%、角丸）、その下に行（吹き出しアイコン + 「コメント」(16/w600) + 件数「1,234」(16/w400, white75%, 左 margin 8)）。

---

## 6. 依存パッケージまとめ
```yaml
dependencies:
  lottie: ^3.1.2                 # ハート/ブックマーク
  visibility_detector: ^0.4.0    # インライン画像の遅延表示（任意）
  # シマーは自前実装 or shimmer: ^3.0.0
```

`LoadingIcon`（ローディングアイコン）は依存なしの Dart 1 枚です。

---

## 参照
- 元実装: `article.html`（同リポジトリ）
- 素材と組み込み手順: 本パッケージの `README.md`
