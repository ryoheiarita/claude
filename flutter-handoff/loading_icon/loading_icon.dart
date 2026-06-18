import 'dart:math';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Animated loading icon with morphing shapes and organic gradient blobs.
///
/// Usage:
/// ```dart
/// const LoadingIcon(size: 200)
/// ```
class LoadingIcon extends StatefulWidget {
  final double size;
  final Color backgroundColor;

  const LoadingIcon({
    super.key,
    this.size = 200,
    this.backgroundColor = Colors.black,
  });

  @override
  State<LoadingIcon> createState() => _LoadingIconState();
}

class _LoadingIconState extends State<LoadingIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 100),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _LoadingIconPainter(
            timeMs: DateTime.now().millisecondsSinceEpoch.toDouble(),
            backgroundColor: widget.backgroundColor,
          ),
        );
      },
    );
  }
}

enum _ShapeType { circle, ellipse, star }

class _ColorBlob {
  final double baseAngle;
  final double speed;
  final double dist;
  final double radius;
  final Color color;

  const _ColorBlob({
    required this.baseAngle,
    required this.speed,
    required this.dist,
    required this.radius,
    required this.color,
  });
}

class _LoadingIconPainter extends CustomPainter {
  final double timeMs;
  final Color backgroundColor;

  static const double _shapeSize = 80;
  static const int _numPhases = 3;
  static const double _phaseDuration = 2500;
  static const double _fullCycle = _phaseDuration * _numPhases;
  static const int _numPoints = 120;
  static const List<_ShapeType> _shapes = [
    _ShapeType.circle,
    _ShapeType.ellipse,
    _ShapeType.star,
  ];

  static const List<_ColorBlob> _colorBlobs = [
    _ColorBlob(baseAngle: 0, speed: 1.2, dist: 55, radius: 120, color: Color(0xFFFF8C3C)),
    _ColorBlob(baseAngle: 1.2, speed: -0.9, dist: 60, radius: 110, color: Color(0xFFC8C83C)),
    _ColorBlob(baseAngle: 2.5, speed: 1.4, dist: 50, radius: 130, color: Color(0xFFE63778)),
    _ColorBlob(baseAngle: 3.8, speed: -1.1, dist: 58, radius: 115, color: Color(0xFF963CD2)),
    _ColorBlob(baseAngle: 5.0, speed: 0.8, dist: 45, radius: 125, color: Color(0xFF5078E6)),
    _ColorBlob(baseAngle: 0.6, speed: -1.3, dist: 40, radius: 100, color: Color(0xFF48C7A5)),
  ];

  // Pre-compute full cycle integral (constant)
  static final double _fullCycleIntegral = () {
    double sum = 0;
    const steps = 200;
    for (int i = 0; i < steps; i++) {
      final t = i / steps;
      final phaseT = (t * _numPhases) % 1;
      final speed = 0.3 + 2.5 * _speedProfile(phaseT);
      sum += speed / steps;
    }
    return sum;
  }();

  _LoadingIconPainter({
    required this.timeMs,
    required this.backgroundColor,
  });

  static double _easeInOutSine(double t) {
    return -(cos(pi * t) - 1) / 2;
  }

  static double _easeInOutCubic(double t) {
    return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
  }

  static double _speedProfile(double phaseT) {
    return pow(sin(phaseT * pi), 2).toDouble();
  }

  ({_ShapeType current, _ShapeType next, double morphT}) _getShapeMorph(double time) {
    final cycleT = (time % _fullCycle) / _fullCycle;
    final phaseIndex = (cycleT * _numPhases).floor();
    final phaseT = (cycleT * _numPhases) - phaseIndex;

    final current = _shapes[phaseIndex % _numPhases];
    final next = _shapes[(phaseIndex + 1) % _numPhases];

    double morphT = 0;
    if (phaseT > 0.4) {
      morphT = _easeInOutCubic((phaseT - 0.4) / 0.6);
    }

    return (current: current, next: next, morphT: morphT);
  }

  double _shapeRadius(_ShapeType shape, double angle, double time) {
    const r = _shapeSize;
    switch (shape) {
      case _ShapeType.circle:
        final breath = sin(time / 1200) * 0.12;
        final rx = 1 + breath;
        final ry = 1 - breath;
        return r / sqrt(
          pow(cos(angle) / rx, 2) + pow(sin(angle) / ry, 2),
        );
      case _ShapeType.ellipse:
        return r / sqrt(
          pow(cos(angle) / 1.4, 2) + pow(sin(angle) / 0.7, 2),
        );
      case _ShapeType.star:
        const n = 4;
        const innerR = r * 0.45;
        const outerR = r * 1.1;
        const sector = pi * 2 / n;
        const half = sector / 2;
        final mod = ((angle % sector) + sector) % sector;
        final t = mod < half ? mod / half : (sector - mod) / half;
        return innerR + (outerR - innerR) * _easeInOutSine(t);
    }
  }

  List<Offset> _getShapePoints(double rotAngle, double time) {
    final morph = _getShapeMorph(time);
    final points = <Offset>[];

    for (int i = 0; i < _numPoints; i++) {
      final a = (i / _numPoints) * pi * 2;
      final r1 = _shapeRadius(morph.current, a, time);
      final r2 = _shapeRadius(morph.next, a, time);
      final r = r1 + (r2 - r1) * morph.morphT;
      points.add(Offset(
        cos(a + rotAngle) * r,
        sin(a + rotAngle) * r,
      ));
    }
    return points;
  }

  double _getRotationAngle(double time) {
    final cycleT = (time % _fullCycle) / _fullCycle;
    final fullCycles = (time / _fullCycle).floor();

    const steps = 200;
    double integral = 0;
    for (int i = 0; i < steps; i++) {
      final t = (i / steps) * cycleT;
      final phaseT = (t * _numPhases) % 1;
      final speed = 0.3 + 2.5 * _speedProfile(phaseT);
      integral += speed * (cycleT / steps);
    }

    final totalProgress = fullCycles * _fullCycleIntegral + integral;
    return totalProgress * pi * 2 * 3;
  }

  Path _buildShapePath(Offset center, List<Offset> points) {
    final path = Path();
    path.moveTo(center.dx + points[0].dx, center.dy + points[0].dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(center.dx + points[i].dx, center.dy + points[i].dy);
    }
    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 400;
    canvas.save();
    canvas.scale(scale);

    const canvasSize = 400.0;
    const center = Offset(canvasSize / 2, canvasSize / 2);

    // Black background
    canvas.drawRect(
      const Rect.fromLTWH(0, 0, canvasSize, canvasSize),
      Paint()..color = backgroundColor,
    );

    // Background glow
    _drawBackgroundGlow(canvas, center, timeMs);

    // Shape
    final angle = _getRotationAngle(timeMs);
    final points = _getShapePoints(angle, timeMs);
    final shapePath = _buildShapePath(center, points);

    // Glow behind shape
    canvas.drawPath(
      shapePath,
      Paint()
        ..color = const Color(0x267850A0)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 25),
    );

    // Clip to shape and draw blob gradient
    canvas.save();
    canvas.clipPath(shapePath);
    _drawBlobGradient(canvas, center, timeMs);

    // Highlight overlay
    final hlPaint = Paint()
      ..shader = ui.Gradient.radial(
        Offset(center.dx - _shapeSize * 0.25, center.dy - _shapeSize * 0.25),
        _shapeSize * 1.1,
        [
          const Color(0x33FFFFFF),
          const Color(0x0DFFFFFF),
          const Color(0x00FFFFFF),
        ],
        [0.0, 0.5, 1.0],
      );
    canvas.drawPath(shapePath, hlPaint);
    canvas.restore();

    canvas.restore();
  }

  void _drawBlobGradient(Canvas canvas, Offset center, double time) {
    // Base fill
    final basePaint = Paint()
      ..shader = ui.Gradient.radial(
        center,
        _shapeSize * 1.3,
        [
          const Color(0xE68C50AA),
          const Color(0xB33C3278),
        ],
        [0.0, 1.0],
      );
    canvas.drawRect(const Rect.fromLTWH(0, 0, 400, 400), basePaint);

    // Color blobs
    for (final blob in _colorBlobs) {
      final angle = blob.baseAngle + time / 2000 * blob.speed;
      final wobble = sin(time / 1500 + blob.baseAngle * 3) * 20;
      final bx = center.dx + cos(angle) * (blob.dist + wobble);
      final by = center.dy + sin(angle) * (blob.dist + wobble);
      final blobCenter = Offset(bx, by);

      final paint = Paint()
        ..shader = ui.Gradient.radial(
          blobCenter,
          blob.radius,
          [
            blob.color.withValues(alpha: 1.0),
            blob.color.withValues(alpha: 0.8),
            blob.color.withValues(alpha: 0.35),
            blob.color.withValues(alpha: 0.0),
          ],
          [0.0, 0.35, 0.65, 1.0],
        );

      canvas.drawCircle(blobCenter, blob.radius, paint);
    }
  }

  void _drawBackgroundGlow(Canvas canvas, Offset center, double time) {
    // Background glow removed — pure black behind the object
  }

  @override
  bool shouldRepaint(covariant _LoadingIconPainter oldDelegate) => true;
}
