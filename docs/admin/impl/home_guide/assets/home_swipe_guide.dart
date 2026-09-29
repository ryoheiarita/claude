// BwU 初回ホーム スワイプガイド オーバーレイ
// Figma: Renewal_UI_Design 6226:26122「iPhone 13 & 14 - 133」
//
// 使い方:
//   Stack(children: [ HomeScreen(), if (showGuide) HomeSwipeGuide(onDismiss: ...) ])
//
// pubspec:
//   flutter_svg: ^2.0.0
//   assets: guide_arrow_up.svg / guide_arrow_down.svg / guide_hand.svg
//
// 数値はすべてプロトタイプ (docs/home_guide/) の CSS keyframes と一致。

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

enum SwipeGuideDirection { up, down }

/// ホーム最前面に重ねる全画面オーバーレイ。
/// 背景(実際のホーム画面)はこのウィジェットの後ろにそのまま置く。
class HomeSwipeGuide extends StatefulWidget {
  const HomeSwipeGuide({super.key, this.onDismiss});

  /// 画面タップ時(ガイドを閉じる)。初回のみ表示の管理は呼び出し側で行う。
  final VoidCallback? onDismiss;

  @override
  State<HomeSwipeGuide> createState() => _HomeSwipeGuideState();
}

class _HomeSwipeGuideState extends State<HomeSwipeGuide>
    with SingleTickerProviderStateMixin {
  // 出現: 500ms フェードイン (CSS: opacity transition .5s ease)
  late final AnimationController _fade = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 500),
  )..forward();

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: CurvedAnimation(parent: _fade, curve: Curves.easeOut),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onDismiss,
        child: Stack(
          children: [
            // ── 上スクリム: 黒 → 透明 (デザイン h339 / 844)
            const Positioned(
              top: 0, left: 0, right: 0, height: 339,
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black, Colors.transparent],
                    ),
                  ),
                ),
              ),
            ),
            // ── 下スクリム: 透明 → 黒 (デザイン top505 h339 = 画面下端まで)
            const Positioned(
              bottom: 0, left: 0, right: 0, height: 339,
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Colors.black],
                    ),
                  ),
                ),
              ),
            ),
            // ── 下スワイプ → ファンクラブ一覧 (デザイン: 上端から 42)
            const Positioned(
              top: 42, left: 0, right: 0,
              child: _GuideColumn(
                pillText: '下スワイプ',
                labelText: 'ファンクラブ一覧',
                direction: SwipeGuideDirection.down,
              ),
            ),
            // ── 上スワイプ → 最新コンテンツ (デザイン: 下端から 31 = 844-684-129)
            const Positioned(
              bottom: 31, left: 0, right: 0,
              child: _GuideColumn(
                pillText: '上スワイプ',
                labelText: '最新コンテンツ',
                direction: SwipeGuideDirection.up,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// ピル + アニメーションアイコン + ラベル の縦積み (gap 8)
class _GuideColumn extends StatelessWidget {
  const _GuideColumn({
    required this.pillText,
    required this.labelText,
    required this.direction,
  });

  final String pillText;
  final String labelText;
  final SwipeGuideDirection direction;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 白ピル: radius30 / padding 16x6 / Figtree SemiBold 14 (lh20) #101010
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
          ),
          child: Text(
            pillText,
            style: const TextStyle(
              fontFamily: 'Figtree',
              fontFamilyFallback: ['Hiragino Sans', 'Noto Sans JP'],
              fontSize: 14,
              height: 20 / 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF101010),
            ),
          ),
        ),
        const SizedBox(height: 8),
        _SwipeIcon(direction: direction),
        const SizedBox(height: 8),
        // ラベル: Figtree SemiBold 16 (lh22) 白
        Text(
          labelText,
          style: const TextStyle(
            fontFamily: 'Figtree',
            fontFamilyFallback: ['Hiragino Sans', 'Noto Sans JP'],
            fontSize: 16,
            height: 22 / 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}

/// 矢印(描画リビール) + 手(スワイプ移動) の 2.4s 無限ループ。
/// キーフレーム (t = 0..1):
///   手   :  0%→12% フェードイン / 12%→52% 移動 (down: -10→+8, up: +10→-8)
///   矢印 : 14%→50% スワイプ方向へ描画 (clip reveal)
///   両方 : 74%→88% フェードアウト、100% でループ
class _SwipeIcon extends StatefulWidget {
  const _SwipeIcon({required this.direction});

  final SwipeGuideDirection direction;

  @override
  State<_SwipeIcon> createState() => _SwipeIconState();
}

class _SwipeIconState extends State<_SwipeIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat();

  // CSS: cubic-bezier(.3,.7,.2,1) — 手のスワイプ
  static const Curve _swipeCurve = Cubic(0.3, 0.7, 0.2, 1);
  // CSS: cubic-bezier(.4,0,.2,1) — 矢印の描画
  static const Curve _drawCurve = Cubic(0.4, 0, 0.2, 1);

  static const Curve _handMove =
      Interval(0.12, 0.52, curve: _swipeCurve);
  static const Curve _arrowDraw =
      Interval(0.14, 0.50, curve: _drawCurve);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool down = widget.direction == SwipeGuideDirection.down;
    return SizedBox(
      width: 76,
      height: 59,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final double t = _c.value;
          // 74%→88% で全体フェードアウト
          final double fadeOut =
              t <= 0.74 ? 1 : (t >= 0.88 ? 0 : 1 - (t - 0.74) / 0.14);
          // 手: 0%→12% フェードイン
          final double handIn = (t / 0.12).clamp(0.0, 1.0);
          final double move = _handMove.transform(t);
          final double handDy =
              down ? (-10 + 18 * move) : (10 - 18 * move);
          final double draw = _arrowDraw.transform(t);

          return Stack(
            clipBehavior: Clip.none,
            children: [
              // 矢印 (左端 30x59)。down は上から、up は下から描画される
              Positioned(
                left: 0,
                top: down ? 0 : null,
                bottom: down ? null : 0,
                child: Opacity(
                  opacity: fadeOut,
                  child: ClipRect(
                    child: Align(
                      alignment: down
                          ? Alignment.topCenter
                          : Alignment.bottomCenter,
                      heightFactor: draw.clamp(0.0, 1.0),
                      child: SvgPicture.asset(
                        down
                            ? 'assets/guide/guide_arrow_down.svg'
                            : 'assets/guide/guide_arrow_up.svg',
                        width: 30,
                        height: 59,
                      ),
                    ),
                  ),
                ),
              ),
              // 手 (76x59 キャンバス全体、右側に描かれている)
              Positioned(
                left: 0,
                top: 0,
                child: Opacity(
                  opacity: handIn < fadeOut ? handIn : fadeOut,
                  child: Transform.translate(
                    offset: Offset(0, handDy),
                    child: SvgPicture.asset(
                      'assets/guide/guide_hand.svg',
                      width: 76,
                      height: 59,
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
