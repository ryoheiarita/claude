/* ════════════════════════════════════════════════════════════════════════
   <bwu-action-bar> — フローティングの下部バー（コメント ＋ ♥🔖）共通コンポーネント
   横動画詳細などで使い回す。背景はなし＝フローティング（中の各グループだけ #303030 ピル）。

   使い方:
     <script src="./lottie-data.js"></script>          <!-- 任意：あればLottie -->
     <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
     <script src="./bwu-action-bar.js"></script>
     ...
     <bwu-action-bar label="コメント" avatars="0,2,4"></bwu-action-bar>
     bar.addEventListener('comment',  () => openComments());
     bar.addEventListener('heart',    e => console.log('like:', e.detail.on));
     bar.addEventListener('bookmark', e => console.log('save:', e.detail.on));

   属性:
     label   … コメントボタンのラベル（既定 "コメント"）
     avatars … コメント者アバターの色インデックス（CSV。例 "0,2,4"。空で非表示）

   依存（任意）: window.lottie + window.HEART_LOTTIE / window.BOOKMARK_LOTTIE
     → あれば Lottie アニメ、なければ静的SVGの塗りトグルにフォールバック。
   配置は呼び出し側（position:absolute; bottom:0; left:0; right:0; 等）。
   :host は pointer-events:none、ピルだけ auto なので余白タップは背面に通る。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  if (customElements.get('bwu-action-bar')) return;

  const AV_COLORS = [
    ['#ff8a8a','#ff3d77'], ['#8ab4ff','#5d5dff'], ['#9be59b','#2fae6b'],
    ['#ffd36e','#ff9f43'], ['#d99bff','#8a5dff'], ['#7fe6e0','#2aa7ff'],
    ['#ffb3c8','#ff6f91'], ['#b0b0b0','#777'], ['#ffcf8a','#ff6f43'], ['#cdb4ff','#7b5dff']
  ];
  function avatarURL(i) {
    const [a, b] = AV_COLORS[((i % AV_COLORS.length) + AV_COLORS.length) % AV_COLORS.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='80' height='80' fill='url(%23g)'/></svg>`;
    return 'data:image/svg+xml;utf8,' + svg.replace(/#/g, '%23');
  }

  const CHAT_SVG     = `<svg class="ci" viewBox="0 0 24 24" fill="none"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 14.7 3.04 17.08 4.74 18.88L3.28 21.19C3.09 21.5 3.32 21.89 3.68 21.86L7.59 21.52C8.97 22.15 10.44 22.5 12 22.5" stroke="#fff" stroke-width="1.6"/><circle cx="8" cy="12" r="1.2" fill="#fff"/><circle cx="12" cy="12" r="1.2" fill="#fff"/><circle cx="16" cy="12" r="1.2" fill="#fff"/></svg>`;
  const HEART_SVG    = `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-9.6-9C1 9.1 2.6 6 5.8 6c1.9 0 3.2 1 4.2 2.3C11 7 12.3 6 14.2 6 17.4 6 19 9.1 17.6 12 15.5 16.4 12 21 12 21z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const BOOKMARK_SVG = `<svg class="ico" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16l-6-4-6 4V4z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  const CSS = `
    :host {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      box-sizing: border-box; pointer-events: none;   /* 余白は背面に通す */
      font-family: 'Figtree', -apple-system, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
    }
    .pill {
      pointer-events: auto;
      display: flex; align-items: center;
      height: 48px; border-radius: 42px;
      background: #303030; border: 1px solid rgba(255,255,255,0.15);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    }
    .comment { gap: 10px; padding: 0 16px; cursor: pointer; border-radius: 40px; }
    .comment .ci { width: 24px; height: 24px; flex-shrink: 0; }
    .comment .lbl { font-size: 16px; font-weight: 600; color: #fff; white-space: nowrap; }
    .avs { display: flex; align-items: center; }
    .avs img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; margin-left: -8px; border: 2px solid #303030; }
    .avs img:first-child { margin-left: 0; }
    .avs .more { margin-left: 6px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.75); white-space: nowrap; }
    .actions { overflow: visible; }       /* バースト粒子をはみ出させる */
    .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.2); flex-shrink: 0; }
    .fab {
      width: 48px; height: 48px; border-radius: 42px;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      position: relative; overflow: visible; background: transparent; border: 0;
    }
    .fab .ico { width: 24px; height: 24px; }
    .fab .lottie { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 72px; height: 72px; pointer-events: none; }
  `;

  class BwuActionBar extends HTMLElement {
    connectedCallback() {
      if (this._built) return; this._built = true;
      const label = this.getAttribute('label') || 'コメント';
      const avs = (this.getAttribute('avatars') ?? '0,2,4')
        .split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      const more = this.getAttribute('more') ?? '+3';

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>${CSS}</style>
        <div class="pill comment" part="comment" id="c">
          ${CHAT_SVG}
          <span class="lbl">${label}</span>
          ${avs.length ? `<span class="avs">${avs.map(i => `<img src="${avatarURL(i)}" alt="">`).join('')}${more ? `<span class="more">${more}</span>` : ''}</span>` : ''}
        </div>
        <div class="pill actions" part="actions">
          <div class="fab" id="h">${HEART_SVG}<div class="lottie" id="hl"></div></div>
          <div class="divider"></div>
          <div class="fab" id="b">${BOOKMARK_SVG}<div class="lottie" id="bl"></div></div>
        </div>
      `;
      root.getElementById('c').addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('comment', { bubbles: true, composed: true }));
      });
      this._toggle(root, 'h', 'hl', window.HEART_LOTTIE,    '#ff3e3e', 'heart');
      this._toggle(root, 'b', 'bl', window.BOOKMARK_LOTTIE, '#ffd133', 'bookmark');
    }

    _toggle(root, btnId, holderId, rawData, fillColor, name) {
      const btn = root.getElementById(btnId);
      const ico = btn.querySelector('.ico');
      let on = false;
      const emit = () => this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { on } }));

      if (window.lottie && rawData) {
        ico.style.display = 'none';
        const data = JSON.parse(JSON.stringify(rawData));
        try { data.layers[0].shapes[1].c.k = [1,1,1,1]; data.layers[2].shapes[1].c.k = [1,1,1,1]; } catch (e) {}
        const anim = window.lottie.loadAnimation({ container: root.getElementById(holderId), renderer: 'svg', loop: false, autoplay: false, animationData: data });
        anim.goToAndStop(0, true);
        const LIKE_START = 17, FILLED = 90, UNLIKE_START = 105;
        let busy = false;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (busy) return;
          if (!on) {
            on = true; busy = true; anim.goToAndPlay(LIKE_START, true);
            const f = (ev) => { if (ev.currentTime >= FILLED) { anim.pause(); anim.removeEventListener('enterFrame', f); busy = false; } };
            anim.addEventListener('enterFrame', f);
          } else {
            on = false; busy = true; anim.goToAndPlay(UNLIKE_START, true);
            anim.addEventListener('complete', () => { anim.goToAndStop(0, true); busy = false; }, { once: true });
          }
          emit();
        });
      } else {
        // Lottie 無し：静的SVGの塗りトグル
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          on = !on;
          ico.querySelector('path').setAttribute('fill', on ? fillColor : 'none');
          emit();
        });
      }
    }
  }
  customElements.define('bwu-action-bar', BwuActionBar);
})();
