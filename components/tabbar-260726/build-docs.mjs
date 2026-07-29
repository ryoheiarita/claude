/* ============================================================================
   tabbar 260726 — 公開ページ(badge/docs/tabbar/)をコンポーネントから生成する
   ----------------------------------------------------------------------------
   実行: node components/tabbar-260726/build-docs.mjs   (bwu 直下から)

   やること:
     1) index.html の3ブロック(BEGIN/END TABBAR CSS・MARKUP・BEGIN/END TABBAR JS)を抽出
     2) docs-template.html に流し込んで badge/docs/tabbar/index.html を生成(デモ)
     3) handoff.html(仕様書)の TABBAR_PREVIEW マーカー間に同じ3ブロックを差し込み
        → 仕様書上部の「タブバーのみプレビュー」が常にコンポーネントと一致する
     4) tabbar-adjust.js(確定値)と flutter/tab_bar_260726.dart を公開ページへコピー

   ※ zip の再生成だけはシェル側で行う(build-docs.sh 参照)
   ========================================================================== */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';

const COMP = 'components/tabbar-260726';
const DOCS = 'badge/docs/tabbar';
const DIST = `${COMP}/dist`;          // 他プロジェクト/他セッションへ持ち出す一式

const src = readFileSync(`${COMP}/index.html`, 'utf8');

/** BEGIN/END マーカーのコメントブロックに挟まれた中身を取り出す */
function extract(startMark, endMark) {
  const i = src.indexOf(startMark);
  const j = src.indexOf(endMark);
  if (i < 0 || j < 0) throw new Error(`marker missing: ${startMark}`);
  return src.slice(src.indexOf('*/', i) + 2, src.lastIndexOf('/*', j)).trim();
}

const css = extract('*  BEGIN TABBAR CSS', '*  END TABBAR CSS');
const js = extract('*  BEGIN TABBAR JS', '*  END TABBAR JS');
const markup = src
  .slice(src.indexOf('-->', src.indexOf('===== MARKUP:')) + 3,
         src.indexOf('<!-- ===== /MARKUP ===== -->'))
  .trim();

// 抜き出しミスの早期検知(構造が変わったら気づけるように)
const guards = [
  ['css', css, '.tabbar{'], ['css', css, 'has-selection'], ['css', css, 'is-offscreen'],
  ['js', js, 'window.Tabbar'], ['js', js, 'function enter()'], ['js', js, 'function selectMore'],
  ['markup', markup, 'class="tabbar"'], ['markup', markup, 'more-selected'], ['markup', markup, 'tabbar-bg__blur'],
];
for (const [name, text, needle] of guards) {
  if (!text.includes(needle)) throw new Error(`${name} block looks wrong (missing: ${needle})`);
}

/* ---- 1) デモページ ---- */
const template = readFileSync(`${COMP}/docs-template.html`, 'utf8');
const demo = template
  .replace('@TABBAR_CSS@', css)
  .replace('@TABBAR_MARKUP@', markup.split('\n').map(l => '    ' + l).join('\n'))
  .replace('@TABBAR_JS@', js);
if (demo.includes('@TABBAR_')) throw new Error('template placeholder left unreplaced');
writeFileSync(`${DOCS}/index.html`, demo);

/* ---- 2) 仕様書の上部プレビュー ---- */
const HANDOFF = `${DOCS}/handoff.html`;
let handoff = readFileSync(HANDOFF, 'utf8');
/** <!-- TABBAR_PREVIEW:NAME --> … <!-- /TABBAR_PREVIEW:NAME --> の中身を差し替える */
function inject(html, name, body) {
  const open = `<!-- TABBAR_PREVIEW:${name} -->`;
  const close = `<!-- /TABBAR_PREVIEW:${name} -->`;
  const i = html.indexOf(open);
  const j = html.indexOf(close);
  if (i < 0 || j < 0) throw new Error(`handoff marker missing: ${name}`);
  return html.slice(0, i + open.length) + '\n' + body + '\n' + html.slice(j);
}
handoff = inject(handoff, 'CSS', css);
handoff = inject(handoff, 'MARKUP', markup);
handoff = inject(handoff, 'JS', js);
writeFileSync(HANDOFF, handoff);

/* ---- 2.5) 移行済みページのマークアップを同期 ----
   checkin / collection のようにコンポーネントを埋め込んだページは、
   <!-- TABBAR:MARKUP --> … <!-- /TABBAR:MARKUP --> の中身を毎回入れ替える。
   これが無いと、ラベル変更などが埋め込み先に反映されず取り残される。 */
const embedded = [
  { file: 'badge/docs/checkin/index.html', indent: '      ' },
  { file: 'badge/docs/collection/index.html', indent: '    ' },
];
for (const page of embedded) {
  let html = readFileSync(page.file, 'utf8');
  const open = '<!-- TABBAR:MARKUP';
  const close = '<!-- /TABBAR:MARKUP -->';
  const i = html.indexOf(open);
  const j = html.indexOf(close);
  if (i < 0 || j < 0) { console.warn(`! ${page.file}: TABBAR:MARKUP マーカー無し(スキップ)`); continue; }
  const openEnd = html.indexOf('-->', i) + 3;
  const body = markup.split('\n').map(l => page.indent + l).join('\n');
  html = html.slice(0, openEnd) + '\n' + body + '\n' + page.indent + html.slice(j);
  writeFileSync(page.file, html);
  console.log(`  synced markup -> ${page.file}`);
}

/* ---- 3) 確定値と Dart を公開ページへ ---- */
copyFileSync(`${COMP}/tabbar-adjust.js`, `${DOCS}/tabbar-adjust.js`);
copyFileSync(`${COMP}/lottie-icons.js`, `${DOCS}/lottie-icons.js`);
copyFileSync(`${COMP}/flutter/tab_bar_260726.dart`, `${DOCS}/assets/tab_bar_260726.dart`);

/* ---- 4) dist/ — 他プロジェクト・他セッションへ持ち出す一式 ---- */
mkdirSync(DIST, { recursive: true });
writeFileSync(`${DIST}/tabbar.css`,
  `/* tabbar 260726 — component CSS (generated from index.html / 編集しない) */\n${css}\n`);
writeFileSync(`${DIST}/tabbar.markup.html`,
  `<!-- tabbar 260726 — markup (generated / 編集しない).\n` +
  `     置き場所: position:relative な親の直下。スクリム→バーの順で入れる -->\n${markup}\n`);
writeFileSync(`${DIST}/tabbar.js`,
  `/* tabbar 260726 — controller (generated from index.html / 編集しない)\n` +
  `   要: lottie-web, lottie-icons.js, tabbar-adjust.js を先に読み込むこと */\n${js}\n`);
copyFileSync(`${COMP}/tabbar-adjust.js`, `${DIST}/tabbar-adjust.js`);
copyFileSync(`${COMP}/lottie-icons.js`, `${DIST}/lottie-icons.js`);

// 動く最小サンプル(このファイルを開けば dist だけで動くことが確認できる)
writeFileSync(`${DIST}/example.html`, `<!DOCTYPE html>
<!-- tabbar 260726 — dist だけで動く最小サンプル(generated / 編集しない) -->
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>tabbar 260726 — example</title>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
<script src="lottie-icons.js"></script>
<script src="tabbar-adjust.js"></script>
<link rel="stylesheet" href="tabbar.css">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#050505;display:flex;align-items:center;justify-content:center;min-height:100vh;
       font-family:'Figtree','Hiragino Sans','Noto Sans JP',sans-serif;color:#fff;}
  /* ★ タブバーの親は position:relative(バーは absolute / bottom:24px 中央寄せ) */
  .screen{position:relative;width:390px;height:500px;border-radius:24px;overflow:hidden;background:#101010;}
  .screen p{padding:24px 16px;font-size:16px;line-height:32px;color:rgba(255,255,255,.7);}
</style>
</head>
<body>
  <div class="screen">
    <p>タブバーの背後に敷くコンテンツ。バーの背面ぼかしと、More 展開時の背景グラデーション/ぼかしがこの文字の上で確認できる。</p>
${markup.split('\n').map(l => '    ' + l).join('\n')}
  </div>
<script src="tabbar.js"></script>
</body>
</html>
`);

const usage = `# tabbar 260726 — 他プロジェクト / 他セッションで使う

**このフォルダ(dist)は自動生成。編集しても次のビルドで上書きされる。**
直すときは \`components/tabbar-260726/index.html\`(本体)を直して
\`node components/tabbar-260726/build-docs.mjs\` を実行する。

## 何が入っているか
| ファイル | 中身 |
|---|---|
| \`tabbar.css\` | コンポーネントのCSS(box-sizing ガード・出現アニメ・More展開・背景グラデを含む) |
| \`tabbar.markup.html\` | \`<nav class="tabbar">\` 一式(背景グラデ層 + スクリム + バー + Moreメニュー) |
| \`tabbar.js\` | コントローラー(\`window.Tabbar\`) |
| \`tabbar-adjust.js\` | **確定した微調整値**。これが無いとアイコンのサイズ/位置指定が外れる |
| \`lottie-icons.js\` | アイコン7つの Lottie を \`window.TABBAR_ICONS\` にインライン(file:// でも動く) |
| \`example.html\` | dist だけで動く最小サンプル(まずこれを開いて確認) |

## 組み込み手順(4ステップ)
1. \`dist\` の5ファイルをコピーする。
2. \`<head>\` で読み込む(**この順番**):
   \`\`\`html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
   <script src="lottie-icons.js"></script>
   <script src="tabbar-adjust.js"></script>
   <link rel="stylesheet" href="tabbar.css">
   \`\`\`
3. \`tabbar.markup.html\` の中身を、**position:relative な親**の直下に貼る。
4. \`</body>\` の直前で \`<script src="tabbar.js"></script>\`。

## JS API
| 呼び出し | 動作 |
|---|---|
| \`Tabbar.setActive(i)\` | バーのタブを選択(0=Home 1=Poppin' 3=Shop 4=Mypage)。Moreの選択は解除され、展開中なら閉じる |
| \`Tabbar.openMore()\` / \`closeMore()\` / \`toggleMore()\` | Moreメニューの開閉 |
| \`Tabbar.selectMore(key)\` | 'checkin' / 'gallery' / 'calendar' を選択(中央Moreが白背景+そのアイコン+ラベルに) |
| \`Tabbar.clearSelection()\` / \`Tabbar.selected\` | 選択の解除 / 現在の選択キー |
| \`Tabbar.enter()\` | 出現アニメ(下から遅れて ease-out + 4アイコン再生)を再生 |
| \`Tabbar.ENTER\` | 出現のタイミング \`{delay:400, iconLeadIn:380, iconStagger:70}\` |
| \`Tabbar.play(key)\` | 任意アイコンの Lottie を1回再生 |

遷移は自前で: サテライトの click で \`Tabbar.selectMore(key)\` が走るので、
\`document.querySelectorAll('.more-item')\` に自分の遷移処理を足す。

## 触ってはいけない所(壊れる)
- \`box-sizing:border-box\`(CSS先頭のガード) … 無いとバーが78pxに膨らみ**中央ボタンのはみ出しが消える**。
- バーのぼかしは \`.tabbar::before\` に置く … \`.tabbar\` 本体に置くと内側(More丸/サテライト)のぼかしが死ぬ。
- バーを動かすときは \`bottom\` … \`transform\`/\`opacity\` で動かすと**動作中だけぼかしが消える**。
- \`.tab-item__lottie\` の \`display:block\` … span のままだと transform が描画に効かない。
- \`z-index\`: 背景グラデ 4 < スクリム 5 < バー 6。

## Flutter
\`components/tabbar-260726/flutter/tab_bar_260726.dart\` と \`assets/\`(Lottie7 + ic_hana.svg)を渡す。
仕様書: \`badge/docs/tabbar/handoff.html\`(公開ページ)。
`;
writeFileSync(`${DIST}/README.md`, usage);

// 公開ページからもダウンロードできるように docs 側へも配る
mkdirSync(`${DOCS}/dist`, { recursive: true });
for (const f of ['tabbar.css', 'tabbar.markup.html', 'tabbar.js', 'tabbar-adjust.js',
                 'lottie-icons.js', 'example.html', 'README.md']) {
  copyFileSync(`${DIST}/${f}`, `${DOCS}/dist/${f}`);
}

console.log(`built: ${DOCS}/index.html (${demo.length}b) / handoff preview / dist(7 files) / adjust+lottie+dart copied`);
