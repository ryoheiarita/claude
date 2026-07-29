/* ============================================================================
   tabbar 260726 — 記事用スクリーンショットを実物から生成する
   ----------------------------------------------------------------------------
   実行: node components/tabbar-260726/capture-shots.mjs   (bwu 直下 / 要 bwu-static)

   コンポーネント本体(components/tabbar-260726/index.html)を実際に表示し、
   ①通常 ②More展開 ③選択中 の3状態を撮って badge/docs/tabbar/assets/ に保存する。
   記事の図版が「実装と絶対にズレない」ようにするための手順。
   ※ puppeteer は badge/node_modules のものを使う。
   ========================================================================== */
import { createRequire } from 'node:module';

const require = createRequire('/Users/rick/claude/bwu/badge/');
const puppeteer = require('puppeteer');

const URL = 'http://localhost:8931/components/tabbar-260726/';
const OUT = 'badge/docs/tabbar/assets';
const W = 390, H = 300;                 // 記事の図版比率(382/240)に近い横長
const DPR = 3;                          // Retina 相当で書き出す

const shots = [
  { file: 'shot-default.png', label: '通常', setup: async page => {
      await page.evaluate(() => { Tabbar.clearSelection(); Tabbar.closeMore(); Tabbar.setActive(0); });
    } },
  { file: 'shot-opened.png', label: 'More展開', setup: async page => {
      await page.evaluate(() => { Tabbar.clearSelection(); Tabbar.setActive(0); Tabbar.openMore(); });
    } },
  { file: 'shot-selected.png', label: '選択中', setup: async page => {
      await page.evaluate(() => { Tabbar.closeMore(); Tabbar.selectMore('calendar'); });
    } },
];

const browser = await puppeteer.launch({ args: ['--force-device-scale-factor=3'] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
await page.goto(URL, { waitUntil: 'networkidle0' });

// 記事の図版として撮るので、ツール(微調整ボタン)とプレビュー枠の飾りは消す。
// バーの背後に本文が来る見え方を再現するため、サンプルの本文を敷く。
await page.evaluate(() => {
  document.getElementById('modeBtn')?.remove();
  const prev = document.querySelector('.preview');
  prev.style.cssText = 'position:relative;width:390px;height:300px;border-radius:0;overflow:hidden;background:#101010';
  const text = document.createElement('div');
  text.style.cssText = `position:absolute;inset:0;padding:20px 16px;
    font:400 16px/32px 'Figtree','Hiragino Sans','Noto Sans JP',sans-serif;color:rgba(255,255,255,.72);`;
  text.innerHTML = `<div style="font:700 20px/34px inherit;color:#fff;margin-bottom:8px">More を押すと、背景が沈む</div>
    中央の More をタップすると丸が白へ反転し、バーの上に3つのメニューが展開する。
    同時に背景のグラデーションが切り替わり、上に向かって消えていくぼかしがかかる。
    この文字のぼけ方で blur が効いているかを確認できる。`;
  prev.insertBefore(text, prev.firstChild);
  document.body.style.background = '#101010';
});
// 出現アニメを終わらせてから撮る
await page.evaluate(() => Tabbar.enter());
await new Promise(r => setTimeout(r, 1400));

const el = await page.$('.preview');
for (const s of shots) {
  await s.setup(page);
  await new Promise(r => setTimeout(r, 900));   // 展開/選択のアニメ収束を待つ
  await el.screenshot({ path: `${OUT}/${s.file}` });
  console.log(`captured ${s.file} (${s.label})`);
}

await browser.close();
