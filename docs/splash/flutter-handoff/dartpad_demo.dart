// BWU スプラッシュ モーション検証デモ（DartPad 用・単一ファイル版）
// https://dartpad.dev に全文貼り付けて Run すると、インストールなしで
// 背景モーションカラー + ロゴ書き順アニメ（Lottie）を確認できます。
// 内容は flutter-handoff/lib/*.dart と同一（Lottie のみネットワーク読込に変更）。

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:lottie/lottie.dart';


/// BWU スプラッシュ モーション検証デモ。
///
/// HTML プロトタイプ（ui_prototype/splash/index.html）のうち、
/// Flutter 移植で差分が出うる 2 要素を検証する:
///   1. 背景モーションカラーレイヤー（SMIL → CustomPainter 移植）
///   2. ロゴ書き順アニメーション（Lottie そのまま再生）
///
/// 検証方法:
///   - 通常起動: スプラッシュのタイムライン（0.2s ロゴ → 1.0s〜ドミノ出現）が再生される
///   - URL に ?t=6.0 を付ける（Web）: その時刻で静止描画。
///     HTML 版を同時刻で止めたスクリーンショットと直接比較できる
void main() => runApp(const BwuSplashDemo());

class BwuSplashDemo extends StatelessWidget {
  const BwuSplashDemo({super.key});

  @override
  Widget build(BuildContext context) {
    // Web 検証用の静止時刻（?t=秒）。ネイティブでは常に null → 通常再生
    final fixedT = double.tryParse(Uri.base.queryParameters['t'] ?? '');

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            Positioned.fill(child: SplashBackground(fixedTime: fixedT)),
            Center(child: SplashLogo(fixedTime: fixedT)),
          ],
        ),
      ),
    );
  }
}

/// スプラッシュ背景のモーションカラーレイヤー。
/// HTML プロトタイプ (index.html) の SVG + SMIL アニメーションを
/// CustomPainter に 1:1 移植したもの。数値・イージングはすべて
/// index.html 冒頭の仕様コメントと対応している。
///
/// 座標系: SVG の viewBox 0 0 100 100 と同じ「100×100 の論理空間」で計算し、
/// preserveAspectRatio="xMidYMid slice" 相当（cover）でウィジェットに貼る。

/// 往復 (x/y/fx) とフェード共通のイージング（cubic-bezier(0.4, 0, 0.2, 1)）
const _easeStd = Cubic(0.4, 0, 0.2, 1);

/// 回転 前半60%（平均 約1/3倍速）のセグメント用スプライン
const _easeRotSlow = Cubic(0.2, 0.4, 0.8, 0.6);

/// 回転 後半40%（平均 約2倍速）のセグメント用スプライン
/// 境界の角速度はどちらも 240°/周期 に揃えてあり、C1 連続（回転が止まらない）
const _easeRotFast = Cubic(0.3, 0.1, 0.7, 0.9);

class _BlobLayer {
  const _BlobLayer({
    required this.color,
    required this.xFrom,
    required this.xTo,
    required this.xDur,
    required this.yFrom,
    required this.yTo,
    required this.yDur,
    required this.rotStart,
    required this.rotDir,
    required this.rotDur,
    required this.fxDur,
  });

  /// レイヤー色（アルファ込み。強弱は radius ではなくアルファで付ける）
  final Color color;

  /// rect の x/y オフセット往復（viewBox 単位 = %）と周期(秒)
  final double xFrom, xTo, xDur;
  final double yFrom, yTo, yDur;

  /// 回転: rotStart から rotDir 方向に 72°(前半60%) + 288°(後半40%) = 360°/周期
  /// 初期位相オフセットで出現時のコア位置を四隅に分散している
  final double rotStart;
  final double rotDir; // +1 = 時計回り, -1 = 反時計回り
  final double rotDur;

  /// focal point (fx) の 1%→5%→1% 往復の周期(秒)
  final double fxDur;
}

/// 描画順（下 → 上）。メインの緑・青が前面、暖色は差し色として下層。
/// ドミノ出現もこの順（1.0s から 0.3s 間隔）。
const _layers = <_BlobLayer>[
  // オレンジ #EC5E16（差し色・暖色）— 出現時は左上 (45°)
  _BlobLayer(
    color: Color.fromRGBO(236, 94, 22, 0.5),
    xFrom: -10, xTo: 0, xDur: 9,
    yFrom: 10, yTo: 30, yDur: 10,
    rotStart: 45, rotDir: 1, rotDur: 6,
    fxDur: 8,
  ),
  // マゼンタ #F53358（差し色・暖色）— 右上 (135°)
  _BlobLayer(
    color: Color.fromRGBO(245, 51, 88, 0.55),
    xFrom: 10, xTo: 0, xDur: 8,
    yFrom: 5, yTo: 15, yDur: 9,
    rotStart: 135, rotDir: 1, rotDur: 4,
    fxDur: 10,
  ),
  // グリーン #1FD738（メイン）— 左下 (315°)・逆回転
  _BlobLayer(
    color: Color.fromRGBO(31, 215, 56, 0.95),
    xFrom: 5, xTo: 15, xDur: 10,
    yFrom: 5, yTo: 15, yDur: 7,
    rotStart: 675, rotDir: -1, rotDur: 5,
    fxDur: 7,
  ),
  // ブルー #1F32D9（メイン・最前面）— 右下 (225°)・逆回転
  _BlobLayer(
    color: Color.fromRGBO(31, 50, 217, 1.0),
    xFrom: 0, xTo: 10, xDur: 7,
    yFrom: -5, yTo: 5, yDur: 8,
    rotStart: 585, rotDir: -1, rotDur: 6.5,
    fxDur: 9,
  ),
];

/// 往復値: 前半 2/3 の時間で from→to、後半 1/3 で to→from（速度比 1:2）
double _osc(double t, double dur, double from, double to) {
  final p = (t % dur) / dur;
  if (p < 2 / 3) {
    return from + (to - from) * _easeStd.transform(p / (2 / 3));
  }
  return to + (from - to) * _easeStd.transform((p - 2 / 3) / (1 / 3));
}

/// 回転角(度): 前半60%で72°、後半40%で288°。ループ境界も角速度連続
double _rot(double t, _BlobLayer l) {
  final p = (t % l.rotDur) / l.rotDur;
  if (p < 0.6) {
    return l.rotStart + l.rotDir * 72 * _easeRotSlow.transform(p / 0.6);
  }
  return l.rotStart +
      l.rotDir * (72 + 288 * _easeRotFast.transform((p - 0.6) / 0.4));
}

/// ドミノ出現: レイヤー index は 1.0s + 0.3s×index から 0.6s かけてフェードイン
double _domino(double t, int index) {
  final p = ((t - (1.0 + 0.3 * index)) / 0.6).clamp(0.0, 1.0);
  return _easeStd.transform(p);
}

class SplashBackground extends StatefulWidget {
  const SplashBackground({super.key, this.fixedTime});

  /// 指定するとその時刻(秒)で静止描画する。
  /// HTML 版と同時刻のスクリーンショットを見比べる検証用。
  final double? fixedTime;

  @override
  State<SplashBackground> createState() => _SplashBackgroundState();
}

class _SplashBackgroundState extends State<SplashBackground>
    with SingleTickerProviderStateMixin {
  final _time = ValueNotifier<double>(0);
  Ticker? _ticker;

  @override
  void initState() {
    super.initState();
    if (widget.fixedTime != null) {
      _time.value = widget.fixedTime!;
    } else {
      _ticker = createTicker(
        (elapsed) => _time.value = elapsed.inMicroseconds / 1e6,
      )..start();
    }
  }

  @override
  void dispose() {
    _ticker?.dispose();
    _time.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: CustomPaint(painter: _BlobPainter(_time), size: Size.infinite),
    );
  }
}

class _BlobPainter extends CustomPainter {
  _BlobPainter(this.time) : super(repaint: time);

  final ValueNotifier<double> time;

  @override
  void paint(Canvas canvas, Size size) {
    final t = time.value;

    // preserveAspectRatio="xMidYMid slice"（cover）相当のスケーリング
    final s = math.max(size.width, size.height) / 100;
    canvas.translate(
      (size.width - 100 * s) / 2,
      (size.height - 100 * s) / 2,
    );
    canvas.scale(s);

    for (var i = 0; i < _layers.length; i++) {
      final l = _layers[i];
      final appear = _domino(t, i);
      if (appear <= 0) continue;

      final x = _osc(t, l.xDur, l.xFrom, l.xTo);
      final y = _osc(t, l.yDur, l.yFrom, l.yTo);
      final fx = _osc(t, l.fxDur, 1, 5); // focal は rect 左端から 1〜5% の位置

      canvas.save();
      // 回転中心は rect 中心ではなく viewBox の (50,50) 固定（重要）
      canvas.translate(50, 50);
      canvas.rotate(_rot(t, l) * math.pi / 180);
      canvas.translate(-50, -50);

      final base = l.color.withOpacity(l.color.opacity * appear);
      final paint = Paint()
        ..shader = ui.Gradient.radial(
          Offset(x + 50, y + 50), // 中心 = rect の中心
          50, //                     半径 = rect の 50%（r=0.5 固定）
          [base, base.withOpacity(0)],
          const [0, 1],
          TileMode.clamp,
          null,
          Offset(x + fx, y + 50), // focal point
          0,
        );
      canvas.drawRect(Rect.fromLTWH(x, y, 100, 100), paint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_BlobPainter oldDelegate) => false; // repaint は Listenable 経由
}


/// BWU ロゴの書き順アニメーション（Lottie）。
/// HTML プロトタイプと同じ JSON（bwu-splash-custom@2x.json）をそのまま再生する。
///
/// - コンポジション: 960×400・60fps・約1.63s（B フェード → W 筆書き → U）
/// - コンポ幅 960px のうちロゴ実体は 678px（中央配置）
///   → 表示ロゴ幅を 164px にするにはウィジェット幅を 164 / (678/960) ≒ 232 にする
/// - 再生タイミング: 画面表示から 0.2s 遅延で 1 回再生し、最終フレームで静止
class SplashLogo extends StatefulWidget {
  const SplashLogo({super.key, this.fixedTime, this.width = 232});

  /// 指定するとその時刻(秒)のフレームで静止（HTML 版との比較検証用）。
  /// 時刻は「画面表示からの経過秒」。再生開始遅延 0.2s を差し引いて換算する。
  final double? fixedTime;

  /// ウィジェット幅（= コンポ幅）。232 で表示ロゴ幅 164px 相当
  final double width;

  @override
  State<SplashLogo> createState() => _SplashLogoState();
}

class _SplashLogoState extends State<SplashLogo>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Lottie.network(
      'https://ryoheiarita.github.io/claude/splash/logo-anim/bwu-splash-custom@2x.json',
      controller: _controller,
      width: widget.width,
      fit: BoxFit.contain,
      onLoaded: (composition) {
        _controller.duration = composition.duration;
        final fixed = widget.fixedTime;
        if (fixed != null) {
          final total = composition.duration.inMicroseconds / 1e6;
          _controller.value = ((fixed - 0.2) / total).clamp(0.0, 1.0);
        } else {
          Future.delayed(const Duration(milliseconds: 200), () {
            if (mounted) _controller.forward();
          });
        }
      },
    );
  }
}
