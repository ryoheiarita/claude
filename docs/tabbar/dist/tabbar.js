/* tabbar 260726 — controller (generated from index.html / 編集しない)
   要: lottie-web, lottie-icons.js, tabbar-adjust.js を先に読み込むこと */
window.Tabbar = (function(){
  const root = document.getElementById('tabbar');
  if(!root) return {};
  const scrim = document.getElementById('tabbarScrim');
  const bg = document.getElementById('tabbarBg');
  const items = Array.from(root.querySelectorAll('.tabbar__row .tab-item'));
  const moreItems = Array.from(root.querySelectorAll('.more-item'));
  const ICON_ALIAS = { poppin: 'talk' };   // data-key -> TABBAR_ICONS key
  const anims = {};   // key -> lottie animation (bar tabs + satellites)
  const starts = {};  // key -> first frame with actual motion (skip baked-in dead time)
  // iconsax の Lottie は冒頭に 160〜534ms の無動作フレームが焼き込まれている。
  // 最初のキーフレーム時刻を走査し、クリック時はそこから再生 = 即動き出す。
  function firstMotionFrame(data){
    let min = Infinity;
    (function walk(o){
      if (Array.isArray(o)){ o.forEach(walk); return; }
      if (o && typeof o === 'object'){
        if (o.a === 1 && Array.isArray(o.k) && o.k.length && typeof o.k[0].t === 'number')
          min = Math.min(min, o.k[0].t);
        for (const k in o) walk(o[k]);
      }
    })(data);
    return isFinite(min) ? min : 0;
  }
  [...items, ...moreItems].forEach(el => {
    const key = el.dataset.key;
    const holder = el.querySelector('.tab-item__lottie');
    if (!holder) return;   // center More = static HANA svg
    const data = window.TABBAR_ICONS[ICON_ALIAS[key] || key];
    starts[key] = firstMotionFrame(data);
    anims[key] = lottie.loadAnimation({
      container: holder,
      renderer: 'svg', loop: false, autoplay: false,
      animationData: data,
    });
  });
  function play(key){ const a = anims[key]; if(!a) return; a.goToAndPlay(starts[key] || 0, true); }

  /* ---- Moreメニューの選択状態 ----
     どれかを選ぶと中央Moreが「白背景 + 選んだアイコン(黒) + そのラベル」になる。
     バーのタブを押すと解除して通常の More に戻る。 */
  const centerBtn   = root.querySelector('.tab-item.is-center');
  const centerLabel = centerBtn && centerBtn.querySelector('.tab-item__label');
  const centerSlot  = centerBtn && centerBtn.querySelector('.more-selected');
  const CENTER_LABEL_DEFAULT = centerLabel ? centerLabel.textContent : 'More';
  let centerAnim = null, selectedKey = null;

  function clearSelection(){
    if (!selectedKey) return;
    selectedKey = null;
    root.classList.remove('has-selection');
    if (centerLabel) centerLabel.textContent = CENTER_LABEL_DEFAULT;
    if (centerAnim){ centerAnim.destroy(); centerAnim = null; }
    if (centerSlot) centerSlot.innerHTML = '';
  }
  function selectMore(key){
    const el = moreItems.find(e => e.dataset.key === key);
    if (!el || !centerSlot) return;
    selectedKey = key;
    items.forEach(it => it.classList.remove('active'));   // バー側のタブは非アクティブへ
    root.classList.add('has-selection');
    if (centerLabel) centerLabel.textContent = el.querySelector('.more-item__label').textContent;
    // 中央に選択アイコンを載せ替え(白ストロークは CSS の invert で黒くなる)
    if (centerAnim) centerAnim.destroy();
    centerSlot.innerHTML = '';
    const adj = (window.TABBAR_ADJUST && window.TABBAR_ADJUST.items && window.TABBAR_ADJUST.items[key]) || {};
    centerSlot.style.setProperty('--adj-x', (adj.dx || 0) + 'px');
    centerSlot.style.setProperty('--adj-y', (adj.dy || 0) + 'px');
    centerSlot.style.setProperty('--adj-s', (adj.s == null ? 1 : adj.s));
    centerAnim = lottie.loadAnimation({
      container: centerSlot, renderer:'svg', loop:false, autoplay:false,
      animationData: window.TABBAR_ICONS[ICON_ALIAS[key] || key],
    });
    centerAnim.goToAndPlay(starts[key] || 0, true);      // 選択時に1回再生
  }

  function setActive(i){
    closeMore();        // 展開中にバーのタブを触ったら閉じる
    clearSelection();   // バーのタブを選んだら More の選択は解除
    // center More keeps its checkin_motion look (label stays 50%) — never gets .active
    items.forEach((el, idx) => el.classList.toggle('active', idx === i && !el.classList.contains('is-center')));
    const key = items[i] && items[i].dataset.key;
    if (key) play(key);
  }
  function openMore(){
    root.classList.add('more-open');
    if (scrim) scrim.classList.add('on');
    if (bg) bg.classList.add('open');
    // play in sync with each satellite's pop (CSS transition-delay: mid 0s / sides .03s/.06s)
    const POP_DELAY = [30, 0, 60];
    moreItems.forEach((el, i) => setTimeout(() => play(el.dataset.key), POP_DELAY[i] ?? i * 40));
  }
  function closeMore(){
    root.classList.remove('more-open');
    if (scrim) scrim.classList.remove('on');
    if (bg) bg.classList.remove('open');
  }
  function toggleMore(){ root.classList.contains('more-open') ? closeMore() : openMore(); }
  /* 確定した微調整値(tabbar-adjust.js)を適用 — これが無いと調整値は
     localStorage 内にしか存在せず、公開ページでは反映されない(= 指定が外れる)。 */
  function applyAdjust(a){
    if (!a) return;
    if (a.global){
      const g = a.global, r = document.documentElement.style;
      if (g.circle != null) r.setProperty('--more-circle', g.circle + 'px');
      if (g.pitch  != null) r.setProperty('--more-pitch',  g.pitch  + 'px');
      if (g.drop   != null) r.setProperty('--more-drop',   g.drop   + 'px');
      if (g.mgap   != null) r.setProperty('--more-gap',    g.mgap   + 'px');
    }
    if (a.items){
      Object.keys(a.items).forEach(key => {
        const v = a.items[key];
        const holder = root.querySelector('[data-key="' + key + '"] .tab-item__icon');
        if (!holder || !v) return;
        holder.style.setProperty('--adj-x', (v.dx || 0) + 'px');
        holder.style.setProperty('--adj-y', (v.dy || 0) + 'px');
        holder.style.setProperty('--adj-s', (v.s == null ? 1 : v.s));
      });
    }
  }
  applyAdjust(window.TABBAR_ADJUST);

  /* ---- 出現アニメ: 画面下から遅れて ease-out でせり上がり、
          到着に合わせてバーの4アイコンを1回ずつ再生する ---- */
  const ENTER = {
    delay:      400,   // ページ表示 -> 動き出すまでの「遅れ」
    iconLeadIn: 380,   // 動き出し -> アイコン再生開始(バーがほぼ定位置に来た頃)
    iconStagger: 70,   // アイコン間のずれ(0 にすると4つ同時)
  };
  let enterTimers = [];
  function enter(){
    enterTimers.forEach(clearTimeout); enterTimers = [];
    root.classList.add('is-offscreen');
    void root.offsetWidth;                       // reflow: transition:none を確定させる
    enterTimers.push(setTimeout(() => {
      root.classList.remove('is-offscreen');     // bottom -110px -> 24px (ease-out)
      // 到着に合わせて初期状態の4アイコンを1回再生(左から順)
      items.filter(el => el.dataset.key && !el.classList.contains('is-center'))
        .forEach((el, i) => enterTimers.push(setTimeout(
          () => play(el.dataset.key), ENTER.iconLeadIn + i * ENTER.iconStagger)));
    }, ENTER.delay));
  }
  enter();   // 読み込み時に自動再生

  const isAdjusting = () => document.body.classList.contains('adjusting');
  items.forEach((el, idx) => el.addEventListener('click', () => {
    if (el.classList.contains('is-center')) { toggleMore(); return; } // works in adjust mode too
    if (isAdjusting()) return;   // adjust tool owns item clicks
    setActive(idx);
  }));
  moreItems.forEach(el => el.addEventListener('click', () => {
    if (isAdjusting()) return;
    selectMore(el.dataset.key);   // 中央Moreに反映(白背景+アイコン+ラベル)
    closeMore();                  // 選んだらメニューを閉じる
    // 実装時はここで画面遷移
  }));
  if (scrim) scrim.addEventListener('click', closeMore);
  return { setActive, play, openMore, closeMore, toggleMore, applyAdjust, enter, ENTER,
           selectMore, clearSelection, get selected(){ return selectedKey; },
           items, moreItems, anims };
})();
