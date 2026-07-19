/* ════════════════════════════════════════════════════════════════════
   collection 共通: 記事/概要欄のタイポグラフィ仕様（合成フォント FigtreeJP）
   このファイル1つで collection 内の記事・概要欄を連動更新する。

   仕様:
   - 合成フォント方式: 和文 Noto Sans JP は原寸、欧文 Figtree を 110.5% に拡大
     （x-height をわずかに上回る光学調整値。走り書きの英数字が小さく見えない）
   - 右上に「合成 ON/OFF」トグル（テスト用・PW解除後に表示・状態は保存）
   - 行間 / タグ中央 / 余白 gap を記事仕様に統一（記事=.article-*, 概要=.desc-*）

   使い方: 各ページ末尾に <script src="../font-spec.js"></script> を1行追加するだけ。
   ════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.__fontSpecLoaded) return;
  window.__fontSpecLoaded = true;

  // ── 1. フォント読み込み（Figtree + Noto Sans JP 400/600/700）──
  if (!document.querySelector('link[data-fontspec]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.fontspec = '1';
    link.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Noto+Sans+JP:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }

  // ── 2. 共通スタイル（合成・トグル・タイポ仕様）──
  var css = [
    // 和文=Noto / 欧文=Figtree（Noto を Hiragino より優先）
    "body{font-family:'Figtree','Noto Sans JP',sans-serif;}",
    // 合成: 欧文グリフだけ拡大（ON 時 110.5%）
    ".lat{font-size:calc(1em * var(--fig-scale,1));vertical-align:baseline;}",
    "html.compo{--fig-scale:1.105;}",
    // 拡大した欧文が和文より上に見えるのを、わずかに下げて光学的に馴染ませる（合成ON時のみ）
    "html.compo .lat{position:relative;top:var(--lat-drop,0.04em);}",
    // 記事＆概要 共通タイポ仕様（行間 / タグ中央 / gap）
    // 概要欄: 縦=.desc-sheet / LIVE=.detail-sheet / 横向き(landscape)=.ls-detail の3系統に対応
    ".article-body,.desc-sheet .desc-body,.detail-body,.ls-detail .desc-body{line-height:32px;}",
    ".article-title,.desc-sheet .desc-title,.detail-sheet .desc-title,.ls-detail .desc-title{line-height:35.6px;}",
    ".article-h2,.article-h3{line-height:34px;}",
    ".badge,.desc-sheet .desc-tag,.detail-sheet .desc-tag,.ls-detail .desc-tag{padding-bottom:2px;}", /* タグ内テキストを中央へ */
    ".article-inner{gap:20px;}",                            /* 記事: タイトル↔タグ↔本文 +4 */
    ".article-meta{gap:8px;}",                              /* 記事: 日付↔タイトル +4 */
    ".desc-sheet .desc-head,.detail-sheet .desc-head,.ls-detail .desc-head{margin-bottom:8px;}",   /* 概要: +4 */
    ".desc-sheet .desc-tags,.detail-sheet .desc-tags,.ls-detail .desc-tags{margin-bottom:20px;}",  /* 概要: +4 */
    // 右上トグル
    ".font-toggle{position:fixed;top:50px;right:12px;z-index:200;display:flex;align-items:center;gap:8px;" +
      "height:34px;padding:0 5px 0 12px;border-radius:20px;background:rgba(0,0,0,0.55);" +
      "backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.14);" +
      "font-size:12px;font-weight:600;color:#fff;cursor:pointer;-webkit-user-select:none;user-select:none;" +
      "-webkit-tap-highlight-color:transparent;font-family:'Figtree','Noto Sans JP',sans-serif;}",
    ".font-toggle .ft-sw{width:40px;height:24px;border-radius:14px;flex-shrink:0;background:rgba(255,255,255,0.22);" +
      "position:relative;transition:background .2s;}",
    ".font-toggle .ft-sw::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;" +
      "border-radius:50%;background:#fff;transition:transform .2s;}",
    "html.compo .font-toggle .ft-sw{background:linear-gradient(135deg,#812dff,#ff6739);}",
    "html.compo .font-toggle .ft-sw::after{transform:translateX(16px);}"
  ].join('\n');
  var style = document.createElement('style');
  style.dataset.fontspec = '1';
  style.textContent = css;
  document.head.appendChild(style);

  // ── 3. 欧文ランを .lat で包む（記事本体 + 概要欄）──
  var JP = /[　-ヿ㐀-鿿豈-﫿＀-￯‐-‧‰-⁯]/;
  function wrapLatin(root) {
    if (!root || root.dataset.latWrapped) return;
    root.dataset.latWrapped = '1';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      var p = n.parentNode;
      if (n.nodeValue && /\S/.test(n.nodeValue) && !(p && p.classList && p.classList.contains('lat'))) nodes.push(n);
    }
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment(), buf = '', mode = null;
      function flush() {
        if (!buf) return;
        if (mode === 'lat') { var s = document.createElement('span'); s.className = 'lat'; s.textContent = buf; frag.appendChild(s); }
        else { frag.appendChild(document.createTextNode(buf)); }
        buf = '';
      }
      var chars = Array.from(node.nodeValue);
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i], m;
        if (/\s/.test(ch)) m = mode || 'lat';
        else m = JP.test(ch) ? 'jp' : 'lat';
        if (m !== mode) { flush(); mode = m; }
        buf += ch;
      }
      flush();
      node.parentNode.replaceChild(frag, node);
    });
  }

  // ── 4. トグル設置 + 状態復元 ──
  function init() {
    document.querySelectorAll('.article-content, .desc-sheet, .detail-sheet, .ls-detail').forEach(wrapLatin);

    if (!document.querySelector('.font-toggle')) {
      var t = document.createElement('div');
      t.className = 'font-toggle';
      t.innerHTML = '<span class="ft-label"></span><span class="ft-sw"></span>';
      document.body.appendChild(t);
      var label = t.querySelector('.ft-label');
      var render = function () { label.textContent = document.documentElement.classList.contains('compo') ? '合成 ON' : '合成 OFF'; };
      var on = localStorage.getItem('figtreejp') !== '0'; // 既定 ON
      document.documentElement.classList.toggle('compo', on);
      render();
      t.addEventListener('click', function () {
        var now = document.documentElement.classList.toggle('compo');
        localStorage.setItem('figtreejp', now ? '1' : '0');
        render();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
