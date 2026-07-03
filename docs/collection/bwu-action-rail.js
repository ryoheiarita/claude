/* ════════════════════════════════════════════════════════════════════════
   <bwu-action-rail> — 縦動画の右側アクションボタン（縦5つ）共通コンポーネント
   ♥ いいね / 🔖 保存 / 💬 コメント / 📄 概要(詳細) / ⛶ 全画面

   使い方:
     <script src="./lottie-data.js"></script>          <!-- 任意：あれば♥🔖Lottie -->
     <script src="./rail-icons.js"></script>           <!-- 任意：あれば💬📄⛶Lottie -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
     <script src="./bwu-action-rail.js"></script>
     ...
     <bwu-action-rail id="rail"></bwu-action-rail>        <!-- 既定で5つ -->
     <bwu-action-rail buttons="heart,bookmark,comment"></bwu-action-rail>  <!-- 任意に選択/並べ替え -->

   イベント（bubbles + composed）:
     heart / bookmark … トグル（e.detail.on で on/off）。アニメはコンポーネント内で完結
     comment / detail / fullscreen … タップ通知。タップで Lottie を1度だけ再生（開閉・全画面化は呼び出し側で実装）
   メソッド:
     rail.setActive('comment', true)  … コメント/概要シートが開いている時の枠を表示

   配置は呼び出し側（position:absolute; right:16px; top:… 等）。
   依存（任意）: window.lottie +
     window.HEART_LOTTIE / window.BOOKMARK_LOTTIE          （♥🔖トグル）
     window.COMMENT_LOTTIE / window.DETAIL_LOTTIE / window.FULLSCREEN_LOTTIE （💬📄⛶ワンショット）
   無ければ静的SVGにフォールバック。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  if (customElements.get('bwu-action-rail')) return;

  const ICONS = {
    heart:      `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-9.6-9C1 9.1 2.6 6 5.8 6c1.9 0 3.2 1 4.2 2.3C11 7 12.3 6 14.2 6 17.4 6 19 9.1 17.6 12 15.5 16.4 12 21 12 21z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    bookmark:   `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16l-6-4-6 4V4z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    comment:    `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 14.7 3.04 17.08 4.74 18.88L3.28 21.19C3.09 21.5 3.32 21.89 3.68 21.86L7.59 21.52C8.97 22.15 10.44 22.5 12 22.5" stroke="#fff" stroke-width="1.6"/><circle cx="8" cy="12" r="1.2" fill="#fff"/><circle cx="12" cy="12" r="1.2" fill="#fff"/><circle cx="16" cy="12" r="1.2" fill="#fff"/></svg>`,
    detail:     `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 13h6M9 17h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    fullscreen: `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  // mode: 'toggle' = ♥🔖（on/off）, 'once' = 💬📄⛶（タップで1回再生）
  const CONFIG = {
    heart:      { global: 'HEART_LOTTIE',      mode: 'toggle', color: 'rgba(255,62,62,0.6)' },
    bookmark:   { global: 'BOOKMARK_LOTTIE',   mode: 'toggle', color: 'rgba(255,209,51,0.6)' },
    comment:    { global: 'COMMENT_LOTTIE',    mode: 'once' },
    detail:     { global: 'DETAIL_LOTTIE',     mode: 'once' },
    fullscreen: { global: 'FULLSCREEN_LOTTIE', mode: 'once' },
  };

  const CSS = `
    :host { display: flex; flex-direction: column; gap: 8px; }
    .fab {
      box-sizing: border-box;   /* Shadow DOM内は *{box-sizing:border-box} が継承されないため明示。border込みで48px（ライト側の.fabと一致） */
      width: 48px; height: 48px; border-radius: 42px;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer; transition: border-color .2s ease;
    }
    .fab .ico-wrap { display: flex; align-items: center; justify-content: center; }
    .fab .ico { width: 24px; height: 24px; display: block; }   /* block: インラインSVGのベースライン余白で上にズレるのを防ぐ */
    .fab.lot { overflow: visible; }   /* Lottie のはみ出し（バースト粒子・回転）を許可 */
    /* ♥🔖: 大きなキャンバスのバースト用 72px */
    .lottie { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 72px; height: 72px; pointer-events: none; }
    /* 💬📄⛶: 24px ホルダー。中身は _fitOnce() で 18px・中央に正規化（♥🔖の余白感に合わせる） */
    .lottie.sm { width: 24px; height: 24px; transform-origin: center; }
    .lottie.sm svg { overflow: visible; }   /* 弾性バウンド・回転で枠外に出る分を表示 */
    .fab.on { border-color: rgba(255,255,255,0.6); }

    /* 💬 アーティストコメントがある時：コメントアイコン ⇄ アーティストアイコン（最大3人）を
       1sずつ scale で「ポワン」と切替（背景ボタンはそのまま）。
       .face を .fab 中央に重ね、show 側だけ scale(1)。入りは overshoot、抜けは素早く縮む＝ポワン。 */
    .fab .face {
      position: absolute; top: 50%; left: 50%;
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      transform: translate(-50%,-50%) scale(0);
      opacity: 0;
      transition: transform .28s cubic-bezier(.4,0,1,1), opacity .18s ease;   /* 抜け：素早く縮む */
      pointer-events: none;
    }
    .fab .face.show {
      transform: translate(-50%,-50%) scale(1);
      opacity: 1;
      transition: transform .40s cubic-bezier(.34,1.56,.64,1), opacity .26s ease;  /* 入り：弾んで出る＝ポワン */
    }
    .fab .avatar-face img {
      width: 30px; height: 30px; border-radius: 50%;
      object-fit: cover; display: block;
      box-shadow: 0 0 0 1.5px rgba(255,255,255,0.85);   /* アーティストと分かる細いリング */
    }
  `;

  class BwuActionRail extends HTMLElement {
    connectedCallback() {
      if (this._built) return; this._built = true;
      const list = (this.getAttribute('buttons') || 'heart,bookmark,comment,detail,fullscreen')
        .split(',').map(s => s.trim()).filter(n => ICONS[n]);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style>` + list.map(name => {
        const cfg = CONFIG[name];
        const small = cfg && cfg.mode === 'once';
        return `<div class="fab lot" data-act="${name}">`
             + `<span class="ico-wrap">${ICONS[name]}</span>`
             + `<div class="lottie${small ? ' sm' : ''}"></div>`
             + `</div>`;
      }).join('');

      this._btns = {};
      root.querySelectorAll('.fab').forEach(btn => {
        const name = btn.dataset.act;
        this._btns[name] = btn;
        const cfg = CONFIG[name] || { mode: 'once' };
        if (cfg.mode === 'toggle') this._setupToggle(btn, name, cfg);
        else this._setupOnce(btn, name, cfg);
      });

      // 属性 comment-artists="url1,url2,url3" が有れば起動時にアーティスト切替を開始
      const artists = (this.getAttribute('comment-artists') || '').split(',').map(s => s.trim()).filter(Boolean);
      if (artists.length) this.setCommentArtists(artists);
    }

    disconnectedCallback() {
      if (this._artistTimer) { clearTimeout(this._artistTimer); this._artistTimer = null; }
    }

    /* ♥🔖 … on/off トグル（Lottie が無ければ静的SVGの塗り替え） */
    _setupToggle(btn, name, cfg) {
      const rawData = window[cfg.global];
      const onColor = cfg.color;
      const holder = btn.querySelector('.lottie');
      const fallback = btn.querySelector('.ico-wrap');
      let on = false;
      const emit = () => this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { on } }));

      if (window.lottie && rawData) {
        if (fallback) fallback.style.display = 'none';
        const data = JSON.parse(JSON.stringify(rawData));
        try { data.layers[0].shapes[1].c.k = [1,1,1,1]; data.layers[2].shapes[1].c.k = [1,1,1,1]; } catch (e) {}
        const anim = window.lottie.loadAnimation({ container: holder, renderer: 'svg', loop: false, autoplay: false, animationData: data });
        anim.goToAndStop(0, true);
        const LIKE = 17, FILLED = 90, UNLIKE = 105;
        let busy = false;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (busy) return;
          if (!on) {
            on = true; busy = true; btn.style.borderColor = onColor; anim.goToAndPlay(LIKE, true);
            const f = (ev) => { if (ev.currentTime >= FILLED) { anim.pause(); anim.removeEventListener('enterFrame', f); busy = false; } };
            anim.addEventListener('enterFrame', f);
          } else {
            on = false; busy = true; btn.style.borderColor = ''; anim.goToAndPlay(UNLIKE, true);
            anim.addEventListener('complete', () => { anim.goToAndStop(0, true); busy = false; }, { once: true });
          }
          emit();
        });
      } else {
        if (holder) holder.style.display = 'none';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          on = !on; btn.style.borderColor = on ? onColor : '';
          const p = fallback && fallback.querySelector('path');
          if (p) p.setAttribute('fill', on ? (name === 'heart' ? '#ff3e3e' : '#ffd133') : 'none');
          emit();
        });
      }
    }

    /* 💬📄⛶ … タップで1度だけ再生して通知（Lottie が無ければ静的SVGのまま通知） */
    _setupOnce(btn, name, cfg) {
      const rawData = window[cfg.global];
      const holder = btn.querySelector('.lottie');
      const fallback = btn.querySelector('.ico-wrap');
      const emit = () => this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));

      if (window.lottie && rawData) {
        if (fallback) fallback.style.display = 'none';
        const anim = window.lottie.loadAnimation({
          container: holder, renderer: 'svg', loop: false, autoplay: false,
          animationData: JSON.parse(JSON.stringify(rawData)),
        });
        anim.goToAndStop(0, true);
        // Lottie 各素材で中身のサイズ/中心がバラつくので 18px・中央に正規化（♥🔖の余白感に合わせる）
        requestAnimationFrame(() => this._fitOnce(holder));
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          anim.goToAndPlay(0, true);   // タップごとに頭から1回
          emit();
        });
      } else {
        if (holder) holder.style.display = 'none';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          emit();
        });
      }
    }

    /* ワンショットLottie の中身を 18px・ボタン中央に正規化（素材ごとの大きさ/中心ズレを吸収） */
    _fitOnce(holder) {
      const TARGET = 18; // ♥🔖と揃う見かけサイズ
      const svg = holder.querySelector('svg');
      const g = svg && svg.querySelector('g');
      if (!g) return;
      const sr = svg.getBoundingClientRect();
      const gr = g.getBoundingClientRect();
      const maxDim = Math.max(gr.width, gr.height);
      if (!maxDim) return;
      const s = TARGET / maxDim;
      const ux = -((gr.x + gr.width / 2) - (sr.x + sr.width / 2));   // 中身の中心 → ホルダー中心
      const uy = -((gr.y + gr.height / 2) - (sr.y + sr.height / 2));
      holder.style.transform =
        `translate(-50%,-50%) scale(${s.toFixed(3)}) translate(${ux.toFixed(2)}px,${uy.toFixed(2)}px)`;
    }

    /* 💬 アーティストコメントがある時のアイコン切替。
       urls: アーティストアバターURLの配列（最大3人）。空/未指定で通常のコメントアイコンに戻す。
       挙動: コメントアイコン → 1 → 2 → 3 → コメントアイコン … を 1s ごとに scale で「ポワン」と巡回。 */
    setCommentArtists(urls) {
      const btn = this._btns && this._btns.comment;
      if (!btn) return;
      if (this._artistTimer) { clearTimeout(this._artistTimer); this._artistTimer = null; }
      btn.querySelectorAll('.avatar-face').forEach(el => el.remove());

      // 既存のコメントアイコン一式（.ico-wrap / .lottie）を face(icon-face) に一度だけ内包
      let iconFace = btn.querySelector('.icon-face');
      if (!iconFace) {
        iconFace = document.createElement('div');
        iconFace.className = 'face icon-face show';
        Array.from(btn.children)
          .filter(n => !n.classList.contains('face'))
          .forEach(n => iconFace.appendChild(n));
        btn.appendChild(iconFace);
      }

      const list = (urls || []).filter(Boolean).slice(0, 3);   // 最大3人
      if (!list.length) { iconFace.classList.add('show'); return; }   // 通常アイコン固定

      list.forEach(u => {
        const f = document.createElement('div');
        f.className = 'face avatar-face';
        const img = document.createElement('img');
        img.src = u; img.alt = '';
        f.appendChild(img);
        btn.appendChild(f);
      });

      const faces = [iconFace, ...btn.querySelectorAll('.avatar-face')];
      faces.forEach((f, idx) => f.classList.toggle('show', idx === 0));
      // 各面の表示時間：アーティストは1s。1周してコメントアイコンに戻ったら5s待機してから次の周へ。
      // 初回だけは記事アクセスから1sで切替を開始する。
      const HOLD_AVATAR = 1000, HOLD_ICON = 5000, FIRST_DELAY = 1000;
      let i = 0;
      const step = () => {
        faces[i].classList.remove('show');
        i = (i + 1) % faces.length;
        faces[i].classList.add('show');
        this._artistTimer = setTimeout(step, i === 0 ? HOLD_ICON : HOLD_AVATAR);
      };
      this._artistTimer = setTimeout(step, FIRST_DELAY);
    }

    /* コメント/概要シートが開いている時の枠（active）を制御 */
    setActive(name, on) {
      const b = this._btns && this._btns[name];
      if (b) b.classList.toggle('on', !!on);
    }
  }
  customElements.define('bwu-action-rail', BwuActionRail);
})();
