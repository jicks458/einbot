// 가이드의 주소·명령어 옆에 복사 단추를 붙인다.
// 붙이는 곳은 <code class="copy"> 뿐이다. 주소·명령어 글자는 HTML 에 그대로 있고, 단추는 꾸밈이라 여기서 만든다.
// JS 가 꺼져 있으면 단추만 없고 글자는 그대로 보인다(네이버 수집기도 글자를 읽는다).
// 복사할 값: data-copy 가 있으면 그것(예: 명령어 틀 "!명령어추가 이름 내용"은 "!명령어추가 "까지만), 없으면 글자 그대로.
// 누르면 아이콘이 2초 동안 체크로 바뀌고 단추 위에 "복사됨"이 뜬다. 화면 읽기 프로그램에는 같은 말을 읽어 준다.
// 클립보드는 새 방식 → 막히면 옛 방식(execCommand, 앱 안 브라우저용) → 그것도 안 되면 글자를 골라 둔다.
(function () {
  var codes = document.querySelectorAll('code.copy');
  if (!codes.length || !document.addEventListener) return;

  var SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
  var ICON_COPY = SVG + '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M15 9V5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15H9"/></svg>';
  var ICON_DONE = SVG + '<path d="M20 6 9 17l-5-5"/></svg>';
  var SHOW_MS = 2000;

  // 화면 읽기 프로그램용 알림 칸 (보이지 않음)
  var live = document.createElement('span');
  live.className = 'cp-live';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    if (!code.id) {
      var n = i + 1;
      while (document.getElementById('cp-' + n)) n++;
      code.id = 'cp-' + n;
    }
    // 칩(.cp-wrap)을 .cp-unit 으로 감싼다. 칩 바로 뒤에 조사("을", "인지")가 붙어 있으면 보이지 않는 글자(U+2060)를 덧붙여
    // 단추 뒤에서 줄이 바뀌어 조사만 줄 첫머리로 떨어지지 않게 한다(.glue — 칩 폭 상한도 조사 자리만큼 줄인다, guide.css 13절).
    var unit = document.createElement('span');
    unit.className = 'cp-unit';
    var wrap = document.createElement('span');
    wrap.className = 'cp-wrap';
    code.parentNode.insertBefore(unit, code);
    unit.appendChild(wrap);
    wrap.appendChild(code);
    var next = unit.nextSibling;
    if (next && next.nodeType === 3 && /^\S/.test(next.data)) {
      unit.className += ' glue';
      unit.appendChild(document.createTextNode('\u2060'));
    }
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cp';
    b.title = '복사';
    b.setAttribute('aria-label', '복사');
    b.setAttribute('aria-describedby', code.id);
    b.innerHTML = ICON_COPY;
    wrap.appendChild(b);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button.cp') : null;
    if (!b) return;
    var code = b.parentNode.querySelector('code');
    var text = code.hasAttribute('data-copy') ? code.getAttribute('data-copy') : code.textContent;
    var ok = function () { done(b, '복사됨'); };
    var fallback = function () {
      if (oldCopy(text)) { ok(); return; }
      selectText(code);
      done(b, '직접 복사하세요', true);
    };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  });

  // 새 방식이 막힌 브라우저용 (입력 칸을 잠깐 만들어 복사)
  function oldCopy(text) {
    var prev = document.activeElement, ring = false;
    try { ring = prev.matches(':focus-visible'); } catch (err) { /* 옛 브라우저 */ }
    var t = document.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    document.body.appendChild(t);
    t.select();
    try { t.setSelectionRange(0, text.length); } catch (err) { /* 옛 브라우저 */ }
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    t.remove();
    // 입력 칸으로 옮겨 간 포커스를 단추로 되돌린다(키보드로 눌렀을 때만 포커스 테두리를 다시 띄움)
    if (prev && prev.focus && prev !== document.body) { try { prev.focus({ preventScroll: true, focusVisible: ring }); } catch (err) { /* 옛 브라우저 */ } }
    return ok;
  }

  function selectText(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (err) { /* 무시 */ }
  }

  // 아이콘을 체크로 바꾸고 단추 위에 짧게 알린다 (글 줄이 밀리지 않게 글 위에 띄운다)
  function done(b, msg, failed) {
    clearTimeout(b._cpTimer);
    if (!failed) { b.classList.add('done'); b.innerHTML = ICON_DONE; }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);

    var old = document.querySelector('.cp-tip');
    if (old) old.remove();
    var tip = document.createElement('span');
    tip.className = 'cp-tip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = msg;
    document.body.appendChild(tip);
    var r = b.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var left = r.left + r.width / 2 - tip.offsetWidth / 2;
    left = Math.max(8, Math.min(left, vw - tip.offsetWidth - 8));
    var top = r.top - tip.offsetHeight - 6;
    if (top < 8) top = r.bottom + 6;          // 화면 맨 위에 붙어 있으면 아래에
    tip.style.left = (left + window.scrollX) + 'px';
    tip.style.top = (top + window.scrollY) + 'px';

    b._cpTimer = setTimeout(function () {
      b.classList.remove('done');
      b.innerHTML = ICON_COPY;
      tip.remove();
    }, SHOW_MS);
  }
})();
