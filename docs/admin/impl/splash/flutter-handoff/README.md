# BWU スプラッシュ — Flutter モーション リファレンス実装

HTML プロトタイプ（`ui_prototype/splash/index.html`）のモーション2要素を
Flutter に移植した検証用コードです。

| 要素 | HTML 版 | Flutter 版 |
|------|---------|-----------|
| 背景モーションカラー | SVG + SMIL | `CustomPainter`（[lib/splash_background.dart](lib/splash_background.dart)） |
| ロゴ書き順アニメ | lottie-web | `lottie` パッケージで同じ JSON を再生（[lib/splash_logo.dart](lib/splash_logo.dart)） |

## 実行方法

```bash
# 任意の Flutter プロジェクトにコピーするか、この場でプロジェクト化する:
flutter create --platforms=ios,android,web --project-name bwu_splash .
flutter pub get
flutter run          # iOS / Android / Web どれでも可
```

## HTML 版との比較検証（差分チェック）

Web ビルドでは URL クエリ `?t=秒` でその時刻の静止フレームを描画します。

```bash
flutter run -d chrome
# ブラウザで http://localhost:xxxx/?t=6.0 などを開く
```

HTML 版（http://localhost:8765/）を DevTools で同時刻に止めたものと
並べて比較してください。HTML 側の静止方法:

```js
const svg = document.querySelector('#bg-wrap svg');
svg.pauseAnimations(); svg.setCurrentTime(6.0);
document.getAnimations().forEach(a => { a.currentTime = 6000; a.pause(); });
```

## 移植した仕様（index.html 冒頭コメントと 1:1 対応)

### 座標系
- SVG viewBox `0 0 100 100` と同じ 100×100 論理空間で計算
- `preserveAspectRatio="xMidYMid slice"` = cover スケーリング
  （`max(w,h)/100` 倍して中央配置、はみ出しはクリップ）

### レイヤー（描画順 下→上 / ドミノ出現順）
| # | 色 | alpha | x往復(dur) | y往復(dur) | 回転 start/dir(dur) | fx(dur) |
|---|-----|-------|-----------|-----------|--------------------|---------|
| 1 | オレンジ #EC5E16 | 0.5 | -10→0 (9s) | 10→30 (10s) | 45° +1 (6s) | 8s |
| 2 | マゼンタ #F53358 | 0.55 | 10→0 (8s) | 5→15 (9s) | 135° +1 (4s) | 10s |
| 3 | グリーン #1FD738 | 0.95 | 5→15 (10s) | 5→15 (7s) | 675° −1 (5s) | 7s |
| 4 | ブルー #1F32D9 | 1.0 | 0→10 (7s) | -5→5 (8s) | 585° −1 (6.5s) | 9s |

### グラデーション
- `ui.Gradient.radial` — 中心 = rect 中心、半径 = 50（rect の 0.5 固定）、
  focal = rect 左端から fx%（1〜5% を往復）、focalRadius = 0
- 色は `[color, color(alpha:0)]`、stops `[0, 1]`、TileMode.clamp
- **回転中心は rect 中心ではなく (50,50) 固定**（重要）

### イージング
- 往復 (x/y/fx): 前半 2/3 で行き・後半 1/3 で戻り（速度比 1:2）、
  各セグメント `Cubic(0.4, 0, 0.2, 1)`
- 回転: 前半 60% で 72°（`Cubic(0.2, 0.4, 0.8, 0.6)`）→
  後半 40% で 288°（`Cubic(0.3, 0.1, 0.7, 0.9)`）。
  セグメント境界・ループ境界の角速度は 240°/周期 で一致（C1 連続、止まらない）

### タイムライン
- 0.2s: ロゴ Lottie 再生開始（1回再生、最終フレームで静止）
- 1.0s / 1.3s / 1.6s / 1.9s: レイヤー1〜4 がドミノ出現（各 0.6s フェード、`Cubic(0.4,0,0.2,1)`）

### ロゴ（Lottie）
- `assets/lottie/bwu_splash.json`（= `bwu-splash-custom@2x.json`、960×400・60fps・約1.63s）
- ベクターのみ・キーフレーム焼き込み済み・エクスプレッションなし
- コンポ幅 960 のうちロゴ実体 678（中央）→ 表示ロゴ幅 164px にはウィジェット幅 232
- **要目視確認**: W の筆書き（トラックマット + butt cap ストローク）の
  インク先端の見え方。lottie-flutter のマット描画で 1〜2px の差が出る可能性あり

## DartPad で手軽に確認する場合

`dartpad_demo.dart` を https://dartpad.dev に貼り付けると、
インストールなしで背景モーション+ロゴ（ネットワーク経由の Lottie）を確認できます。
