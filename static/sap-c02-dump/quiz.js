'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let questions = [], order = [], currentId = null, visibleIds = [];
  let states = new Map(), busy = false;
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const stateFor = id => {
    if (!states.has(id)) states.set(id, { selected: [], revealed: false, attempted: false, marked: false });
    return states.get(id);
  };
  const isCorrect = (q, s) => q.answer.length === s.selected.length && q.answer.every(a => s.selected.includes(a));
  function stats() {
    const attempted = questions.filter(q => stateFor(q.id).attempted);
    const graded = attempted.filter(q => !q.incomplete);
    const correct = graded.filter(q => isCorrect(q, stateFor(q.id))).length;
    $('completed').textContent = attempted.length;
    $('score').textContent = `${correct} / ${graded.length}`;
    $('progress').style.width = `${attempted.length / questions.length * 100}%`;
  }
  function render(preserveCurrent = false) {
    const mode = $('filter').value;
    visibleIds = order.filter(id => {
      const q = questions.find(q => q.id === id), s = stateFor(id);
      return (preserveCurrent && id === currentId) || mode === 'all' || (mode === 'unanswered' && !s.revealed) || (mode === 'marked' && s.marked) || (mode === 'incorrect' && s.attempted && !q.incomplete && !isCorrect(q, s));
    });
    if (!visibleIds.includes(currentId)) currentId = visibleIds[0] ?? null;
    $('jump').replaceChildren(...visibleIds.map(id => new Option(`Câu ${id}`, String(id), false, id === currentId)));
    $('jump').disabled = !visibleIds.length;
    $('question-card').hidden = !visibleIds.length;
    $('empty').hidden = !!visibleIds.length;
    $('total').textContent = `${questions.length} câu trong bộ`;
    const index = visibleIds.indexOf(currentId);
    $('previous').disabled = index <= 0;
    $('next').disabled = index < 0 || index >= visibleIds.length - 1;
    stats();
    if (currentId === null) return;
    const q = questions.find(q => q.id === currentId), s = stateFor(currentId);
    $('position').textContent = `CÂU ${q.id} · ${index + 1} / ${visibleIds.length}`;
    $('prompt').textContent = q.prompt;
    $('source-warning').hidden = !q.incomplete;
    $('selection-hint').textContent = q.required > 1 ? `Chọn ${q.required} đáp án. Kết quả hiện khi chọn đủ.` : 'Chọn một đáp án để xem kết quả ngay.';
    $('mark').textContent = s.marked ? '★ Đã đánh dấu' : '☆ Đánh dấu';
    $('mark').setAttribute('aria-pressed', String(s.marked));
    const legend = document.createElement('legend');
    legend.className = 'sr-only'; legend.textContent = 'Chọn đáp án';
    $('options').replaceChildren(legend);
    q.options.forEach(option => {
      const label = document.createElement('label'); label.className = 'option';
      const input = document.createElement('input');
      input.type = q.required > 1 ? 'checkbox' : 'radio';
      input.name = 'answer'; input.value = option.letter;
      input.checked = s.selected.includes(option.letter); input.disabled = s.revealed;
      const letter = document.createElement('span'); letter.className = 'option-letter'; letter.textContent = option.letter + '.';
      const text = document.createElement('span'); text.className = 'option-text'; text.lang = 'en'; text.textContent = option.text;
      label.append(input, letter, text);
      if (s.revealed && q.answer.includes(option.letter)) label.classList.add('correct');
      if (s.revealed && input.checked && !q.answer.includes(option.letter)) label.classList.add('incorrect');
      input.addEventListener('change', () => {
        s.selected = [...$('options').querySelectorAll('input:checked')].map(i => i.value).sort();
        if (s.selected.length === q.required) { s.revealed = true; s.attempted = true; }
        // Keep the current question visible after grading; update filters on navigation.
        render(true);
      });
      $('options').append(label);
    });
    $('feedback').hidden = !s.revealed;
    $('retry').hidden = !s.revealed;
    $('reveal').hidden = s.revealed;
    if (s.revealed) {
      const reference = q.incomplete || !s.attempted;
      $('feedback').className = 'feedback' + (reference ? ' reference' : isCorrect(q, s) ? '' : ' wrong');
      $('feedback').textContent = `${reference ? 'Tham khảo' : isCorrect(q, s) ? 'Chính xác' : 'Chưa chính xác'} · Đáp án nguồn: ${q.answer.join(', ')}${s.selected.length ? ` · Bạn chọn: ${s.selected.join(', ')}` : ''}`;
    }
  }
  $('unlock-form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    if (!crypto.subtle) { $('gate-message').textContent = 'Hãy mở trang qua HTTPS hoặc localhost để tiếp tục.'; return; }
    busy = true; $('unlock').disabled = true; $('gate-message').textContent = 'Đang mở bộ câu hỏi…';
    let password = $('password').value;
    try {
      const response = await fetch('questions.enc.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('load');
      const encrypted = await response.json();
      if (encrypted.version !== 1 || encrypted.iterations !== 600000) throw new Error('format');
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: bytes(encrypted.salt), iterations: encrypted.iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(encrypted.iv), additionalData: new TextEncoder().encode('sap-c02-quiz:v1'), tagLength: 128 }, key, bytes(encrypted.ciphertext));
      const data = JSON.parse(new TextDecoder().decode(plaintext));
      if (data.version !== 1 || !Array.isArray(data.questions) || !data.questions.length) throw new Error('format');
      questions = data.questions; order = questions.map(q => q.id); currentId = order[0];
      $('password').value = ''; $('gate-message').textContent = ''; $('gate').hidden = true; $('workspace').hidden = false; $('lock').hidden = false;
      render(); $('prompt').tabIndex = -1; $('prompt').focus();
    } catch (error) {
      if (error.name === 'OperationError') {
        $('password').value = '';
        window.location.replace('/');
      } else {
        $('gate-message').textContent = 'Không mở được bộ câu hỏi. Kiểm tra kết nối rồi thử lại.';
        $('password').select();
      }
    } finally { password = ''; busy = false; $('unlock').disabled = false; }
  });
  $('lock').addEventListener('click', () => {
    questions = []; order = []; visibleIds = []; currentId = null; states.clear();
    $('options').replaceChildren(); $('prompt').textContent = ''; $('feedback').textContent = ''; $('jump').replaceChildren();
    $('workspace').hidden = true; $('gate').hidden = false; $('lock').hidden = true; $('filter').value = 'all'; $('password').value = ''; $('password').focus();
  });
  $('jump').addEventListener('change', () => { currentId = Number($('jump').value); render(); });
  $('filter').addEventListener('change', () => render());
  for (const [id, delta] of [['previous', -1], ['next', 1]]) $(id).addEventListener('click', () => {
    const index = visibleIds.indexOf(currentId); currentId = visibleIds[index + delta] ?? currentId; render(); $('prompt').focus();
  });
  $('mark').addEventListener('click', () => { const s = stateFor(currentId); s.marked = !s.marked; render(); });
  $('reveal').addEventListener('click', () => { stateFor(currentId).revealed = true; render(true); });
  $('retry').addEventListener('click', () => { const s = stateFor(currentId); s.selected = []; s.revealed = false; s.attempted = false; render(true); });
  $('shuffle').addEventListener('click', () => {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    currentId = null; render();
  });
})();
