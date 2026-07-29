/* ============================================================================
   claude リポジトリ内の既存ページのタブバーを、260726 コンポーネントへ置き換える
   ----------------------------------------------------------------------------
   実行: node components/tabbar-260726/migrate-pages.mjs   (bwu 直下)

   対象は「実際に動くタブバーを持つページ」のみ:
     - badge/docs/checkin/index.html
     - badge/docs/collection/index.html
   ※ generator/book・generator/membership のタブバーは画像書き出し用の静止モック
     (${A.icHome.url} 等の画像を並べたもの)なので対象外。

   やること(各ページ):
     1. ページ内の旧タブバーCSSブロックを削除し、共有CSSへの <link> に置換
     2. <head> に lottie-web / lottie-icons.js / tabbar-adjust.js を追加
     3. 旧 <nav class="tabbar">…</nav> を新マークアップ(背景グラデ層+スクリム+バー)に置換
     4. </body> 直前に tabbar.js を追加
   ページ固有の CSS(例: #screenA.checking .tabbar{opacity:0})はそのまま残す。
   ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';

const DIST = 'badge/docs/tabbar/dist';
const markup = readFileSync(`${DIST}/tabbar.markup.html`, 'utf8')
  .replace(/^<!--[\s\S]*?-->\n/, '')   // 生成ヘッダーコメントは落とす
  .trim();

/** ページごとの設定 */
const targets = [
  {
    file: 'badge/docs/checkin/index.html',
    rel: '../tabbar/dist',                       // docs/checkin → docs/tabbar/dist
    cssStart: '  /* ===== TABBAR — reusable component (bwu/components/tabbar) ===== */',
    cssEnd: '  /* ============ fill-phase dim (no blur) ============ */',
    markupStart: '      <!-- TABBAR — reusable component (bwu/components/tabbar), Home active, center = More -->',
    markupEnd: '      </nav>',
    indent: '      ',
  },
  {
    file: 'badge/docs/collection/index.html',
    rel: '../tabbar/dist',                       // docs/collection → docs/tabbar/dist
    cssStart: '    /* ════════════ 下部タブバー（共通コンポーネント components/tabbar） ════════════ */',
    cssEnd: '    /* ===== END TABBAR CSS ===== */',
    cssEndKeep: false,                           // END マーカー行ごと削除する
    markupStart: '    <!-- ════ 下部タブバー（共通コンポーネント bwu/components/tabbar） ════ -->',
    markupEnd: '    </nav>',
    indent: '    ',
    // 旧ページには独自の Tabbar コントローラーが直書きされている。新JSと二重定義に
    // なるので削除する(setCenter は Moreメニュー実装に置き換わった)。
    dropBlockStart: '  <!-- ===== 共通タブバー JSコントローラ（bwu/components/tabbar より） ===== -->',
    dropBlockEnd: '  </script>',
  },
];

function headInjection(rel) {
  return `<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script src="${rel}/lottie-icons.js"></script>
<script src="${rel}/tabbar-adjust.js"></script>
<link rel="stylesheet" href="${rel}/tabbar.css">`;
}

for (const t of targets) {
  let s = readFileSync(t.file, 'utf8');
  const before = s.length;

  // ---- 0) ページ内に直書きされた旧コントローラーを削除 ----
  if (t.dropBlockStart && t.dropBlockEnd) {
    const i = s.indexOf(t.dropBlockStart);
    if (i < 0) throw new Error(`${t.file}: drop block start not found`);
    const j = s.indexOf(t.dropBlockEnd, i);
    if (j < 0) throw new Error(`${t.file}: drop block end not found`);
    s = s.slice(0, i) + s.slice(j + t.dropBlockEnd.length + 1);
  }

  // ---- 1) 旧CSSブロックを削除(マーカー間) ----
  if (t.cssStart && t.cssEnd) {
    const i = s.indexOf(t.cssStart);
    const j = s.indexOf(t.cssEnd);
    if (i < 0 || j < 0) throw new Error(`${t.file}: CSS marker not found`);
    const tail = t.cssEndKeep === false ? j + t.cssEnd.length + 1 : j;
    s = s.slice(0, i) +
        `  /* ===== TABBAR — components/tabbar-260726 (${t.rel}/tabbar.css) に移行済み。\n` +
        `     ページ固有の指定だけをここに置くこと ===== */\n\n` +
        s.slice(tail);
  }

  // ---- 2) head に依存を追加 ----
  if (!s.includes('tabbar-adjust.js')) {
    s = s.replace('</head>', `${headInjection(t.rel)}\n</head>`);
  }

  // ---- 3) 旧マークアップを新マークアップに置換 ----
  if (t.markupStart && t.markupEnd) {
    const i = s.indexOf(t.markupStart);
    if (i < 0) throw new Error(`${t.file}: markup start not found`);
    const j = s.indexOf(t.markupEnd, i);
    if (j < 0) throw new Error(`${t.file}: markup end not found`);
    const indented = markup.split('\n').map(l => t.indent + l).join('\n');
    s = s.slice(0, i) + indented + s.slice(j + t.markupEnd.length);
  }

  // ---- 4) tabbar.js を body 末尾に ----
  if (!s.includes(`${t.rel}/tabbar.js`)) {
    s = s.replace('</body>', `<script src="${t.rel}/tabbar.js"></script>\n</body>`);
  }

  writeFileSync(t.file, s);
  console.log(`migrated ${t.file}  ${before} -> ${s.length} bytes`);
}
