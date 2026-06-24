/* ════════════════════════════════════════════════════════════════════════
   <bwu-action-rail> — 縦動画の右側アクションボタン（縦5つ）共通コンポーネント
   ♥ いいね / 🔖 保存 / 💬 コメント / 📄 概要(詳細) / ⛶ 全画面

   使い方:
     <script src="./lottie-data.js"></script>          <!-- 任意：あればLottie -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
     <script src="./bwu-action-rail.js"></script>
     ...
     <bwu-action-rail id="rail"></bwu-action-rail>        <!-- 既定で5つ -->
     <bwu-action-rail buttons="heart,bookmark,comment"></bwu-action-rail>  <!-- 任意に選択/並べ替え -->

   イベント（bubbles + composed）:
     heart / bookmark … トグル（e.detail.on で on/off）。アニメはコンポーネント内で完結
     comment / detail / fullscreen … タップ通知（開閉・全画面化は呼び出し側で実装）
   メソッド:
     rail.setActive('comment', true)  … コメント/概要シートが開いている時の枠を表示

   配置は呼び出し側（position:absolute; right:16px; top:… 等）。
   依存（任意）: window.lottie + window.HEART_LOTTIE / window.BOOKMARK_LOTTIE → 無ければ静的SVG。
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
  const TOGGLES = { heart: 'rgba(255,62,62,0.6)', bookmark: 'rgba(255,209,51,0.6)' };

  const CSS = `
    :host { display: flex; flex-direction: column; gap: 8px; }
    .fab {
      width: 48px; height: 48px; border-radius: 42px;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer; transition: border-color .2s ease;
    }
    .fab .ico-wrap { display: flex; align-items: center; justify-content: center; }
    .fab .ico { width: 24px; height: 24px; display: block; }   /* block: インラインSVGのベースライン余白で上にズレるのを防ぐ */
    .fab.lot { overflow: visible; }   /* Lottie のバースト粒子をはみ出させる */
    .lottie { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 72px; height: 72px; pointer-events: none; }
    .fab.on { border-color: rgba(255,255,255,0.6); }
  `;

  class BwuActionRail extends HTMLElement {
    connectedCallback() {
      if (this._built) return; this._built = true;
      const list = (this.getAttribute('buttons') || 'heart,bookmark,comment,detail,fullscreen')
        .split(',').map(s => s.trim()).filter(n => ICONS[n]);
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style>` + list.map(name => {
        const lot = (name === 'heart' || name === 'bookmark');
        return `<div class="fab${lot ? ' lot' : ''}" data-act="${name}">`
             + `<span class="ico-wrap">${ICONS[name]}</span>`
             + (lot ? `<div class="lottie"></div>` : '')
             + `</div>`;
      }).join('');

      this._btns = {};
      root.querySelectorAll('.fab').forEach(btn => {
        const name = btn.dataset.act;
        this._btns[name] = btn;
        if (TOGGLES[name]) this._setupToggle(btn, name);
        else btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
        });
      });
    }

    _setupToggle(btn, name) {
      const rawData = name === 'heart' ? window.HEART_LOTTIE : window.BOOKMARK_LOTTIE;
      const onColor = TOGGLES[name];
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

    /* コメント/概要シートが開いている時の枠（active）を制御 */
    setActive(name, on) {
      const b = this._btns && this._btns[name];
      if (b) b.classList.toggle('on', !!on);
    }
  }
  customElements.define('bwu-action-rail', BwuActionRail);
})();
