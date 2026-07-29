# BWU アプリアイコン一式

Figma `Renewal_UI_Design` の 256×256 アイコンデザインから生成。
全ファイルは Figma のベクターを 4x (1024px) で書き出したマスターから縮小しているため、拡大補間は一切入っていません。

## ロゴ倍率の方針

**全プラットフォームで見た目のロゴサイズを統一しています。**

基準は最も制約の厳しい Android アダプティブアイコンのセーフ円 **Ø66dp / 108dp（= 0.611）**。
コンテンツのバウンディングボックス対角がこの円に内接する倍率を算出し、iOS・Android・favicon・Web ホームアイコンすべてに同じ倍率を適用しています。背景は各アイコンとも全面のままで、中央のロゴのみ拡縮しています。

| デザイン | 倍率 | ロゴ幅（キャンバス比） |
|---|---|---|
| user-app | ×0.8737 | 0.670 → **0.585** |
| web-home-icon | ×0.8737 | 0.670 → **0.585** |
| manager-cms | ×0.8024 | 0.670 → **0.538** |

manager-cms のみ倍率が小さいのは、コンテンツに「Manager」の文字が加わり縦に高い＝対角が長いためです（BWU ロゴ単体ではなくブロック全体をセーフ円に収めています）。

実測値：Android 前景レイヤーのコンテンツ最遠画素は user-app 131.9px / manager-cms 128.6px（セーフ円半径 132px、432px キャンバス）。Web マスカブルは 155.7px（セーフ円半径 204.8px、512px キャンバス）で十分な余裕があります。

| 用途 | Figma ノード | 出力先 |
|---|---|---|
| ユーザーアプリ（黒グラデ） | [11792-54804](https://www.figma.com/design/RBcywS6kYjz8ZCFfZ1Z4MP/Renewal_UI_Design?node-id=11792-54804) | `user-app/` … iOS / Android / favicon |
| Web ホームアイコン（#545454） | [11912-35397](https://www.figma.com/design/RBcywS6kYjz8ZCFfZ1Z4MP/Renewal_UI_Design?node-id=11912-35397) | `web-home-icon/` |
| Manager (CMS)（白地） | [11559-31142](https://www.figma.com/design/RBcywS6kYjz8ZCFfZ1Z4MP/Renewal_UI_Design?node-id=11559-31142) | `manager-cms/` … iOS / Android |

`preview.html` をブラウザで開くと全アイコンの確認ができます（iOS 角丸・Android マスクのシミュレーション付き）。

---

## user-app / manager-cms

### iOS — `ios/`

```
ios/AppIcon.appiconset/     ← Xcode の Assets.xcassets にそのままドラッグ
ios/icon-1024.png           ← Flutter (flutter_launcher_icons) / RN / Capacitor 用のソース画像
```

- `AppIcon.appiconset` は iPhone / iPad / App Store の全サイズ（18 エントリ）入り。Xcode 14 以降の単一 1024 方式でも旧方式でもそのまま通ります。
- **すべてアルファチャンネル無しの RGB PNG**（App Store Connect はアルファ付きを弾くため）。
- 角丸は焼き込んでいません（iOS 側でマスクされる正しい形）。

Flutter の場合:

```yaml
flutter_launcher_icons:
  image_path_ios: "app-icons/user-app/ios/icon-1024.png"
  remove_alpha_ios: true
```

### Android — `android/`

```
android/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/
  ic_launcher.png             48dp  レガシー（API 25 以下）
  ic_launcher_round.png       48dp  円形レガシー
  ic_launcher_background.png 108dp  アダプティブ背景レイヤー
  ic_launcher_foreground.png 108dp  アダプティブ前景レイヤー（透過）
  ic_launcher_monochrome.png 108dp  Android 13+ テーマアイコン用シルエット
android/mipmap-anydpi-v26/ic_launcher.xml / ic_launcher_round.xml
android/playstore/ic_launcher-playstore.png   512×512（Play Console 用）
```

`android/` の中身を `app/src/main/res/` にそのままコピーしてください。

前景レイヤーのロゴは **66dp のセーフ円の内側に収まる最大サイズ**。どのランチャーのマスク形状（円・角丸四角・スクワークル）でも欠けません。

背景がグラデーション／白ベタのため、`values/ic_launcher_background.xml`（単色）ではなくビットマップの背景レイヤーを使っています。

### favicon — `user-app/favicon/`（ユーザーアプリのみ）

```
favicon.ico            16 / 32 / 48 マルチサイズ
favicon.svg            ベクター（グラデーション + ロゴパス、倍率も統一値を適用済み）
favicon-16x16.png … favicon-512x512.png
_optional_zoomed/      ロゴ幅をキャンバスの 90% まで拡大した任意版（下記参照）
```

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
```

> **`_optional_zoomed/` について**
> 統一倍率だとロゴ幅がキャンバスの 58.5%・高さが 18% となり、16px / 32px のタブアイコンではロゴが 3px 前後に潰れて判読できません。
> 統一倍率版（`favicon/` 直下）が正で、小サイズの視認性を優先する場合の代替として `_optional_zoomed/`（ロゴ幅 90%）を同梱しています。どちらを採用するかはご判断ください。

---

## web-home-icon（Web ホームアイコン専用）

```
apple-touch-icon.png          180×180（iOS ホーム画面追加）
apple-touch-icon-{120,152,167,180}.png
web-app-icon-192.png / -512.png
web-app-icon-maskable-512.png Android Chrome マスカブル
site.webmanifest
```

```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#545454">
```

マスカブル版はロゴがセーフ円（中央 80%）の内側に収まっているため、原寸のまま出力しています。

---

## 再生成

```bash
python3 _src/build_icons.py
```

`_src/` に Figma から書き出したマスター PNG（1024px）と生成スクリプトが入っています。デザイン更新時はマスターを差し替えて再実行してください。
