import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// ハート / ブックマークの「いいね」風トグルボタン。
///
/// heart-like.json / bookmark-like.json はどちらも同じフレーム構成です:
///   - 60fps / 全 181 フレーム
///   - フレーム  17〜90  : ON アニメーション（枠線 → 塗りつぶし + バースト）
///   - フレーム 105〜181 : OFF アニメーション（塗りつぶし → 枠線）
///   - フレーム   0       : 初期状態（枠線のみ）
///
/// 枠線の色は配布 JSON に「白」を焼き込み済みです。色を変えたい場合は
/// JSON 内の "heart" / "heart 3" レイヤーの塗り色を変更してください。
///
/// 使い方:
/// ```dart
/// LikeButton(
///   asset: 'assets/lottie/heart-like.json',
///   activeBorderColor: const Color(0x99FF3E3E), // rgba(255,62,62,0.6)
/// )
/// LikeButton(
///   asset: 'assets/lottie/bookmark-like.json',
///   activeBorderColor: const Color(0x99FFD133), // rgba(255,209,51,0.6)
/// )
/// ```
class LikeButton extends StatefulWidget {
  /// Lottie アセットのパス（pubspec.yaml の assets に登録すること）。
  final String asset;

  /// ON 状態のときの枠線色。
  final Color activeBorderColor;

  /// ボタンの直径(px)。
  final double size;

  /// 状態が変わったときに呼ばれる（true = ON / false = OFF）。
  final ValueChanged<bool>? onChanged;

  const LikeButton({
    super.key,
    required this.asset,
    required this.activeBorderColor,
    this.size = 56,
    this.onChanged,
  });

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  // JSON のフレーム定義（heart-like / bookmark-like 共通）。
  static const double _fps = 60;
  static const double _total = 181;
  static const double _likeStart = 17;
  static const double _likeEnd = 90;
  static const double _unlikeStart = 105;
  static const double _unlikeEnd = 181;

  bool _active = false;
  bool _animating = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // フレーム番号を AnimationController の 0.0〜1.0 の進捗に変換。
  double _progress(double frame) => frame / _total;

  Duration _spanMs(double from, double to) =>
      Duration(milliseconds: ((to - from) / _fps * 1000).round());

  Future<void> _toggle() async {
    if (_animating) return;
    _animating = true;

    if (!_active) {
      // OFF -> ON
      setState(() => _active = true);
      widget.onChanged?.call(true);
      _controller.value = _progress(_likeStart);
      await _controller.animateTo(
        _progress(_likeEnd),
        duration: _spanMs(_likeStart, _likeEnd),
        curve: Curves.linear,
      );
    } else {
      // ON -> OFF
      setState(() => _active = false);
      widget.onChanged?.call(false);
      _controller.value = _progress(_unlikeStart);
      await _controller.animateTo(
        _progress(_unlikeEnd),
        duration: _spanMs(_unlikeStart, _unlikeEnd),
        curve: Curves.linear,
      );
      _controller.value = 0; // 初期状態（枠線のみ）に戻す
    }

    _animating = false;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _toggle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.black.withValues(alpha: 0.3),
          border: Border.all(
            color: _active
                ? widget.activeBorderColor
                : Colors.white.withValues(alpha: 0.15),
          ),
        ),
        child: Center(
          child: Lottie.asset(
            widget.asset,
            controller: _controller,
            width: widget.size * 0.6,
            height: widget.size * 0.6,
            onLoaded: (composition) {
              // 全体の長さを composition から取得し、初期状態へ。
              _controller.duration = composition.duration;
              _controller.value = 0;
            },
          ),
        ),
      ),
    );
  }
}
