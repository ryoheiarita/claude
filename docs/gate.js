/* Simple client-side password gate for the static prototype site.
   NOTE: This is a lightweight access lock for a static GitHub Pages site,
   not real server-side security. Anyone can read the source. It just keeps
   the prototypes from being casually viewable. */
(function () {
  var PASSWORD = 'bwithu123!';
  var KEY = 'bwu_auth';

  if (sessionStorage.getItem(KEY) === '1') return;

  // Hide page content until unlocked (overlay stays visible).
  var style = document.createElement('style');
  style.textContent =
    'body > *:not(#bwu-gate){visibility:hidden !important;}' +
    '#bwu-gate{position:fixed;inset:0;z-index:2147483647;display:flex;' +
    'align-items:center;justify-content:center;background:#0a0a0a;' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
    '#bwu-gate .box{width:100%;max-width:320px;padding:0 24px;text-align:center;}' +
    '#bwu-gate h1{color:rgba(255,255,255,.35);font-size:13px;font-weight:600;' +
    'letter-spacing:.12em;text-transform:uppercase;margin:0 0 20px;}' +
    '#bwu-gate input{width:100%;box-sizing:border-box;padding:14px 16px;' +
    'border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);' +
    'color:#fff;font-size:16px;outline:none;text-align:center;}' +
    '#bwu-gate input:focus{border-color:rgba(255,255,255,.4);}' +
    '#bwu-gate button{width:100%;margin-top:12px;padding:14px;border:none;border-radius:12px;' +
    'background:#fff;color:#0a0a0a;font-size:15px;font-weight:700;cursor:pointer;}' +
    '#bwu-gate .err{color:#ff6b6b;font-size:13px;min-height:18px;margin-top:12px;}';
  (document.head || document.documentElement).appendChild(style);

  function build() {
    var gate = document.createElement('div');
    gate.id = 'bwu-gate';
    gate.innerHTML =
      '<div class="box">' +
      '<h1>BWITHU Prototypes</h1>' +
      '<input id="bwu-pw" type="password" placeholder="パスワード" autocomplete="current-password" autofocus>' +
      '<button id="bwu-go">入る</button>' +
      '<div class="err" id="bwu-err"></div>' +
      '</div>';
    document.body.appendChild(gate);

    var input = gate.querySelector('#bwu-pw');
    var err = gate.querySelector('#bwu-err');

    function submit() {
      if (input.value === PASSWORD) {
        sessionStorage.setItem(KEY, '1');
        gate.remove();
        style.remove();
      } else {
        err.textContent = 'パスワードが違います';
        input.value = '';
        input.focus();
      }
    }

    gate.querySelector('#bwu-go').addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
    input.focus();
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
