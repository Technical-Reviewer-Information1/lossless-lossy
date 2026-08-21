(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(n, a) { const e = document.createElementNS(NS, n); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); return e; }
  const gray = v => { const c = Math.max(0, Math.min(255, Math.round(v * 255))); return 'rgb(' + c + ',' + c + ',' + c + ')'; };

  /* ===== STEP 1-① 可逆圧縮（ランレングス法） ===== */
  function rle(s) {
    let out = '', i = 0;
    while (i < s.length) {
      let j = i; while (j < s.length && s[j] === s[i]) j++;
      out += s[i] + (j - i); i = j;
    }
    return out;
  }
  function unrle(s) {
    let out = '';
    s.replace(/(.)(\d+)/g, (m, c, n) => { out += c.repeat(+n); return ''; });
    return out;
  }
  function drawRle() {
    const src = $('txtIn').value.replace(/\s/g, '');
    const enc = rle(src), dec = unrle(enc);
    const same = dec === src;
    const before = src.length * 8, after = enc.length * 8;
    $('rleFlow').innerHTML =
      '<div class="b"><h4>もとのデータ（' + src.length + '文字 ＝ ' + before + 'ビット）</h4><div class="val">' + (src || '—') + '</div></div>' +
      '<div class="b"><h4>圧縮したデータ（' + enc.length + '文字 ＝ ' + after + 'ビット）</h4><div class="val">' + (enc || '—') + '</div></div>' +
      '<div class="b ' + (same ? 'ok' : 'ng') + '"><h4>もとに戻したデータ</h4><div class="val">' + (dec || '—') + '</div></div>' +
      '<div class="b ' + (same ? 'ok' : 'ng') + '"><h4>もとと同じか</h4><div class="val" style="font-size:1.2rem">' +
      (same ? '完全に一致 ○' : '一致しない ×') + '</div></div>';
    const r = before ? after / before * 100 : 0;
    const n = $('rleNote');
    n.className = 'note ' + (same ? (r <= 100 ? 'ok' : 'warn') : 'ng');
    n.innerHTML = '圧縮率は ' + after + ' ÷ ' + before + ' × 100 ＝ <strong>' + (Math.round(r * 10) / 10) + '％</strong>。' +
      (r > 100
        ? '　同じ文字の連続が少ないと、かえって<strong>データ量が増えてしまう</strong>ことがあります。これはランレングス法の弱点です。'
        : '　同じ文字が長く続くほどよく縮みます。') +
      '<br>圧縮しても<strong>もとのデータに完全に戻せる</strong>ので、これは<span class="term" data-t="可逆圧縮">可逆圧縮</span>です。';
    window.Terms.attach();
  }

  /* ===== STEP 1-② 非可逆圧縮 ===== */
  const N = 26;
  function pic(x, y) {
    const d = Math.hypot(x - 0.42, y - 0.40);
    return Math.max(0, Math.min(1, 0.92 - 0.85 * Math.exp(-d * d * 6) + 0.18 * Math.sin(x * 7) * 0.4));
  }
  function svgOf(fn) {
    const S = 150, c = S / N;
    const svg = el('svg', { viewBox: '0 0 ' + S + ' ' + S, 'shape-rendering': 'crispEdges', role: 'img' });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
      svg.appendChild(el('rect', { x: x * c, y: y * c, width: c + 0.5, height: c + 0.5, fill: gray(fn((x + 0.5) / N, (y + 0.5) / N)) }));
    return svg;
  }
  function drawLossy() {
    const bits = +$('lvl').value, L = Math.pow(2, bits);
    $('lvlV').textContent = L; $('capB').textContent = L;
    const q = (x, y) => Math.round(pic(x, y) * (L - 1)) / (L - 1);
    const put = (id, fn) => { const b = $(id); b.innerHTML = ''; b.appendChild(svgOf(fn)); };
    put('imgA', pic);
    put('imgB', q);
    put('imgC', q);                                   // 復元しても量子化された値しか残っていない
    put('imgD', (x, y) => 1 - Math.min(1, Math.abs(pic(x, y) - q(x, y)) * 6));
    let err = 0, n2 = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N, v = (y + 0.5) / N;
      err += Math.abs(pic(u, v) - q(u, v)); n2++;
    }
    const nt = $('imgNote');
    const exact = err < 1e-9;
    nt.className = 'note ' + (exact ? 'ok' : 'ng');
    nt.innerHTML = '1画素あたり <strong>' + bits + 'ビット</strong>（' + L + '段階）に減らしました。データ量はもとの ' +
      (Math.round(bits / 8 * 1000) / 10) + '％。<br>' +
      (exact ? 'この設定では見た目の差はほとんどありません。' :
        'ところが、<strong>もとに戻そうとしても戻りません</strong>。削った濃淡の情報はもうどこにも残っていないからです（平均のずれ ' +
        (Math.round(err / n2 * 255)) + ' / 255）。これが<span class="term" data-t="非可逆圧縮">非可逆圧縮</span>です。') +
      '<br>そのかわり圧縮効率は高く、写真・音声・動画のように<strong>多少削っても人が気づきにくいデータ</strong>で使われます。';
    window.Terms.attach();
  }

  /* ===== STEP 2 圧縮率 ===== */
  function drawRatio() {
    const b = +$('before').value || 0, a = +$('after').value || 0;
    const r = b ? a / b * 100 : 0;
    $('rEq').innerHTML = a + '（MB） ÷ ' + b + '（MB） × 100<br>＝ <strong>' + (Math.round(r * 100) / 100) + '（％）</strong>';
    $('rBar').style.width = Math.min(100, r) + '%';
    $('rBarT').textContent = '圧縮率 ' + (Math.round(r * 10) / 10) + '％';
    const n = $('rNote');
    n.className = 'note ' + (r < 100 ? 'ok' : r === 100 ? 'info' : 'ng');
    n.innerHTML = r < 100
      ? 'もとの ' + (Math.round(r * 10) / 10) + '％ の大きさになりました（' + (Math.round((100 - r) * 10) / 10) + '％ 減）。' +
        '<strong>圧縮率が小さいほど、よく縮んでいる＝圧縮効率が高い</strong>ということです。'
      : r === 100 ? 'まったく縮んでいません。圧縮率100％は「もとと同じ大きさ」です。'
        : '圧縮したのに<strong>大きくなっています</strong>。データの性質に合わない圧縮方法だとこうなることがあります。';
  }

  /* ===== STEP 3 向き不向き ===== */
  const MATCH = [
    { n: 'レポートの文章データ', a: '可逆', why: '1文字でも変わったら意味が変わってしまうので、完全に戻せる必要があります。' },
    { n: 'プログラムのデータ', a: '可逆', why: '1ビットでも変わると動かなくなります。可逆圧縮でなければいけません。' },
    { n: 'スマートフォンで撮った写真', a: '非可逆', why: '多少色が変わっても人は気づきにくいので、効率を優先します（JPEGなど）。' },
    { n: '音楽の配信データ', a: '非可逆', why: '人に聞こえにくい音を削って小さくします（MP3・AACなど）。' },
    { n: '動画配信サービスの動画', a: '非可逆', why: 'データ量が非常に大きいので、圧縮なしでは配信できません。' },
    { n: '白黒2値のピクトグラム', a: '可逆', why: '形が変わると意味が伝わらなくなります。ランレングス法などがよく合います。' }
  ];
  let mAns = {};
  function drawMatch() {
    $('matchBox').innerHTML = MATCH.map((m, i) =>
      '<div class="nm">' + m.n + '</div>' +
      '<div class="bs" data-i="' + i + '"><button class="btn" data-i="' + i + '" data-v="可逆">可逆圧縮</button>' +
      '<button class="btn" data-i="' + i + '" data-v="非可逆">非可逆圧縮</button></div>' +
      '<div class="note" id="mfb' + i + '" hidden style="grid-column:1/-1;margin:0 0 6px"></div>').join('');
    $('matchBox').querySelectorAll('button[data-v]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, m = MATCH[i], ok = btn.dataset.v === m.a;
      const row = $('matchBox').querySelector('.bs[data-i="' + i + '"]');
      row.style.pointerEvents = 'none';
      [...row.children].forEach(x => { if (x.dataset.v === m.a) x.classList.add('correct'); else if (x === btn) x.classList.add('wrong'); });
      const fb = $('mfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = '<strong>' + m.a + '圧縮</strong>　' + m.why;
      mAns[i] = ok;
      const done = Object.keys(mAns).length, right = Object.values(mAns).filter(Boolean).length;
      const n = $('matchNote');
      n.className = 'note ' + (done === MATCH.length ? (right === done ? 'ok' : 'warn') : 'info');
      n.innerHTML = done + ' / ' + MATCH.length + ' 判定（正解 ' + right + ' 問）' +
        (done === MATCH.length ? '<br>見分け方は<strong>「完全にもとに戻らないと困るか」</strong>の一点です。困るなら可逆、困らないなら非可逆。' : '');
    }));
    $('matchNote').className = 'note info';
    $('matchNote').textContent = '0 / ' + MATCH.length + ' 判定';
  }

  /* ===== STEP 4 空欄 ===== */
  const BLANKS = [
    { k: 'ア', q: '圧縮前のデータと全く同じものに戻せる圧縮法は', ch: ['無圧縮', '可逆圧縮', '差分圧縮', '非可逆圧縮'], a: '可逆圧縮',
      why: '完全に戻せる（＝逆にたどれる）ので「可逆」です。STEP 1 の①がこれにあたります。' },
    { k: 'イ', q: '人間が認識しにくい部分を削って効率を高める圧縮法は', ch: ['無圧縮', '可逆圧縮', '差分圧縮', '非可逆圧縮'], a: '非可逆圧縮',
      why: '削った情報は戻らないので「非可逆」。STEP 1 の②がこれにあたります。' },
    { k: 'ウ・エ', q: '可逆圧縮がよく利用されるデータは（2つ）', ch: ['文章データ', '画像データ', '動画データ', 'プログラムデータ'], a: '文章データ|プログラムデータ', multi: true,
      why: '完全にもとに戻らないと困るデータです。画像・動画は多少変わっても支障が少ないので非可逆圧縮が使われます。（順不同で⓪・③）' },
    { k: 'オ', q: '圧縮率の定義から言えることは',
      ch: ['データが違っても同じアルゴリズムで圧縮すれば圧縮率は等しい', 'データが違っても圧縮率が等しければ圧縮後のデータ量は等しい', '圧縮率が小さいほど圧縮に必要な時間が短い', '圧縮前に比べ圧縮後のデータ量が少ないほど圧縮率が小さい'],
      a: '圧縮前に比べ圧縮後のデータ量が少ないほど圧縮率が小さい',
      why: '20MB→15MBなら75％、20MB→10MBなら50％。圧縮後が少ないほど圧縮率は小さくなります。圧縮率はデータの中身によって変わり、圧縮にかかる時間とは関係ありません。' }
  ];
  let bAns = {};
  function drawBlanks() {
    $('blankBox').innerHTML = BLANKS.map((b, i) => {
      const long = b.ch.some(c => c.length > 12);
      return '<div' + (i ? ' style="margin-top:18px;padding-top:16px;border-top:1px solid var(--line)"' : '') + '>' +
        '<p class="pq">【' + b.k + '】　' + b.q + '</p>' +
        '<div class="choice4' + (long ? ' v' : '') + '" data-i="' + i + '">' + b.ch.map((c, j) =>
          '<button class="btn" data-i="' + i + '" data-c="' + c + '" style="text-align:' + (long ? 'left' : 'center') + '">' +
          '⓪①②③'[j] + '　' + c + '</button>').join('') +
        '</div><div class="note" id="bfb' + i + '" hidden></div></div>';
    }).join('');
    $('blankBox').querySelectorAll('button[data-c]').forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, b = BLANKS[i];
      const answers = b.a.split('|'), ok = answers.indexOf(btn.dataset.c) >= 0;
      const row = $('blankBox').querySelector('.choice4[data-i="' + i + '"]');
      if (!b.multi) row.classList.add('locked');
      [...row.children].forEach(x => {
        if (answers.indexOf(x.dataset.c) >= 0) x.classList.add('correct');
        else if (x === btn) x.classList.add('wrong');
      });
      if (b.multi) row.classList.add('locked');
      const fb = $('bfb' + i);
      fb.hidden = false; fb.className = 'note ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + answers.join('・') + '</strong>。') + b.why;
      bAns[i] = ok;
      const done = Object.keys(bAns).length, right = Object.values(bAns).filter(Boolean).length;
      const n = $('blankNote');
      n.className = 'note ' + (done === BLANKS.length ? (right === done ? 'ok' : 'warn') : 'info');
      n.innerHTML = done + ' / ' + BLANKS.length + ' 問解答（正解 ' + right + ' 問）' +
        (done === BLANKS.length ? '<br>本文の答えは【ア】①　【イ】③　【ウ】・【エ】⓪・③（順不同）　【オ】③ です。' : '');
    }));
    $('blankNote').className = 'note info';
    $('blankNote').textContent = '0 / ' + BLANKS.length + ' 問解答';
  }

  /* ===== STEP 5 ===== */
  const Q2 = [
    { c: '隣り合うフレーム間で変化した部分だけ記録して圧縮する。', bad: false, why: '動画の非可逆圧縮でよく使われる考え方です（フレーム間予測）。' },
    { c: '人間の肉眼では判別できないような似た色をまとめて圧縮する。', bad: false, why: '画像の非可逆圧縮の説明として正しい記述です。STEP 1 の②で体験しました。' },
    { c: '同じ文字列が連続して出現する文字列をまとめて圧縮する。', bad: true, why: 'これは<strong>ランレングス法</strong>の説明で、圧縮したものを完全にもとに戻せる<strong>可逆圧縮</strong>です。非可逆圧縮の説明としては最も適当ではありません。' },
    { c: '人間にとって聞こえにくい微弱な音を削減して圧縮する。', bad: false, why: '音声の非可逆圧縮（MP3など）の説明として正しい記述です。' }
  ];
  function drawQ2() {
    const box = $('q2Choices'); box.innerHTML = '';
    Q2.forEach((q, i) => {
      const b = document.createElement('button');
      b.className = 'btn'; b.style.textAlign = 'left'; b.dataset.i = i;
      b.textContent = '⓪①②③'[i] + '　' + q.c;
      b.addEventListener('click', () => {
        box.classList.add('locked');
        [...box.children].forEach(x => { if (Q2[+x.dataset.i].bad) x.classList.add('correct'); else if (x === b) x.classList.add('wrong'); });
        const fb = $('q2Fb'); fb.hidden = false; fb.className = 'note ' + (q.bad ? 'ok' : 'ng');
        fb.innerHTML = (q.bad ? '正解（②）。' : '正解は <strong>②</strong>。選んだ選択肢は' + q.why + '<br>②が答えです：') +
          (q.bad ? q.why : Q2[2].why);
      });
      box.appendChild(b);
    });
  }

  function init() {
    $('txtIn').addEventListener('input', drawRle);
    document.querySelectorAll('button[data-t]').forEach(b => b.addEventListener('click', () => { $('txtIn').value = b.dataset.t; drawRle(); }));
    $('lvl').addEventListener('input', drawLossy);
    ['before', 'after'].forEach(i => $(i).addEventListener('input', drawRatio));
    document.querySelectorAll('button[data-r]').forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.r.split(','); $('before').value = v[0]; $('after').value = v[1]; drawRatio();
    }));
    window.Terms.glossary($('glossBox'), ['圧縮', '可逆圧縮', '非可逆圧縮', '圧縮率', 'ランレングス法', 'ハフマン符号化', '階調', 'ビット']);
    drawRle(); drawLossy(); drawRatio(); drawMatch(); drawBlanks(); drawQ2();
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
