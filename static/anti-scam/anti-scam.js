(() => {
  'use strict';

  const STORAGE_KEY = 'anti_scam_course_progress_v1';
  let courseData = null;
  let state = {
    currentSectionId: 1,
    activeTab: 'lesson', // 'lesson' | 'quiz'
    passedSections: [],  // array of section IDs
    answers: {},         // { sectionId: { questionId: selectedKey } }
    sectionScores: {}    // { sectionId: { score, total, percentage, passed } }
  };

  // Load saved state
  function loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.passedSections = parsed.passedSections || [];
        state.currentSectionId = parsed.currentSectionId || 1;
        state.answers = parsed.answers || {};
        state.sectionScores = parsed.sectionScores || {};
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        passedSections: state.passedSections,
        currentSectionId: state.currentSectionId,
        answers: state.answers,
        sectionScores: state.sectionScores
      }));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }

  function isSectionUnlocked(secId) {
    if (secId === 1) return true;
    // Section N is unlocked if Section N-1 is passed
    return state.passedSections.includes(secId - 1);
  }

  // Simple Markdown to HTML parser for lesson content
  function renderMarkdown(md) {
    if (!md) return '';
    let html = md;
    
    // Escape special HTML chars but preserve intended elements
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Unordered lists
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, '');

    // Paragraphs: split by double newlines
    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      if (/^<(h1|h2|h3|ul|ol|li|blockquote)/i.test(p)) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  }

  // Render Sidebar
  function renderSidebar() {
    const listEl = document.getElementById('section-list');
    const fillEl = document.getElementById('overall-progress-fill');
    const textEl = document.getElementById('overall-progress-text');
    
    if (!listEl || !courseData) return;

    listEl.innerHTML = '';
    const totalSec = courseData.sections.length;
    const passedCount = state.passedSections.length;
    const percent = Math.round((passedCount / totalSec) * 100);

    fillEl.style.width = `${percent}%`;
    textEl.textContent = `Đã hoàn thành ${passedCount}/${totalSec} Section (${percent}%)`;

    courseData.sections.forEach(sec => {
      const isUnlocked = isSectionUnlocked(sec.id);
      const isPassed = state.passedSections.includes(sec.id);
      const isActive = state.currentSectionId === sec.id;

      const li = document.createElement('li');
      li.className = `section-item ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      
      let badgeHtml = '';
      if (isPassed) {
        badgeHtml = '<span class="sec-status-badge badge-passed">✓ Đã Pass</span>';
      } else if (isUnlocked) {
        badgeHtml = '<span class="sec-status-badge badge-current">Đang học</span>';
      } else {
        badgeHtml = '<span class="sec-status-badge badge-locked">🔒 Khóa</span>';
      }

      li.innerHTML = `
        <div class="section-item-header">
          <div class="sec-title-wrap">
            <span class="sec-icon">${sec.icon}</span>
            <span class="sec-num">Section ${sec.id}</span>
          </div>
          ${badgeHtml}
        </div>
        <div class="sec-name">${sec.shortTitle || sec.title}</div>
        <div class="sec-meta">
          <span>${sec.questions.length} câu trắc nghiệm</span>
          <span>Điểm yêu cầu: $\\ge$ 80%</span>
        </div>
      `;

      if (isUnlocked) {
        li.addEventListener('click', () => {
          state.currentSectionId = sec.id;
          saveProgress();
          renderApp();
        });
      }

      listEl.appendChild(li);
    });
  }

  // Render Tabs
  function renderTabs() {
    const tabLesson = document.getElementById('tab-lesson');
    const tabQuiz = document.getElementById('tab-quiz');

    if (state.activeTab === 'lesson') {
      tabLesson.classList.add('active');
      tabQuiz.classList.remove('active');
    } else {
      tabLesson.classList.remove('active');
      tabQuiz.classList.add('active');
    }

    tabLesson.onclick = () => {
      state.activeTab = 'lesson';
      renderApp();
    };

    tabQuiz.onclick = () => {
      state.activeTab = 'quiz';
      renderApp();
    };
  }

  // Render Lesson View
  function renderLessonView(currentSec) {
    const container = document.getElementById('lesson-view');
    const isPassed = state.passedSections.includes(currentSec.id);

    container.innerHTML = `
      <div class="lesson-banner">
        <div class="tagline">Section 0${currentSec.id} • Khóa học Phòng chống Lừa đảo</div>
        <h2>${currentSec.icon} ${currentSec.title}</h2>
        <p style="color: var(--text-muted); font-size: 14px;">Nghiên cứu tài liệu bên dưới và hoàn thành bài kiểm tra cuối section để mở khóa phần tiếp theo.</p>
      </div>

      <div class="lesson-content">
        ${renderMarkdown(currentSec.contentMarkdown)}
      </div>

      <div class="lesson-footer-action">
        <button id="btn-go-quiz" class="btn-primary">
          <span>Làm bài kiểm tra Section ${currentSec.id} (20 câu)</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    `;

    document.getElementById('btn-go-quiz').addEventListener('click', () => {
      state.activeTab = 'quiz';
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Render Quiz View
  function renderQuizView(currentSec) {
    const container = document.getElementById('quiz-view');
    const secId = currentSec.id;
    const questions = currentSec.questions;
    const userSecAnswers = state.answers[secId] || {};
    const scoreInfo = state.sectionScores[secId];
    const isPassed = state.passedSections.includes(secId);

    let html = `
      <div class="quiz-header-card">
        <div>
          <h3 style="font-size: 16px; margin-bottom: 4px; color: #fff;">Bài kiểm tra trắc nghiệm: Section ${secId}</h3>
          <p class="quiz-rule-text">Tổng số <strong>${questions.length} câu hỏi</strong>. Cần đạt tối thiểu <strong>16/20 câu đúng (80%)</strong> để Pass.</p>
        </div>
        <div class="quiz-score-badge">
          ${scoreInfo ? `Điểm gần nhất: ${scoreInfo.score}/${scoreInfo.total} (${scoreInfo.percentage}%)` : 'Chưa nộp bài'}
        </div>
      </div>

      <form id="quiz-form" class="question-list">
    `;

    questions.forEach((q, qIndex) => {
      const selected = userSecAnswers[q.id];
      const isGraded = Boolean(scoreInfo);
      let cardStatusClass = '';

      if (isGraded) {
        if (selected === q.answer) {
          cardStatusClass = 'status-correct';
        } else {
          cardStatusClass = 'status-wrong';
        }
      }

      html += `
        <article class="question-card ${cardStatusClass}" id="q-card-${q.id}">
          <div class="q-header">
            <span class="q-badge">Câu ${qIndex + 1}/${questions.length}</span>
            <div class="q-prompt">${q.prompt}</div>
          </div>
          <div class="options-group">
      `;

      q.options.forEach(opt => {
        const isChecked = selected === opt.key;
        let optClass = '';
        if (isChecked) optClass += ' is-selected';
        if (isGraded) {
          if (opt.key === q.answer) {
            optClass += ' is-correct-ans';
          } else if (isChecked && opt.key !== q.answer) {
            optClass += ' is-wrong-ans';
          }
        }

        html += `
          <label class="option-label ${optClass}">
            <input type="radio" name="q_${q.id}" value="${opt.key}" ${isChecked ? 'checked' : ''} />
            <div class="option-text">
              <span class="option-letter">${opt.key}.</span>
              <span>${opt.text}</span>
            </div>
          </label>
        `;
      });

      html += `
          </div>
        </article>
      `;
    });

    html += `
      </form>

      <div class="quiz-bottom-actions">
        <button id="btn-submit-quiz" class="btn-primary" type="button">
          Nộp bài & Chấm điểm Section ${secId}
        </button>
      </div>

      <div id="quiz-result-area"></div>
    `;

    container.innerHTML = html;

    // Attach change listeners to update answers in state
    const form = document.getElementById('quiz-form');
    form.addEventListener('change', (e) => {
      if (e.target.name && e.target.name.startsWith('q_')) {
        const qId = parseInt(e.target.name.replace('q_', ''), 10);
        if (!state.answers[secId]) state.answers[secId] = {};
        state.answers[secId][qId] = e.target.value;
        saveProgress();
      }
    });

    // Submit handler
    document.getElementById('btn-submit-quiz').addEventListener('click', () => {
      evaluateQuiz(currentSec);
    });

    if (scoreInfo) {
      renderResultModal(scoreInfo, currentSec);
    }
  }

  function evaluateQuiz(currentSec) {
    const secId = currentSec.id;
    const questions = currentSec.questions;
    const answers = state.answers[secId] || {};

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = confirm(`Bạn mới trả lời ${answeredCount}/${questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài luôn không?`);
      if (!confirmSubmit) return;
    }

    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.answer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= 80; // >= 16/20

    const scoreData = {
      score: correctCount,
      total: questions.length,
      percentage,
      passed
    };

    state.sectionScores[secId] = scoreData;

    if (passed && !state.passedSections.includes(secId)) {
      state.passedSections.push(secId);
    }

    saveProgress();
    renderApp();
    renderResultModal(scoreData, currentSec);

    // Scroll to result modal
    setTimeout(() => {
      const modal = document.getElementById('quiz-result-modal');
      if (modal) modal.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function renderResultModal(scoreData, currentSec) {
    const area = document.getElementById('quiz-result-area');
    if (!area) return;

    const { score, total, percentage, passed } = scoreData;
    const nextSecId = currentSec.id + 1;
    const hasNext = courseData.sections.some(s => s.id === nextSecId);

    area.innerHTML = `
      <div id="quiz-result-modal" class="quiz-result-modal ${passed ? 'pass' : 'fail'}">
        <div class="res-icon">${passed ? '🎉' : '⚠️'}</div>
        <div class="res-title">${passed ? 'XIN CHÚC MỪNG! BẠN ĐÃ PASS' : 'CHƯA ĐẠT ĐIỂM PASS (YÊU CẦU $\\ge$ 80%)'}</div>
        <div class="res-score">Kết quả: <strong>${score}/${total}</strong> câu đúng (${percentage}%)</div>
        <p class="res-msg">
          ${passed 
            ? (hasNext 
                ? `Tuyệt vời! Bạn đã mở khóa thành công <strong>Section ${nextSecId}</strong>. Hãy tiếp tục hành trình nâng cao phản xạ an toàn số.`
                : `Chúc mừng bạn đã hoàn thành xuất sắc toàn bộ khóa học! Bạn đã làm chủ các kỹ năng phòng vệ trước các bẫy lừa đảo trực tuyến.`)
            : `Rất tiếc bạn cần tối thiểu 16/20 câu đúng để vượt qua section này. Hãy ôn lại bài học và thử lại nhé!`}
        </p>
        <div class="res-buttons">
          <button id="btn-retry" class="btn-primary" style="background: var(--card-hover); border: 1px solid var(--border-color); color: var(--text-main);">
            🔄 Làm lại bài test
          </button>
          ${passed && hasNext ? `
            <button id="btn-next-sec" class="btn-accent">
              <span>Học tiếp Section ${nextSecId}</span>
              <span aria-hidden="true">→</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('btn-retry').onclick = () => {
      delete state.sectionScores[currentSec.id];
      saveProgress();
      renderApp();
    };

    const nextBtn = document.getElementById('btn-next-sec');
    if (nextBtn) {
      nextBtn.onclick = () => {
        state.currentSectionId = nextSecId;
        state.activeTab = 'lesson';
        saveProgress();
        renderApp();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }

  function renderApp() {
    renderSidebar();
    renderTabs();

    const currentSec = courseData.sections.find(s => s.id === state.currentSectionId) || courseData.sections[0];
    const lessonView = document.getElementById('lesson-view');
    const quizView = document.getElementById('quiz-view');

    if (state.activeTab === 'lesson') {
      lessonView.style.display = 'block';
      quizView.style.display = 'none';
      renderLessonView(currentSec);
    } else {
      lessonView.style.display = 'none';
      quizView.style.display = 'block';
      renderQuizView(currentSec);
    }
  }

  // Init
  async function init() {
    try {
      loadProgress();
      const res = await fetch('/anti-scam/course-data.json');
      if (!res.ok) throw new Error('Failed to load course-data.json');
      courseData = await res.json();

      // Reset button
      const resetBtn = document.getElementById('btn-reset-course');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến độ học và làm bài kiểm tra từ đầu?')) {
            localStorage.removeItem(STORAGE_KEY);
            state.currentSectionId = 1;
            state.activeTab = 'lesson';
            state.passedSections = [];
            state.answers = {};
            state.sectionScores = {};
            renderApp();
          }
        });
      }

      renderApp();
    } catch (err) {
      console.error(err);
      const appEl = document.getElementById('app-root');
      if (appEl) {
        appEl.innerHTML = `<p style="padding: 40px; color: var(--danger); text-align: center;">Không thể tải dữ liệu khóa học: ${err.message}</p>`;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
