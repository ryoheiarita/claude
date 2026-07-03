# Vimeo カスタムプレイヤー — Flutter 実装ガイド

`VIMEO_PLAYER_SPEC.md` の挙動を Flutter で実現するための実装ガイド。
HTMLプロトタイプ（`vimeo-test.html`）と **1:1 対応** する構成。

---

## 方式の結論

**WebView に `controls=0` の Vimeo iframe を埋め込み → Flutter の `Stack` で自前UIを重ね →
Vimeo Player SDK(postMessage) で再生制御。**

- アカウント種別を問わず動作（無料/Basicでも可）。HTML版ロジックをそのまま移植できる。
- 完全ネイティブ描画やオフライン・リスト内多数表示が必要なら、Vimeo Pro以上＋mp4直リンク＋`video_player` を検討（末尾「代替案B」）。

### HTML ⇄ Flutter 対応表
| HTML版 | Flutter版 |
|---|---|
| `<iframe controls=0 … pointer-events:none>` | `WebViewWidget`（中のHTMLで `pointer-events:none`） |
| 透過タップ層 `.tap-layer` | `GestureDetector`（UIトグル） |
| 中央 `.play-btn`（▶/⏸） | `IconButton` ＋ `AnimatedOpacity` |
| 左上 `.back-btn` → `history.back()` | `IconButton` → `Navigator.pop()` |
| `.seek-bar`（タップ/ドラッグ） | `GestureDetector` ＋ `CustomPaint`（or `Slider`） |
| `.seek-scrim`（黒グラデ） | `IgnorePointer` + `DecoratedBox(LinearGradient)` |
| 時間ラベル（Figtree） | `Text(style: TextStyle(fontFamily:'Figtree', fontFeatures:[tnum]))` |
| `setTimeout(hideUI, 2500)` | `Timer(Duration(milliseconds:2500), …)` |
| `player.on('timeupdate')` | JSチャネル `Flutter.postMessage` → `setState` |
| `player.play/pause/setCurrentTime` | `controller.runJavaScript('player.…')` |

---

## 依存パッケージ

```yaml
# pubspec.yaml
dependencies:
  webview_flutter: ^4.7.0
```

Figtree フォントを同梱:
```yaml
flutter:
  fonts:
    - family: Figtree
      fonts:
        - asset: assets/fonts/Figtree-Regular.ttf
        - asset: assets/fonts/Figtree-Medium.ttf
          weight: 500
```

---

## 1. WebViewに読ませるHTML（SDK制御＋状態送信）

`{ID}` を動画IDに差し替え。再生状態・尺・進捗を `Flutter.postMessage` で返す。

```dart
String playerHtml(String videoId) => '''
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>html,body{margin:0;background:#000;height:100%;overflow:hidden}
#f{position:fixed;inset:0;width:100%;height:100%;border:0;pointer-events:none}</style>
</head><body>
<iframe id="f" allow="autoplay; fullscreen; picture-in-picture"
  src="https://player.vimeo.com/video/$videoId?controls=0&title=0&byline=0&portrait=0&dnt=1&playsinline=1"></iframe>
<script src="https://player.vimeo.com/api/player.js"></script>
<script>
  const player = new Vimeo.Player(document.getElementById('f'));
  const send = o => Flutter.postMessage(JSON.stringify(o));
  player.ready().then(()=>Promise.all([player.getDuration(), player.getVideoWidth(), player.getVideoHeight()]))
    .then(([d,w,h])=>send({e:'meta', duration:d, vw:w, vh:h}));   // 尺＋縦横判定用サイズ
  player.on('play',  ()=>send({e:'play'}));
  player.on('pause', ()=>send({e:'pause'}));
  player.on('ended', ()=>send({e:'ended'}));
  player.on('timeupdate', d=>send({e:'time', seconds:d.seconds, duration:d.duration}));
  // Flutterから呼ぶ操作
  window.vplay  = ()=>player.play();
  window.vpause = ()=>player.pause();
  window.vseek  = s=>player.setCurrentTime(s);
  window.vmuted = m=>player.setMuted(m);
  window.vfull  = ()=>player.requestFullscreen().catch(()=>{});  // 全画面（横動画用）
</script>
</body></html>
''';
```

---

## 2. Flutter ウィジェット（フルコード）

```dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class VimeoPlayerScreen extends StatefulWidget {
  final String videoId;
  const VimeoPlayerScreen({super.key, required this.videoId});
  @override
  State<VimeoPlayerScreen> createState() => _VimeoPlayerScreenState();
}

class _VimeoPlayerScreenState extends State<VimeoPlayerScreen> {
  late final WebViewController _web;
  bool _playing = false;
  bool _uiVisible = true;
  bool _scrubbing = false;
  double _position = 0;   // 秒
  double _duration = 0;   // 秒
  Timer? _hideTimer;

  static const _hideAfter = Duration(milliseconds: 2500);

  @override
  void initState() {
    super.initState();
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..addJavaScriptChannel('Flutter', onMessageReceived: _onMessage)
      ..loadHtmlString(playerHtml(widget.videoId));
    _armHideTimer();
  }

  @override
  void dispose() { _hideTimer?.cancel(); super.dispose(); }

  // ── WebView(SDK)からの通知 ──
  void _onMessage(JavaScriptMessage m) {
    final d = jsonDecode(m.message) as Map<String, dynamic>;
    switch (d['e']) {
      case 'duration': setState(() => _duration = (d['duration'] as num).toDouble()); break;
      case 'play':     setState(() => _playing = true); break;
      case 'pause':
      case 'ended':    setState(() => _playing = false); break;
      case 'time':
        if (!_scrubbing) {
          setState(() {
            _position = (d['seconds'] as num).toDouble();
            if (_duration == 0) _duration = (d['duration'] as num).toDouble();
          });
        }
        break;
    }
  }

  // ── UI表示/非表示（2.5秒で自動消滅） ──
  void _armHideTimer() {
    _hideTimer?.cancel();
    _hideTimer = Timer(_hideAfter, () => setState(() => _uiVisible = false));
  }
  void _showUI() { setState(() => _uiVisible = true); _armHideTimer(); }
  void _hideUI() { _hideTimer?.cancel(); setState(() => _uiVisible = false); }
  void _toggleUI() => _uiVisible ? _hideUI() : _showUI();   // 映像タップ

  // ── 再生/停止（UIは維持） ──
  void _togglePlay() {
    _web.runJavaScript(_playing ? 'window.vpause()' : 'window.vplay()');
    _showUI();
  }

  // ── シーク ──
  void _seekTo(double frac) {
    final sec = frac.clamp(0, 1) * _duration;
    _web.runJavaScript('window.vseek($sec)');
    setState(() => _position = sec);
  }

  String _fmt(double s) {
    final t = s.floor();
    return '${t ~/ 60}:${(t % 60).toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).padding;
    final frac = _duration == 0 ? 0.0 : (_position / _duration).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        // 動画（9:16 中央）。WebView内iframeは pointer-events:none
        Positioned.fill(child: WebViewWidget(controller: _web)),

        // 透過タップ層：映像タップでUIトグル（再生ボタン・バーは別途上に乗る）
        Positioned.fill(child: GestureDetector(
          behavior: HitTestBehavior.opaque, onTap: _toggleUI, child: const SizedBox.expand())),

        // 黒グラデーション（下→上：黒75%→透明）。タップは透過
        Positioned(left: 0, right: 0, bottom: 0, height: 160, child: IgnorePointer(
          child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(
            begin: Alignment.bottomCenter, end: Alignment.topCenter,
            colors: [Colors.black.withOpacity(.75), Colors.transparent]))))),

        // ── ここからUI（2.5秒で一括フェード） ──
        IgnorePointer(
          ignoring: !_uiVisible,
          child: AnimatedOpacity(
            opacity: _uiVisible ? 1 : 0,
            duration: const Duration(milliseconds: 250),
            child: Stack(children: [
              // 戻る（左上）
              Positioned(top: pad.top + 16, left: 16, child: _CircleButton(
                icon: Icons.arrow_back_ios_new, size: 22,
                onTap: () => Navigator.of(context).maybePop())),

              // 中央 再生/停止
              Center(child: _CircleButton(
                icon: _playing ? Icons.pause : Icons.play_arrow, size: 34, big: true,
                onTap: _togglePlay)),

              // シークバー（下端）
              Positioned(left: 16, right: 16, bottom: pad.bottom + 20, child: Row(children: [
                Text(_fmt(_position), style: _timeStyle),
                const SizedBox(width: 10),
                Expanded(child: _SeekBar(
                  fraction: frac,
                  onScrubStart: () { _scrubbing = true; _hideTimer?.cancel(); },
                  onScrubUpdate: (f) => setState(() => _position = f * _duration),
                  onScrubEnd: (f) { _scrubbing = false; _seekTo(f); _armHideTimer(); },
                )),
                const SizedBox(width: 10),
                Text(_fmt(_duration), style: _timeStyle),
              ])),
            ]),
          ),
        ),
      ]),
    );
  }

  static const _timeStyle = TextStyle(
    fontFamily: 'Figtree', fontWeight: FontWeight.w500, fontSize: 11,
    color: Colors.white, fontFeatures: [FontFeature.tabularFigures()]);
}

// 丸ボタン（ぼかし背景）
class _CircleButton extends StatelessWidget {
  final IconData icon; final double size; final bool big; final VoidCallback onTap;
  const _CircleButton({required this.icon, required this.size, this.big = false, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final d = big ? 72.0 : 40.0;
    return GestureDetector(onTap: onTap, child: Container(
      width: d, height: d,
      decoration: BoxDecoration(color: Colors.black.withOpacity(.45), shape: BoxShape.circle),
      child: Icon(icon, color: Colors.white, size: size)));
  }
}

// シークバー：タップ＆ドラッグでシーク。当たり判定は上下に拡張
class _SeekBar extends StatelessWidget {
  final double fraction;
  final VoidCallback onScrubStart;
  final ValueChanged<double> onScrubUpdate, onScrubEnd;
  const _SeekBar({required this.fraction, required this.onScrubStart,
    required this.onScrubUpdate, required this.onScrubEnd});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      double fracOf(double dx) => (dx / c.maxWidth).clamp(0.0, 1.0);
      return GestureDetector(
        behavior: HitTestBehavior.opaque,   // 透明部分でも掴める
        onTapDown:        (e) { onScrubStart(); onScrubEnd(fracOf(e.localPosition.dx)); },
        onHorizontalDragStart:  (e) => onScrubStart(),
        onHorizontalDragUpdate: (e) => onScrubUpdate(fracOf(e.localPosition.dx)),
        onHorizontalDragEnd:    (e) => onScrubEnd(fraction),
        child: SizedBox(height: 32, child: Center(   // 高さ32 = 当たり判定（線は3px）
          child: Stack(alignment: Alignment.centerLeft, children: [
            Container(height: 3, decoration: BoxDecoration(
              color: Colors.white24, borderRadius: BorderRadius.circular(2))),
            FractionallySizedBox(widthFactor: fraction, child: Container(height: 3,
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(2)))),
            Align(alignment: Alignment(fraction * 2 - 1, 0),   // つまみ
              child: Container(width: 12, height: 12, decoration: const BoxDecoration(
                color: Colors.white, shape: BoxShape.circle))),
          ]),
        )),
      );
    });
  }
}
```

> 上記は仕様を満たす最小実装。`fontFeatures` は `import 'dart:ui'` の `FontFeature` を使用。

---

## 3. 注意点（Flutter固有）

- **自動再生**: iOS/Androidとも音ありの自動再生は不可。初回は `window.vmuted(true)` 後に `window.vplay()`、またはユーザータップ起点にする（HTML版と同じ）。
- **タップ透過の徹底**: WebView内iframeを `pointer-events:none` にし、操作は必ずFlutter側 `Stack` で受ける。黒グラデや非表示中UIは `IgnorePointer` で透過させ、下の `GestureDetector` にタップを通す。
- **WebViewの上にWidgetが乗るか**: `webview_flutter` 4.x は Hybrid Composition で `Stack` 重ねが可能。問題が出る端末では `Platform Views` 設定を確認。
- **9:16レイアウト**: 画面より横長になる動画は左右に黒が出る。中央寄せ＋`min(画面高, 画面幅*16/9)` で算出（HTML版 `--vid-h` と同じ考え方）。
- **エンド画面**: 動画終端でVimeo共有オーバーレイが出る場合は、`ended` 受信時に `window.vseek(0)＋window.vpause()` で頭出しして回避。
- **一時停止中の自動消滅**: 現仕様は停止中も2.5秒で消す。停止中は出したままにするなら、`pause` 受信時に `_hideTimer?.cancel()` する分岐を足す。

---

## 4. 戻るボタン・全画面ボタン・縦横対応（追加仕様）

### 4.1 戻るボタン（Figma: Navigation Bar）
`VIMEO_PLAYER_SPEC.md §2.1` のデザイン。`backdrop-blur` は `BackdropFilter` で表現。

```dart
Widget backButton(BuildContext ctx, EdgeInsets pad) => Positioned(
  top: pad.top + 16, left: 12,                       // 左12px
  child: GestureDetector(
    onTap: () => Navigator.of(ctx).maybePop(),
    child: ClipRRect(
      borderRadius: BorderRadius.circular(42),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),   // dart:ui
        child: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(.30),
            borderRadius: BorderRadius.circular(42),
            border: Border.all(color: Colors.white.withOpacity(.08))),
          child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
        )))));
```

上端グラデーション（戻るボタンの視認性）も忘れず、UIグループに入れて一緒にフェードさせる:
```dart
Positioned(top: 0, left: 0, right: 0, height: 100 + pad.top, child: IgnorePointer(
  child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(
    begin: Alignment.topCenter, end: Alignment.bottomCenter,
    colors: [Colors.black.withOpacity(.58), Colors.transparent]))))),
```

### 4.2 全画面ボタン（横動画のみ）
- `meta` で受け取った `vw/vh` から **横動画判定** `isLandscape = vw >= vh`。
- 横のときだけシークバー右上に40pxボタンを置く。スタイルは戻るボタンと同じ。

```dart
// _onMessage の 'meta' で:
//   _duration = d['duration']; _isLandscape = (d['vw'] as num) >= (d['vh'] as num); setState(...)

if (_isLandscape)
  Positioned(
    right: 16, bottom: pad.bottom + 52,            // シークバーの右上
    child: GestureDetector(
      onTap: () { _web.runJavaScript('window.vfull()'); _showUI(); },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(42),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(width: 40, height: 40,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(.30),
              borderRadius: BorderRadius.circular(42),
              border: Border.all(color: Colors.white.withOpacity(.08))),
            child: const Icon(Icons.fullscreen, color: Colors.white, size: 24)))))),
```

> 全画面ボタンも §2 のUIグループ（`AnimatedOpacity` + `IgnorePointer(ignoring:!_uiVisible)`）の **内側** に置く。これで2.5秒自動消滅・タップトグルに自動追従する。

### 4.3 横動画レイアウト
横は上下中央レターボックス。`Center` ＋ `AspectRatio(16/9)` で配置（縦は画面フル）。
```dart
_isLandscape
  ? Center(child: AspectRatio(aspectRatio: 16/9, child: WebViewWidget(controller: _web)))
  : Positioned.fill(child: WebViewWidget(controller: _web))
```

### 4.4 【ルール】他画面の既存戻るボタンは削除する
他のVimeo画面には既に戻るボタンがある場合が多い。**このVimeoプレイヤーの戻るボタンを載せるときは、
画面側の既存戻るボタンを削除して1つに統一する**（重複防止）。
- 既存ボタンが持っていた遷移（`Navigator.pop` 等）を、Vimeo側戻るボタンの `onTap` に移す。
- 統一後、戻るボタンは動画UIと一緒に2.5秒で自動消滅する挙動になる（常時表示ではなくなる）。

---

## 代替案B：完全ネイティブ（`video_player`）

- **条件**: Vimeo **Pro以上** ＋ Vimeo API で progressive(mp4) 直リンクを取得できること。
- **構成**: `video_player` で `VideoPlayerController.networkUrl(mp4)` を再生し、UI（再生/戻る/シーク/グラデ）は本ドキュメントと同じ `Stack` を流用。WebViewが不要になりリスト内多数表示やオフラインに強い。
- **トレードオフ**: 無料/Basicでは直リンク不可のため使えない。まずは方式A（WebView）を基準にする。
