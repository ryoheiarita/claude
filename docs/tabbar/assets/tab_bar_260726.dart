// ============================================================================
// tabbar 260726 — Flutter handoff
// 形 = checkin_motion のタブバーそのまま(5 tabs — Home / Poppin' / More / Shop /
// Mypage。h64 / item48 / icon24 / label11、中央75pxはみ出し。
// 中央は すりガラス丸 + HANAフラワーロゴ = 静的SVG)。
// バーの4アイコンは animated iconsax Lottie(白ストローク):
//   home-2 / messages-4(Poppin') / bag-2(Shop) / profile-circle(Mypage)
//   inactive = opacity 50%、タップでアクティブ化+1回再生。
// More menu = Design_System_V2 "Tabbar_set" node 322:1202 (variant Opened):
//   More タップ -> 丸が白反転(ロゴ黒)、バーの上に3つのサテライトが展開
//   Check In (location) / Gallery (gallery) / Calendar — こちらも Lottie。
//   実測: 丸56(アイコン24中央) / 列ピッチ80(間隔24) / サイド+32px下げ / バー上12px。
//
// Dependencies (pubspec.yaml):
//   lottie: ^3.1.0
//   flutter_svg: ^2.0.0   # center HANA logo
//
// Assets (pubspec.yaml) — copy from ../assets/:
//   flutter:
//     assets:
//       - assets/tabbar/home.json       # bar  > Home
//       - assets/tabbar/talk.json       # bar  > Poppin'
//       - assets/tabbar/shop.json       # bar  > Shop
//       - assets/tabbar/mypage.json     # bar  > Mypage
//       - assets/tabbar/checkin.json    # More > Check In
//       - assets/tabbar/gallery.json    # More > Gallery
//       - assets/tabbar/calendar.json   # More > Calendar
//       - assets/tabbar/ic_hana.svg     # 48x48 HANA flower (center More, ../assets/svg/)
//
// Fine-tune values: open ../index.html → 微調整 ON → adjust → 「Flutterコードをコピー」
// and replace kMoreSpec / kTabAdjust below with the copied block.
// ============================================================================

import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lottie/lottie.dart';

// ---- tuning (replace with the block copied from the HTML adjust tool) -------

class MoreSpec {
  const MoreSpec({
    required this.circle,
    required this.pitch,
    required this.sideDrop,
    required this.gapAboveBar,
  });
  final double circle; // satellite circle diameter
  final double pitch; // column pitch (circle + horizontal gap)
  final double sideDrop; // side columns sit this much lower than center
  final double gapAboveBar; // menu bottom -> bar top
}

class TabAdjust {
  const TabAdjust({this.dx = 0, this.dy = 0, this.scale = 1});
  final double dx;
  final double dy;
  final double scale;
}

const MoreSpec kMoreSpec = MoreSpec(
  circle: 56,
  pitch: 80,
  sideDrop: 32,
  gapAboveBar: 12,
);

const Map<String, TabAdjust> kTabAdjust = {
  'home': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'poppin': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'more': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'shop': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'mypage': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'checkin': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'gallery': TabAdjust(dx: 0, dy: 0, scale: 1.00),
  'calendar': TabAdjust(dx: 0, dy: 0, scale: 1.00),
};

/// iconsax の Lottie は冒頭に 160〜534ms の無動作フレームが焼き込まれている。
/// タップ時はここから再生を開始する(最初のキーフレーム時刻 ÷ 全体フレーム数)。
/// 値は HTML 版と同一計測: home 10/40, talk 6/59, bag 10.8/59, profile 4/40,
/// location 8.4/59, gallery 0/40, calendar 16/60。
const Map<String, double> kIconStartFraction = {
  'home': 0.25,
  'poppin': 0.10,
  'shop': 0.18,
  'mypage': 0.10,
  'checkin': 0.14,
  'gallery': 0.0,
  'calendar': 0.27,
};

// ---- bar visual tokens (checkin_motion / bwu tabbar component) --------------

const double kBarHeight = 64;
const double kBarRadius = 42;
const double kBarBlur = 16;
const double kBarPadX = 20;
const double kTabWidth = 48;
const double kTabGap = 12;
const double kIconSize = 24;
const double kLabelSize = 11;
const Color kBarBg = Color(0xA6000000); // rgba(0,0,0,.65)
const Color kBarBorder = Color(0x26FFFFFF); // rgba(255,255,255,.15)
const Color kTabInactive = Color(0x80FFFFFF); // rgba(255,255,255,.5)
const Color kTabActive = Colors.white;
const Color kMoreCircleBg = Color(0x40FFFFFF); // rgba(255,255,255,.25)
const Color kMoreCircleBorder = Color(0x26FFFFFF);
const Color kSatelliteBg = Color(0xA6000000); // rgba(0,0,0,.65) — Figma 261:556
const Color kSatelliteBorder = Color(0x26FFFFFF); // rgba(255,255,255,.15)

class TabSpec {
  const TabSpec(this.key, this.label, this.asset);
  final String key;
  final String label;
  final String asset;
}

/// Bar tabs (index 0..3 — the center More button is separate). Assets = Lottie.
const List<TabSpec> kTabs = [
  TabSpec('home', 'Home', 'assets/tabbar/home.json'),
  TabSpec('poppin', "Poppin'", 'assets/tabbar/talk.json'),
  TabSpec('shop', 'Shop', 'assets/tabbar/shop.json'),
  TabSpec('mypage', 'Mypage', 'assets/tabbar/mypage.json'),
];

/// More-menu satellites: Check In / Gallery / Calendar (order = left, center, right).
const List<TabSpec> kMoreItems = [
  TabSpec('checkin', 'Check In', 'assets/tabbar/checkin.json'),
  TabSpec('gallery', 'Gallery', 'assets/tabbar/gallery.json'),
  TabSpec('calendar', 'Calendar', 'assets/tabbar/calendar.json'),
];

// ---- widget -----------------------------------------------------------------

/// checkin_motion の Floating tab bar + expanding More menu (260726).
/// Place inside a Stack so the menu can overlay content, e.g.:
///   Positioned(left: 0, right: 0, bottom: 24,
///     child: Center(child: TabBar260726(
///       index: i, onChanged: setIndex, onMoreItem: (key) {...})))
class TabBar260726 extends StatefulWidget {
  const TabBar260726({
    super.key,
    required this.index,
    required this.onChanged,
    this.onMoreItem,
    this.onMoreOpenChanged,
  });

  /// Active bar tab: 0=Home 1=Poppin' 2=Shop 3=Mypage (see [kTabs]).
  final int index;
  final ValueChanged<int> onChanged;

  /// Called with 'checkin' | 'gallery' | 'calendar' when a satellite is tapped.
  final ValueChanged<String>? onMoreItem;

  /// More メニュー開閉の通知 — [TabBarBg260726] の open と同期させる。
  final ValueChanged<bool>? onMoreOpenChanged;

  @override
  State<TabBar260726> createState() => _TabBar260726State();
}

class _TabBar260726State extends State<TabBar260726>
    with TickerProviderStateMixin {
  final Map<String, AnimationController> _icons = {};
  final Map<String, Duration> _durations = {};
  late final AnimationController _menu; // more menu open/close

  bool get _open => _menu.status == AnimationStatus.forward ||
      _menu.status == AnimationStatus.completed;

  @override
  void initState() {
    super.initState();
    for (final t in [...kTabs, ...kMoreItems]) {
      _icons[t.key] = AnimationController(vsync: this);
    }
    _menu = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 320));
  }

  @override
  void dispose() {
    for (final c in _icons.values) {
      c.dispose();
    }
    _menu.dispose();
    super.dispose();
  }

  void _play(String key) {
    final d = _durations[key];
    if (d == null) return;
    _icons[key]!
      ..duration = d
      ..forward(from: kIconStartFraction[key] ?? 0); // skip baked-in dead time
  }

  void _toggleMore() {
    if (_open) {
      _menu.reverse();
      widget.onMoreOpenChanged?.call(false);
    } else {
      widget.onMoreOpenChanged?.call(true);
      _menu.forward();
      // play in sync with each satellite's pop (mid 0ms / sides 30ms/60ms)
      const popDelay = [30, 0, 60];
      for (var i = 0; i < kMoreItems.length; i++) {
        Future.delayed(Duration(milliseconds: popDelay[i]), () {
          if (mounted && _open) _play(kMoreItems[i].key);
        });
      }
    }
    setState(() {});
  }

  /// Close from outside (e.g. a scrim). Safe to call when already closed.
  void closeMore() {
    if (_open) {
      _menu.reverse();
      widget.onMoreOpenChanged?.call(false);
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final more = kMoreSpec;
    final menuHeight = more.circle + more.sideDrop + 2 + 15; // circle+drop+gap+label
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: menuHeight + more.gapAboveBar,
          child: _moreMenu(),
        ),
        _bar(),
      ],
    );
  }

  // ---- more menu ----
  Widget _moreMenu() {
    final more = kMoreSpec;
    return AnimatedBuilder(
      animation: _menu,
      builder: (context, _) {
        return IgnorePointer(
          ignoring: _menu.value == 0,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (var i = 0; i < kMoreItems.length; i++) ...[
                if (i > 0) SizedBox(width: more.pitch - more.circle),
                Padding(
                  padding: EdgeInsets.only(top: i == 1 ? 0 : more.sideDrop),
                  child: _satellite(kMoreItems[i], i),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _satellite(TabSpec t, int i) {
    final more = kMoreSpec;
    // per-item stagger: sides trail the center slightly (matches HTML delays)
    final delay = i == 1 ? 0.0 : (i == 0 ? 0.09 : 0.18);
    final tCurve = CurvedAnimation(
      parent: _menu,
      curve: Interval(delay, 1, curve: Curves.easeOutBack),
    );
    final fade = CurvedAnimation(
      parent: _menu,
      curve: Interval(delay, delay + 0.55, curve: Curves.easeOut),
    );
    final adj = kTabAdjust[t.key] ?? const TabAdjust();
    return FadeTransition(
      opacity: fade,
      child: AnimatedBuilder(
        animation: tCurve,
        builder: (context, child) => Transform.translate(
          offset: Offset(0, 18 * (1 - tCurve.value)),
          child: Transform.scale(
            scale: 0.55 + 0.45 * tCurve.value,
            alignment: Alignment.bottomCenter,
            child: child,
          ),
        ),
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () {
            _play(t.key);
            widget.onMoreItem?.call(t.key);
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipOval(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                  child: Container(
                    width: more.circle,
                    height: more.circle,
                    decoration: BoxDecoration(
                      color: kSatelliteBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: kSatelliteBorder),
                    ),
                    alignment: Alignment.center,
                    child: SizedBox(
                      width: kIconSize,
                      height: kIconSize,
                      child: _adjusted(
                        adj,
                        Lottie.asset(
                          t.asset,
                          controller: _icons[t.key],
                          fit: BoxFit.contain,
                          onLoaded: (composition) {
                            _durations[t.key] = composition.duration;
                            _icons[t.key]!.duration = composition.duration;
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 2),
              Text(t.label, style: _labelStyle(const Color(0x80FFFFFF))),
            ],
          ),
        ),
      ),
    );
  }

  // ---- bar (checkin_motion verbatim) ----
  Widget _bar() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(kBarRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: kBarBlur, sigmaY: kBarBlur),
        child: Container(
          height: kBarHeight,
          padding: const EdgeInsets.symmetric(horizontal: kBarPadX, vertical: 7),
          decoration: BoxDecoration(
            color: kBarBg,
            borderRadius: BorderRadius.circular(kBarRadius),
            border: Border.all(color: kBarBorder),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _tab(0), // Home
              const SizedBox(width: kTabGap),
              _tab(1), // Poppin'
              const SizedBox(width: kTabGap),
              _moreButton(),
              const SizedBox(width: kTabGap),
              _tab(2), // Shop
              const SizedBox(width: kTabGap),
              _tab(3), // Mypage
            ],
          ),
        ),
      ),
    );
  }

  Widget _tab(int i) {
    final t = kTabs[i];
    final adj = kTabAdjust[t.key] ?? const TabAdjust();
    final active = widget.index == i;
    // lottie strokes are baked white -> inactive via 50% opacity (matches HTML)
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        widget.onChanged(i);
        _play(t.key);
      },
      child: SizedBox(
        width: kTabWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedOpacity(
              duration: const Duration(milliseconds: 180),
              opacity: active ? 1 : 0.5,
              child: SizedBox(
                width: kIconSize,
                height: kIconSize,
                child: _adjusted(
                  adj,
                  Lottie.asset(
                    t.asset,
                    controller: _icons[t.key],
                    fit: BoxFit.contain,
                    onLoaded: (composition) {
                      _durations[t.key] = composition.duration;
                      _icons[t.key]!.duration = composition.duration;
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(t.label,
                style: _labelStyle(active ? kTabActive : kTabInactive)),
          ],
        ),
      ),
    );
  }

  Widget _moreButton() {
    final adj = kTabAdjust['more'] ?? const TabAdjust();
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _toggleMore,
      child: SizedBox(
        width: kTabWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipOval(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _open ? Colors.white : kMoreCircleBg,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _open ? Colors.transparent : kMoreCircleBorder,
                    ),
                  ),
                  alignment: Alignment.center,
                  // 48x48 HANA flower; white@75% closed -> black open
                  child: _adjusted(
                    adj,
                    SvgPicture.asset(
                      'assets/tabbar/ic_hana.svg',
                      width: 48,
                      height: 48,
                      colorFilter: ColorFilter.mode(
                        _open
                            ? Colors.black
                            : Colors.white.withValues(alpha: 0.75),
                        BlendMode.srcIn,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text('More', style: _labelStyle(kTabInactive)),
          ],
        ),
      ),
    );
  }

  Widget _adjusted(TabAdjust adj, Widget child) => Transform.translate(
        offset: Offset(adj.dx, adj.dy),
        child: Transform.scale(scale: adj.scale, child: child),
      );

  TextStyle _labelStyle(Color color) => TextStyle(
        color: color,
        fontSize: kLabelSize,
        height: 15 / kLabelSize,
        letterSpacing: 0.11,
        fontFamily: 'Figtree',
        fontFamilyFallback: const ['Hiragino Sans', 'Noto Sans JP'],
      );
}

/// 背景グラデーション — Tabbar_set 322:1202 コンテナ背景の完全再現。
/// Stack 内で画面下端に Positioned(left:0, right:0, bottom:0) で置き、
/// [open] を More メニューの開閉([TabBar260726.onMoreOpenChanged])と同期させる。
///   通常時 (261:414): transparent 52.404% → rgba(0,0,0,.6)、blurなし
///   展開時 (316:1059): rgba(16,16,16,0) → #101010 +
///     **上に向かって透明になる** background blur 8
///
/// blur が上に向かって消えるのは Figma の background-blur がレイヤー自身のアルファで
/// 変調されるため(グラデが透明な上側では blur も効かない)。Flutter では
/// [ShaderMask] + [BlendMode.dstIn] で同じ縦アルファ勾配を blur 層に掛けて再現する。
/// blur 半径は 0 → 8 を [TweenAnimationBuilder] でアニメーションさせる
/// (Opacity でフェードすると合成レイヤー化で blur が飛ぶため)。
class TabBarBg260726 extends StatelessWidget {
  const TabBarBg260726({super.key, required this.open});
  final bool open;

  static const double height = 268;
  static const double blurSigma = 8;
  static const Duration duration = Duration(milliseconds: 300);

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: SizedBox(
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // ① Default (261:414) の黒グラデ
            AnimatedOpacity(
              duration: duration,
              opacity: open ? 0 : 1,
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: [0.52404, 1],
                    colors: [Color(0x00000000), Color(0x99000000)],
                  ),
                ),
              ),
            ),

            // ② 上に向かって消える blur(展開時のみ、半径を 0 → 8 でアニメ)
            TweenAnimationBuilder<double>(
              tween: Tween(end: open ? blurSigma : 0),
              duration: duration,
              curve: Curves.easeInOut,
              builder: (context, sigma, _) {
                if (sigma <= 0.01) return const SizedBox.expand();
                return ShaderMask(
                  blendMode: BlendMode.dstIn,
                  shaderCallback: (rect) => const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x00000000), Color(0xFF000000)],
                  ).createShader(rect),
                  child: ClipRect(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
                      child: const SizedBox.expand(),
                    ),
                  ),
                );
              },
            ),

            // ③ Opened (316:1059) の #101010 グラデ(blur の上に乗る)
            AnimatedOpacity(
              duration: duration,
              opacity: open ? 1 : 0,
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x00101010), Color(0xFF101010)],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
