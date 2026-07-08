import 'package:flutter/material.dart';

import 'splash_background.dart';
import 'splash_logo.dart';

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
