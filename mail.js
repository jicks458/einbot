// 메일 주소를 누르면 주소를 복사한다 (컴퓨터에서만).
// 컴퓨터에서는 메일 링크가 Outlook 같은 메일 프로그램을 띄우는데, 네이버 메일·Gmail 을 웹으로 쓰는 사람에게는 쓸모가 없다.
// 휴대폰은 메일 앱이 바로 열리는 편이 편하므로 그대로 둔다. 복사가 안 되는 브라우저도 원래대로 메일 프로그램을 연다.
(function () {
  if (!window.matchMedia || matchMedia('(pointer: coarse)').matches) return;
  var links = document.querySelectorAll('a[href^="mailto:"]');
  for (var i = 0; i < links.length; i++) links[i].title = '누르면 메일 주소를 복사합니다';

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
    if (!a) return;
    var addr = a.getAttribute('href').slice(7).split('?')[0];
    e.preventDefault();
    var done = function () { say(a, '메일 주소를 복사했습니다'); };
    var fallback = function () { if (oldCopy(addr)) done(); else location.href = a.href; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done, fallback);
    else fallback();
  });

  // 새 방식이 막힌 브라우저용 (입력 칸을 잠깐 만들어 복사)
  function oldCopy(text) {
    var t = document.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(t);
    t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    t.remove();
    return ok;
  }

  // 주소 바로 아래에 작은 말풍선으로 알린다 (글 줄이 밀리지 않게 글 위에 띄운다)
  function say(a, text) {
    var old = document.querySelector('.mail-copied');
    if (old) old.remove();
    var r = a.getBoundingClientRect();
    var s = document.createElement('span');
    s.className = 'mail-copied';
    s.setAttribute('role', 'status');
    s.textContent = text;
    s.style.cssText = 'position:absolute;z-index:50;padding:5px 9px;border-radius:7px;background:#111827;color:#fff;' +
      'font-size:12.5px;line-height:1.4;white-space:nowrap;pointer-events:none;box-shadow:0 4px 14px rgba(17,24,39,.18)';
    document.body.appendChild(s);
    var left = Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - s.offsetWidth - 8);
    s.style.left = Math.max(8, left) + 'px';
    s.style.top = (r.bottom + window.scrollY + 6) + 'px';
    setTimeout(function () { s.remove(); }, 2500);
  }
})();
