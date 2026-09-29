import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

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
    return Lottie.asset(
      'assets/lottie/bwu_splash.json',
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
