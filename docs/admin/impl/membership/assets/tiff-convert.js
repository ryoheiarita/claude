/* TIFF → PNG 変換パイプライン（ワーカー／メインスレッド両対応）
   依存: pako.min.js, utif.js（先に読み込むこと）
   使い方: TiffConvert.run(arrayBuffer, opts, onProgress) -> Promise<{blob,width,height,pages,source}>
   opts: { maxEdge, maxBytes, minEdge, yield } — yield は各ステップ間で await される関数
         （メインスレッドで動かすとき、プログレスバーを描画させるために使う） */
(function (root) {
  'use strict';

  var DEF = { maxEdge: 1600, maxBytes: 5 * 1024 * 1024, minEdge: 480 };

  var hasOffscreen = (typeof OffscreenCanvas !== 'undefined') &&
    typeof OffscreenCanvas.prototype.convertToBlob === 'function';

  function mkCanvas(w, h) {
    if (hasOffscreen) return new OffscreenCanvas(w, h);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function toBlob(canvas) {
    if (canvas.convertToBlob) return canvas.convertToBlob({ type: 'image/png' });
    return new Promise(function (res, rej) {
      canvas.toBlob(function (b) { b ? res(b) : rej(new Error('PNG の書き出しに失敗しました')); }, 'image/png');
    });
  }

  /* 最大画素数のページ（IFD）を選ぶ。サムネイル用の縮小ページは避ける */
  function pickPage(ifds) {
    var best = ifds[0], bestArea = -1;
    for (var i = 0; i < ifds.length; i++) {
      var d = ifds[i];
      var w = (d.t256 && d.t256[0]) || d.width || 0;
      var h = (d.t257 && d.t257[0]) || d.height || 0;
      var reduced = d.t254 && (d.t254[0] & 1);   // SubfileType bit0 = reduced resolution
      var area = w * h * (reduced ? 0.001 : 1);
      if (area > bestArea) { bestArea = area; best = d; }
    }
    return best;
  }

  /* 半分ずつ段階的に縮小してジャギ・モアレを防ぐ */
  function downscale(src, tw, th) {
    var cw = src.width, ch = src.height, cur = src;
    while (cw > tw * 2 && ch > th * 2) {
      var nw = Math.max(tw, Math.round(cw / 2)), nh = Math.max(th, Math.round(ch / 2));
      var next = mkCanvas(nw, nh), g = next.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(cur, 0, 0, nw, nh);
      cur = next; cw = nw; ch = nh;
    }
    if (cw === tw && ch === th) return cur;
    var out = mkCanvas(tw, th), ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, tw, th);
    return out;
  }

  function fitEdge(w, h, maxEdge) {
    var k = Math.min(1, maxEdge / Math.max(w, h));
    return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
  }

  function run(buffer, opts, onProgress) {
    opts = opts || {};
    var maxEdge = opts.maxEdge || DEF.maxEdge;
    var maxBytes = opts.maxBytes || DEF.maxBytes;
    var minEdge = opts.minEdge || DEF.minEdge;
    var pr = onProgress || function () {};
    var brk = opts['yield'] || function () {};

    // 進捗を出す → 描画の隙を与える → 重い処理を実行
    function step(p, label, fn) {
      return function (prev) {
        pr(p, label);
        return Promise.resolve(brk()).then(function () { return fn(prev); });
      };
    }

    var ifds, ifd, full, srcW, srcH;

    return Promise.resolve()
      .then(step(0.28, 'TIFF を解析中…', function () {
        ifds = UTIF.decode(buffer);
        if (!ifds || !ifds.length) throw new Error('TIFF のページが見つかりません');
        ifd = pickPage(ifds);
      }))
      .then(step(0.38, 'TIFF をデコード中…', function () {
        UTIF.decodeImage(buffer, ifd, ifds);
      }))
      .then(step(0.58, '画素を展開中…', function () {
        var rgba = UTIF.toRGBA8(ifd);
        srcW = ifd.width; srcH = ifd.height;
        if (!srcW || !srcH) throw new Error('画像サイズを取得できませんでした');
        full = mkCanvas(srcW, srcH);
        full.getContext('2d').putImageData(
          new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, srcW * srcH * 4), srcW, srcH), 0, 0);
      }))
      .then(step(0.72, '長辺 ' + maxEdge + 'px に縮小中…', function () {
        var dim = fitEdge(srcW, srcH, maxEdge);
        return downscale(full, dim[0], dim[1]);
      }))
      .then(step(0.86, 'PNG を書き出し中…', function (cv) {
        var tries = 0;
        function encode(canvas) {
          return toBlob(canvas).then(function (blob) {
            var atFloor = Math.max(canvas.width, canvas.height) <= minEdge;
            if (blob.size <= maxBytes || tries >= 4 || atFloor) {
              return {
                blob: blob, width: canvas.width, height: canvas.height,
                pages: ifds.length, source: { w: srcW, h: srcH }
              };
            }
            tries++;
            // 面積比から目標寸法を割り出す（1回あたり最大25%縮小）
            var k = Math.max(0.75, Math.sqrt(maxBytes / blob.size));
            var nw = Math.max(minEdge, Math.round(canvas.width * k));
            var nh = Math.max(1, Math.round(canvas.height * (nw / canvas.width)));
            pr(0.9, Math.round(maxBytes / 1048576) + 'MB に収まるよう再圧縮中…（' + nw + 'px）');
            return Promise.resolve(brk()).then(function () { return encode(downscale(full, nw, nh)); });
          });
        }
        return encode(cv);
      }));
  }

  root.TiffConvert = { run: run, defaults: DEF };
})(typeof self !== 'undefined' ? self : this);
