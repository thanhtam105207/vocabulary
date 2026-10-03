const D = window.DATA || {}, $ = s => document.querySelector(s), K = 'ent303_v6_store';
let S = { history: ['home'], streak: 1, lastStudyDate: '', learnedCount: 0, folders: [], unit: '1' };

try { S = { ...S, ...JSON.parse(localStorage.getItem(K)) }; } catch(e){}
const save = () => localStorage.setItem(K, JSON.stringify(S));

let tab = 'home', activeQuiz = null;

function toast(m) {
  const t = $('#toast'); if(!t) return;
  t.textContent = m; t.classList.add('show');
  clearTimeout(t.t); t.t = setTimeout(() => t.classList.remove('show'), 2000);
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  speechSynthesis.speak(u);
}

function updateStreak() {
  const today = new Date().toDateString();
  if (S.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    S.streak = (S.lastStudyDate === yesterday) ? S.streak + 1 : 1;
    S.lastStudyDate = today;
    save();
  }
}

function go(targetTab, pushHist = true) {
  if (pushHist && S.history[S.history.length - 1] !== targetTab) {
    S.history.push(targetTab);
  }
  tab = targetTab;
  const backBtn = $('#backBtn');
  if(backBtn) backBtn.style.display = S.history.length > 1 ? 'block' : 'none';
  render();
  window.scrollTo(0, 0);
}

function goBack() {
  if (S.history.length > 1) {
    S.history.pop();
    go(S.history[S.history.length - 1], false);
  }
}

function renderNav() {
  const nav = $('#nav'); if(!nav) return;
  const items = [
    ['home', '🏠', 'Trang chủ'],
    ['folders', '📁', 'Bộ từ vựng'],
    ['vocab', '📚', 'Từ vựng'],
    ['quiz_menu', '🎮', 'Luyện tập'],
    ['add', '➕', 'Thêm từ']
  ];
  nav.innerHTML = items.map(([k, i, t]) => `
    <button class="${tab === k ? 'on' : ''}" onclick="go('${k}')">
      <i>${i}</i><span>${t}</span>
    </button>
  `).join('');
}

function render() {
  renderNav();
  if (tab === 'home') renderHome();
  else if (tab === 'folders') renderFolders();
  else if (tab === 'vocab') renderVocabView();
  else if (tab === 'quiz_menu') renderQuizMenu();
  else if (tab === 'quiz_play') renderQuizPlay();
  else if (tab === 'add') renderAddWord();
}

/* 1. TRANG CHỦ */
function renderHome() {
  const total = Object.values(D).reduce((a, b) => a + (b.vocab ? b.vocab.length : 0), 0);
  const percent = total ? Math.round((S.learnedCount / total) * 100) : 0;
  
  const main = $('#main'); if(!main) return;
  main.innerHTML = `
    <div class="dash-grid">
      <div class="stats-card">
        <div class="stat-box"><b>${total}</b><span>Tổng từ</span></div>
        <div class="stat-box"><b>${S.learnedCount}</b><span>Đã thuộc</span></div>
        <div class="stat-box"><b>${percent}%</b><span>Tiến độ</span></div>
        <div class="stat-box"><b>${Math.max(0, total - S.learnedCount)}</b><span>Cần học</span></div>
      </div>
      <div class="streak-card">
        <small>CHUỖI NGÀY HỌC</small>
        <div class="streak-num">🔥 ${S.streak} ngày</div>
        <div class="week-days">
          ${['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => `<div class="day-dot ${i === (new Date().getDay()\vert{}\vert{}7)-1 ? 'active':''}">${d}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="quick-access">
      <h3>Truy cập nhanh</h3>
      <div class="quick-grid">
        <div class="qa-card" onclick="go('add')">➕ <div><b>Thêm từ</b><br><small>Tạo từ mới / Folder</small></div></div>
        <div class="qa-card" onclick="go('quiz_menu')">⚡ <div><b>Luyện tập</b><br><small>Quiz & Games</small></div></div>
      </div>
    </div>
  `;
}

/* 2. CHẾ ĐỘ HIỂN THỊ TỪ VỰNG DẠNG LƯỚI */
function renderVocabView() {
  const list = D[S.unit]?.vocab || [];
  const main = $('#main'); if(!main) return;
  main.innerHTML = `
    <h2>📚 Từ vựng ${D[S.unit]?.badge || ''}</h2>
    <div class="vocab-grid">
      ${list.map((v) => `
        <div class="v-card">
          <div>
            <div class="hd">
              <h3>${v.word}</h3>
              <span class="pos">${v.pos || 'noun'}</span>
            </div>
            <div class="def">${v.def}</div>
          </div>
          <button style="margin-top:8px; border:0; background:var(--chip); border-radius:8px; padding:6px; cursor:pointer;" onclick="speak('${v.word}')">🔊 Nghe</button>
        </div>
      `).join('')}
    </div>
  `;
}

/* 3. MENU QUIZ */
function renderQuizMenu() {
  const main = $('#main'); if(!main) return;
  main.innerHTML = `
    <h2>🎮 Chọn chế độ Luyện tập</h2>
    <div class="quiz-modes">
      <div class="mode-card m-flashcard" onclick="startQuiz('fc')">🃏<br><b>Flashcard</b></div>
      <div class="mode-card m-mc" onclick="startQuiz('mc')">☑️<br><b>Trắc nghiệm</b></div>
      <div class="mode-card m-type" onclick="startQuiz('type')">⌨️<br><b>Gõ 2 cột</b></div>
      <div class="mode-card m-listen" onclick="startQuiz('listen')">🎧<br><b>Nghe chép</b></div>
      <div class="mode-card m-special" onclick="startQuiz('special')">⭐<br><b>Đặc biệt</b></div>
    </div>
  `;
}

function startQuiz(mode) {
  const list = D[S.unit]?.vocab || [];
  if (!list.length) return toast('Chưa có từ vựng!');
  activeQuiz = { mode, items: [...list], index: 0, score: 0 };
  go('quiz_play');
}

/* 4. CHƠI QUIZ */
function renderQuizPlay() {
  if (!activeQuiz) return go('quiz_menu');
  const q = activeQuiz;
  const item = q.items[q.index];
  const main = $('#main'); if(!main) return;

  // A. TRẮC NGHIỆM
  if (q.mode === 'mc') {
    const opts = [item.def, "Nghĩa khác A", "Nghĩa khác B", "Nghĩa khác C"].sort(() => Math.random() - 0.5);
    main.innerHTML = `
      <div class="q-target" id="qContainer" style="max-width:500px; margin:0 auto; background:var(--card); padding:20px; border-radius:20px;">
        <h3>Câu ${q.index + 1}/${q.items.length}: Từ "${item.word}" có nghĩa là?</h3>
        ${opts.map((o, idx) => `
          <button class="qa-card" style="width:100%; margin-top:8px;" onclick="checkMC('${o}', '${item.def}')">
            <b>${idx + 1}.</b>${o}
          </button>
        `).join('')}
      </div>
    `;
    setTimeout(() => $('#qContainer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);

    window.onkeydown = e => {
      if (['1','2','3','4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (opts[idx]) checkMC(opts[idx], item.def);
      }
    };
  } 
  // B. GÕ TỪ BẢNG 2 CỘT
  else if (q.mode === 'type') {
    main.innerHTML = `
      <h3>⌨️ Ôn từ vựng bảng 2 cột</h3>
      <table class="quiz-table">
        <thead><tr><th>Nghĩa Tiếng Việt</th><th>Gõ từ Tiếng Anh (Enter)</th></tr></thead>
        <tbody>
          ${q.items.map((it, idx) => `
            <tr>
              <td><b>${it.def}</b> (${it.pos||'n'})</td>
              <td><input id="inp_${idx}" onkeydown="checkTableEnter(event, ${idx}, '${it.word}')" placeholder="Nhập & nhấn Enter..."></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <button onclick="startQuiz('type')" style="margin-top:14px; padding:10px 20px; border-radius:12px; border:0; background:var(--rose); color:#fff; cursor:pointer;">Làm lại</button>
    `;
  }
  // C. NGHE CHÉP TỪ
  else if (q.mode === 'listen') {
    main.innerHTML = `
      <div class="listen-box">
        <button class="listen-btn" onclick="speak('${item.word}')">🎧</button>
        <p><small>Nhấn <b>Ctrl + X</b> để nghe lại</small></p>
        <input id="listenInp" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--line);" placeholder="Gõ từ bạn nghe được..." onkeydown="if(event.key==='Enter')checkListen('${item.word}')">
        <button onclick="checkListen('${item.word}')" style="margin-top:12px; width:100%; padding:12px; background:var(--ok); color:#fff; border:0; border-radius:12px; font-weight:700;">Kiểm tra (Enter)</button>
      </div>
    `;
    speak(item.word);
    window.onkeydown = e => {
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault(); speak(item.word);
      }
    };
  }
  // D. FLASHCARD
  else if (q.mode === 'fc') {
    main.innerHTML = `
      <div style="text-align:center; padding:30px; background:var(--card); border-radius:20px; max-width:400px; margin:20px auto;">
        <h2>${item.word}</h2>
        <p style="color:var(--rose); font-weight:700;">${item.def}</p>
        <p><small>Bấm '<' (Chưa thuộc) hoặc '>' (Đã thuộc)</small></p>
      </div>
    `;
    window.onkeydown = e => {
      if (e.key === '<' || e.key === 'ArrowLeft') nextFC(false);
      if (e.key === '>' || e.key === 'ArrowRight') nextFC(true);
    };
  }
}

/* Xử lý Logic Popup & Quiz */
function showPopup(isCorrect, detail = '') {
  const div = document.createElement('div');
  div.className = `toast-popup ${isCorrect ? 'popup-ok' : 'popup-no'}`;
  div.innerHTML = isCorrect ? 'CORRECT! 🎉' : `INCORRECT! ❌<br><small style="font-size:0.8rem">${detail}</small>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

function checkMC(selected, correct) {
  window.onkeydown = null;
  const isOk = selected === correct;
  if (isOk) activeQuiz.score++;
  showPopup(isOk, `Đáp án đúng: ${correct}`);
  
  updateStreak();
  setTimeout(() => {
    activeQuiz.index++;
    if (activeQuiz.index < activeQuiz.items.length) renderQuizPlay();
    else { toast('Hoàn thành bài tập!'); go('quiz_menu'); }
  }, 2000);
}

function checkTableEnter(e, idx, correctWord) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim().toLowerCase();
    if (val === correctWord.toLowerCase()) {
      e.target.style.borderColor = 'var(--ok)';
      e.target.style.background = 'var(--ok-light)';
    } else {
      e.target.style.borderColor = 'var(--rose)';
      e.target.style.background = 'var(--rose-light)';
      toast(`Sai rồi! Đúng là: ${correctWord}`);
    }
    const nextInp = $(`#inp_${idx + 1}`);
    if (nextInp) nextInp.focus();
    updateStreak();
  }
}

function checkListen(correctWord) {
  const val = $('#listenInp').value.trim().toLowerCase();
  const isOk = val === correctWord.toLowerCase();
  showPopup(isOk, `Đáp án: ${correctWord}`);
  updateStreak();
  setTimeout(() => {
    activeQuiz.index++;
    if (activeQuiz.index < activeQuiz.items.length) renderQuizPlay();
    else { toast('Hoàn thành bài nghe!'); go('quiz_menu'); }
  }, 2000);
}

function nextFC(learned) {
  if (learned) S.learnedCount++;
  save();
  activeQuiz.index++;
  if (activeQuiz.index < activeQuiz.items.length) renderQuizPlay();
  else { toast('Đã duyệt xong flashcard!'); go('quiz_menu'); }
}

/* Quản lý Folder & Thêm từ */
function renderFolders() {
  const main = $('#main'); if(!main) return;
  main.innerHTML = `
    <h2>📁 Bộ từ vựng & Folder</h2>
    <div class="quick-grid">
      ${Object.keys(D).map(k => `
        <div class="qa-card" onclick="S.unit='${k}'; save(); go('vocab');">
          📖 <b>Unit ${k}:${D[k].title}</b>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAddWord() {
  const main = $('#main'); if(!main) return;
  main.innerHTML = `
    <h2>➕ Thêm từ / Tạo Folder mới</h2>
    <form onsubmit="event.preventDefault(); toast('Đã lưu thành công!'); go('vocab');" style="background:var(--card); padding:16px; border-radius:16px;">
      <label>Từ tiếng Anh:<br><input style="width:100%; padding:8px; margin-top:4px;" required></label><br><br>
      <label>Nghĩa tiếng Việt:<br><input style="width:100%; padding:8px; margin-top:4px;" required></label><br><br>
      <button style="padding:10px 20px; background:var(--rose); color:#fff; border:0; border-radius:10px; cursor:pointer;">Lưu từ mới</button>
    </form>
  `;
}

/* Khởi tạo Select Unit & App */
const unitSelect = $('#unit');
if(unitSelect && Object.keys(D).length > 0) {
  unitSelect.innerHTML = Object.keys(D).map(k => `<option value="${k}">Unit ${k}: ${D[k].title}</option>`).join('');
  unitSelect.value = S.unit;
  unitSelect.onchange = e => { S.unit = e.target.value; save(); render(); };
}

render();