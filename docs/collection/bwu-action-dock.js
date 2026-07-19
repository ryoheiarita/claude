/* ════════════════════════════════════════════════════════════════════════
   <bwu-action-dock> — 下部アクションバーの「グラデ枠」共通コンポーネント
   通常記事・横動画系の下部ボタンの “位置の正” はこのコンポーネント。

   Figma: Renewal_UI_Design 9345-38216（iPhone 13/14・画面最下部に配置）
     ・高さ 88px のボックス
     ・padding 20px（上下左右）＝ iPhone の角丸を避けるための余白
     ・背景 = 黒の 0%→50% 縦グラデ（下ほど濃い）
     ・中身は space-between（左: コメントピル ／ 右: ♥🔖）

   中身の見た目・挙動（ピル/アバター/♥🔖 Lottie）は <bwu-action-bar> 側。
   このコンポーネントは「枠」だけを担当し、<bwu-action-bar> をスロットで包む。

   使い方:
     <script src="./bwu-action-bar.js"></script>
     <script src="./bwu-action-dock.js"></script>
     ...
     <bwu-action-dock class="action-bar">
       <bwu-action-bar id="actionBar" label="コメント" avatars="0,2,4"></bwu-action-bar>
     </bwu-action-dock>

   配置（fixed/absolute・bottom・width 等）は呼び出し側で指定する。
   :host は pointer-events:none（枠の余白タップは背面に通す）。中の
   <bwu-action-bar> のピルだけが pointer-events:auto。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  if (customElements.get('bwu-action-dock')) return;

  /* 実体は shadow 内の .box に置く。呼び出し側ページの CSS リセット
     （例 `* { padding:0 }`）は :host を上書きしてしまう（document のルールは
     :host より強い）が、shadow 内の要素には届かないので padding が守られる。 */
  const CSS = `
    :host { display: block; pointer-events: none; }  /* 余白は背面に通す */
    .box {
      box-sizing: border-box;
      width: 100%;                  /* host が flex 化されても（呼び出し側 CSS）枠幅いっぱいに */
      display: flex;
      align-items: center;
      height: 88px;                 /* Figma: 88px ボックス */
      padding: 20px;                /* 上下左右 20px（iPhone角丸ぶんの余白） */
      /* 黒 0% → 50% の縦グラデ（下ほど濃い） */
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%);
    }
    ::slotted(*) { width: 100%; }   /* 中の <bwu-action-bar> を枠内いっぱいに */
  `;

  class BwuActionDock extends HTMLElement {
    connectedCallback() {
      if (this._built) return; this._built = true;
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style><div class="box"><slot></slot></div>`;
    }
  }
  customElements.define('bwu-action-dock', BwuActionDock);
})();
