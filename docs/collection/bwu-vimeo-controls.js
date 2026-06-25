/* ════════════════════════════════════════════════════════════════════
   bwu-vimeo-controls.js — Vimeo カスタムコントローラー（共通）
   仕様: flutter_document/VIMEO_PLAYER_SPEC.md / 動作: vimeo-test.html
   ─────────────────────────────────────────────────────────────────────
   ・Vimeo 標準コントローラーは出さない（src の controls=0 ＋ iframe pointer-events:none）
   ・自前で「中央 再生/停止ボタン・シークバー・上下グラデ」を重ねる
   ・UI は 2.5 秒で自動消滅。映像タップでトグル（表示中→消す／非表示→出す）
   ・再生ボタン/シークバー操作中は UI 維持
   ・LIVE 画面（パスに /live-）はシークバーの代わりに「● LIVE」表記。シークなし＝再生/停止のみ
   ─────────────────────────────────────────────────────────────────────
   ・既存の戻るボタン・右側アクションレール（全画面含む）はそのまま残す（重複させない）
   ・全画面ボタンは付けない（横モードは各画面の既存ボタンに任せる）
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HIDE_MS = 2500;
  var STYLE_ID = 'bwu-vimeo-controls-style';

  /* ── 共通スタイル（1回だけ注入） ── */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      /* iframe は操作不可。タップは透過レイヤーで受ける */
      '.vp-host > iframe{pointer-events:none !important;}',
      /* 透明タップ層（再生/停止・UIトグル） */
      '.vp-tap{position:absolute;inset:0;z-index:20;background:transparent;}',
      /* 中央 再生/停止ボタン */
      '.vp-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:72px;height:72px;border-radius:50%;border:0;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:30;cursor:pointer;transition:opacity .25s ease,transform .15s ease;}',
      '.vp-play:active{transform:translate(-50%,-50%) scale(.92);}',
      '.vp-play svg{width:34px;height:34px;display:block;}',
      /* 上端グラデ（戻るボタン視認性） */
      '.vp-top-scrim{position:absolute;top:0;left:0;right:0;height:calc(env(safe-area-inset-top,0px) + 100px);z-index:21;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 100%);}',
      /* 下端グラデ（シーク/LIVE 視認性） */
      '.vp-seek-scrim{position:absolute;left:0;right:0;bottom:0;height:160px;z-index:25;pointer-events:none;background:linear-gradient(to top,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 100%);}',
      /* シークバー（VOD のみ） */
      '.vp-seek{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);z-index:30;display:flex;align-items:center;gap:10px;font-family:\'Figtree\',-apple-system,sans-serif;font-size:11px;font-weight:500;color:rgba(255,255,255,.85);font-variant-numeric:tabular-nums;}',
      '.vp-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.25);position:relative;cursor:pointer;touch-action:none;}',
      '.vp-bar::before{content:\'\';position:absolute;left:0;right:0;top:-14px;bottom:-14px;}',
      '.vp-fill{position:absolute;top:0;bottom:0;left:0;border-radius:2px;background:#fff;width:0%;}',
      '.vp-knob{position:absolute;top:50%;left:0;width:12px;height:12px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);box-shadow:0 0 4px rgba(0,0,0,.4);transition:transform .12s ease;pointer-events:none;}',
      '.vp-seek.vp-scrubbing .vp-knob{transform:translate(-50%,-50%) scale(1.4);}',
      /* LIVE 表記（ライブ画面・シークバーの代わり） */
      '.vp-live{position:absolute;left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);z-index:30;display:flex;align-items:center;gap:6px;font-family:\'Figtree\',-apple-system,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;color:#fff;}',
      '.vp-live::before{content:\'\';width:8px;height:8px;border-radius:50%;background:#ff3b30;box-shadow:0 0 6px rgba(255,59,48,.85);}',
      /* フェード（再生ボタンは transform も残すので別指定） */
      '.vp-top-scrim,.vp-seek-scrim,.vp-seek,.vp-live{transition:opacity .25s ease;}',
      /* 一括消滅 */
      '.vp-host.vp-ui-hidden .vp-play,',
      '.vp-host.vp-ui-hidden .vp-top-scrim,',
      '.vp-host.vp-ui-hidden .vp-seek-scrim,',
      '.vp-host.vp-ui-hidden .vp-seek,',
      '.vp-host.vp-ui-hidden .vp-live{opacity:0;pointer-events:none;}',
      /* 横モードの外部全画面ボタン（各画面の .ls-fullscreen）を自前UIの上に出す（グラデの裏に埋もれない） */
      '.vp-host .ls-fullscreen{z-index:31 !important;}',
      /* LIVE はシークバーが無いので、全画面ボタンをシークバーと同じ高さ（下端＋20px）の右下に置く */
      '.vp-host.vp-live-host .ls-fullscreen{right:16px !important;bottom:calc(env(safe-area-inset-bottom,0px) + 20px) !important;}'
    ].join('\n');
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ── src に controls=0 を保証（sed 済みのはずだが念のため） ── */
  function ensureControls(iframe) {
    var src = iframe.getAttribute('src') || '';
    if (!src || src.indexOf('controls=0') !== -1) return false;
    var sep = src.indexOf('?') === -1 ? '?' : '&';
    iframe.setAttribute('src', src + sep + 'controls=0');
    return true;
  }

  var ICON_PLAY  = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="#fff"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';

  /* ── オーバーレイ DOM を生成して stage に重ねる ── */
  function buildOverlay(stage, isLive) {
    var frag = {};

    var tap = div('vp-tap');
    var topScrim = div('vp-top-scrim');
    var seekScrim = div('vp-seek-scrim');

    var play = document.createElement('button');
    play.className = 'vp-play';
    play.setAttribute('aria-label', '再生');
    play.innerHTML = ICON_PLAY;

    stage.appendChild(topScrim);
    stage.appendChild(seekScrim);
    stage.appendChild(tap);
    stage.appendChild(play);

    frag.tap = tap;
    frag.play = play;

    if (isLive) {
      var live = div('vp-live');
      live.textContent = 'LIVE';
      stage.appendChild(live);
    } else {
      var seek = div('vp-seek');
      var cur = span('0:00');
      var bar = div('vp-bar');
      var fill = div('vp-fill');
      var knob = div('vp-knob');
      var dur = span('0:00');
      bar.appendChild(fill);
      bar.appendChild(knob);
      seek.appendChild(cur);
      seek.appendChild(bar);
      seek.appendChild(dur);
      stage.appendChild(seek);
      frag.seek = seek; frag.bar = bar; frag.fill = fill; frag.knob = knob; frag.cur = cur; frag.dur = dur;
    }
    return frag;
  }
  function div(cls) { var d = document.createElement('div'); d.className = cls; return d; }
  function span(t) { var s = document.createElement('span'); s.textContent = t; return s; }

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /* ── コントローラー本体 ── */
  function Controller(stage, iframe, ov, isLive) {
    this.stage = stage; this.iframe = iframe; this.ov = ov; this.isLive = isLive;
    this.player = null;
    this.playing = false;
    this.duration = 0;
    this.scrubbing = false;
    this.hideTimer = null;
  }
  Controller.prototype.setPlaying = function (on) {
    this.playing = on;
    this.ov.play.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
  };
  Controller.prototype.toggle = function () {
    var p = this.player;
    if (!p) { this.setPlaying(!this.playing); return; }
    (this.playing ? p.pause() : p.play()).catch(function () {});
  };
  Controller.prototype.renderProgress = function (frac) {
    if (this.isLive) return;
    frac = Math.min(1, Math.max(0, frac || 0));
    var pct = frac * 100;
    this.ov.fill.style.width = pct + '%';
    this.ov.knob.style.left = pct + '%';
    this.ov.cur.textContent = fmt(frac * this.duration);
  };
  Controller.prototype.armHide = function () {
    var self = this;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(function () { self.hideUI(); }, HIDE_MS);
  };
  // 横モードの外部全画面ボタン（.ls-fullscreen）も自前UIの表示/非表示に同期
  Controller.prototype.syncExtras = function (visible) {
    var fs = this.stage.querySelectorAll('.ls-fullscreen');
    for (var i = 0; i < fs.length; i++) fs[i].classList.toggle('show', visible);
  };
  Controller.prototype.showUI = function () { this.stage.classList.remove('vp-ui-hidden'); this.syncExtras(true); this.armHide(); };
  Controller.prototype.hideUI = function () { clearTimeout(this.hideTimer); this.stage.classList.add('vp-ui-hidden'); this.syncExtras(false); };
  Controller.prototype.uiHidden = function () { return this.stage.classList.contains('vp-ui-hidden'); };

  Controller.prototype.bindUI = function () {
    var self = this;
    // 再生ボタン：再生/停止のみ（UI 維持）
    this.ov.play.addEventListener('click', function (e) { e.stopPropagation(); self.toggle(); self.showUI(); });
    // 透過レイヤー：表示中→消す／非表示→出す
    this.ov.tap.addEventListener('click', function () { self.uiHidden() ? self.showUI() : self.hideUI(); });

    // 横モードの外部全画面ボタン：操作したら消滅タイマーを延長（UI維持）。表示/非表示は syncExtras が司る
    var fsBtns = this.stage.querySelectorAll('.ls-fullscreen');
    for (var i = 0; i < fsBtns.length; i++) fsBtns[i].addEventListener('click', function () { self.showUI(); });

    this.syncExtras(true);   // 初期は表示（2.5秒後に他UIと一括で消える）
    this.armHide();

    if (!this.isLive) this.bindSeek();
  };

  Controller.prototype.bindSeek = function () {
    var self = this, bar = this.ov.bar, seek = this.ov.seek;
    function fracFrom(e) {
      var r = bar.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return Math.min(1, Math.max(0, x / r.width));
    }
    function move(e) { if (!self.scrubbing) return; e.preventDefault(); self.renderProgress(fracFrom(e)); }
    function end(e) {
      if (!self.scrubbing) return;
      var frac = fracFrom(e);
      self.scrubbing = false;
      seek.classList.remove('vp-scrubbing');
      if (self.player && self.duration) self.player.setCurrentTime(frac * self.duration).catch(function () {});
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      self.armHide();
    }
    bar.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      self.scrubbing = true;
      seek.classList.add('vp-scrubbing');
      clearTimeout(self.hideTimer);
      self.renderProgress(fracFrom(e));
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
    });
  };

  /* ── Vimeo Player SDK を当てる（src 切替時は再バインド） ── */
  Controller.prototype.wirePlayer = function () {
    var self = this;
    if (!(window.Vimeo && window.Vimeo.Player)) return;
    try { this.player = new window.Vimeo.Player(this.iframe); } catch (e) { this.player = null; return; }
    this.player.on('play',  function () { self.setPlaying(true); });
    this.player.on('pause', function () { self.setPlaying(false); });
    this.player.on('ended', function () { self.setPlaying(false); });
    if (!this.isLive) {
      this.player.getDuration().then(function (d) { self.duration = d; self.ov.dur.textContent = fmt(d); }).catch(function () {});
      this.player.on('timeupdate', function (d) {
        if (!self.duration && d.duration) { self.duration = d.duration; self.ov.dur.textContent = fmt(d.duration); }
        if (!self.scrubbing) self.renderProgress(self.duration ? d.seconds / self.duration : 0);
      });
    }
  };

  Controller.prototype.rebind = function () {
    // orient トグル等で iframe src が差し替わった時：状態をリセットして付け直す
    this.duration = 0; this.scrubbing = false;
    this.setPlaying(false);
    if (!this.isLive) { this.renderProgress(0); this.ov.dur.textContent = '0:00'; }
    this.wirePlayer();
    this.showUI();
  };

  /* ── Vimeo SDK のロード待ち（無ければ注入） ── */
  function withVimeo(cb) {
    if (window.Vimeo && window.Vimeo.Player) return cb();
    var existing = document.querySelector('script[src*="player.vimeo.com/api/player.js"]');
    if (!existing) {
      var s = document.createElement('script');
      s.src = 'https://player.vimeo.com/api/player.js';
      document.head.appendChild(s);
    }
    var tries = 0;
    var iv = setInterval(function () {
      if (window.Vimeo && window.Vimeo.Player) { clearInterval(iv); cb(); }
      else if (++tries > 100) { clearInterval(iv); cb(); }  // 5秒で諦める（プレイヤー無しでも UI は動く）
    }, 50);
  }

  /* ── 初期化 ── */
  function init() {
    var stage = document.querySelector('.video-stage');
    if (!stage || stage.classList.contains('vp-host')) return;
    var iframe = stage.querySelector('iframe');
    if (!iframe) return;

    var isLive = /(^|\/)live-/.test(location.pathname);

    injectStyle();
    stage.classList.add('vp-host');
    if (isLive) stage.classList.add('vp-live-host');
    ensureControls(iframe);

    var ov = buildOverlay(stage, isLive);
    var ctrl = new Controller(stage, iframe, ov, isLive);
    ctrl.bindUI();

    withVimeo(function () { ctrl.wirePlayer(); });

    // 縦/横トグルなどで src が変わったら付け直す
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName === 'src') {
          if (ensureControls(iframe)) return;  // controls 補完で再発火 → 次回で rebind
          withVimeo(function () { ctrl.rebind(); });
          break;
        }
      }
    });
    mo.observe(iframe, { attributes: true, attributeFilter: ['src'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
