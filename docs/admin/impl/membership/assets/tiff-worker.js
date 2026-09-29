/* TIFF → PNG 変換ワーカー（重い処理をメインスレッドから逃がしてUIを固まらせない） */
'use strict';
importScripts('pako.min.js', 'utif.js', 'tiff-convert.js');

self.onmessage = function (e) {
  var d = e.data || {};
  TiffConvert.run(d.buffer, d.opts, function (p, label) {
    self.postMessage({ type: 'progress', p: p, label: label });
  }).then(function (r) {
    self.postMessage({
      type: 'done', blob: r.blob, width: r.width, height: r.height,
      pages: r.pages, source: r.source
    });
  }).catch(function (err) {
    self.postMessage({ type: 'error', message: String((err && err.message) || err) });
  });
};

// スクリプトが問題なく読めたことをメインスレッドへ通知（これが来ない＝ワーカー不可でフォールバック）
self.postMessage({ type: 'ready' });
