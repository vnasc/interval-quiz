'use strict';

const INTERVALS = [
  { id: 'm2', name: 'minor 2nd', semitones: 1, degree: 2 },
  { id: 'M2', name: 'major 2nd', semitones: 2, degree: 2 },
  { id: 'm3', name: 'minor 3rd', semitones: 3, degree: 3 },
  { id: 'M3', name: 'major 3rd', semitones: 4, degree: 3 },
  { id: 'P4', name: 'perfect 4th', semitones: 5, degree: 4 },
  { id: 'TT', name: 'augmented 4th / diminished 5th', semitones: 6, degree: 4 },
  { id: 'P5', name: 'perfect 5th', semitones: 7, degree: 5 },
  { id: 'm6', name: 'minor 6th', semitones: 8, degree: 6 },
  { id: 'M6', name: 'major 6th', semitones: 9, degree: 6 },
  { id: 'm7', name: 'minor 7th', semitones: 10, degree: 7 },
  { id: 'M7', name: 'major 7th', semitones: 11, degree: 7 }
];
const CHORD_TONES = ['m3', 'M3', 'P5', 'm7', 'M7'];
const PITCH_NAMES = ['C', 'C♯ / D♭', 'D', 'D♯ / E♭', 'E', 'F', 'F♯ / G♭', 'G', 'G♯ / A♭', 'A', 'A♯ / B♭', 'B'];
const SHORT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const ROOTS = [{ name: 'C', pc: 0 }, { name: 'D♭', pc: 1 }, { name: 'D', pc: 2 }, { name: 'E♭', pc: 3 }, { name: 'E', pc: 4 }, { name: 'F', pc: 5 }, { name: 'F♯', pc: 6 }, { name: 'G', pc: 7 }, { name: 'A♭', pc: 8 }, { name: 'A', pc: 9 }, { name: 'B♭', pc: 10 }, { name: 'B', pc: 11 }];
const STORAGE_KEY = 'interval-practice-v1';
const $ = id => document.getElementById(id);
const emptyStats = () => ({ total: 0, correct: 0, streak: 0, best: 0, totalAnswerMs: 0, timedAnswers: 0, intervals: {} });
let state = { selected: [...CHORD_TONES], strings: 4, language: 'en', autoNext: false, countdownSeconds: 5, stats: emptyStats() };
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved) {
    const selected = Array.isArray(saved.selected) ? saved.selected.filter(id => INTERVALS.some(i => i.id === id)) : [];
    if (selected.length) state.selected = [...new Set(selected)];
    if ([4, 5, 6].includes(saved.strings)) state.strings = saved.strings;
    if (['en', 'pt-BR'].includes(saved.language)) state.language = saved.language;
    if (typeof saved.autoNext === 'boolean') state.autoNext = saved.autoNext;
    if ([3, 5, 10].includes(saved.countdownSeconds)) state.countdownSeconds = saved.countdownSeconds;
    const s = saved.stats;
    if (s && ['total', 'correct', 'streak', 'best'].every(k => Number.isSafeInteger(s[k]) && s[k] >= 0) && s.correct <= s.total && s.streak <= s.correct && s.best <= s.correct) {
      state.stats = { ...s, totalAnswerMs: 0, timedAnswers: 0, intervals: {} };
      // Older scores have no timing data: average only the measured answers.
      if (Number.isSafeInteger(s.totalAnswerMs) && s.totalAnswerMs >= 0 && Number.isSafeInteger(s.timedAnswers) && s.timedAnswers >= 0 && s.timedAnswers <= s.total && (s.timedAnswers > 0 || s.totalAnswerMs === 0)) {
        state.stats.totalAnswerMs = s.totalAnswerMs;
        state.stats.timedAnswers = s.timedAnswers;
      }
      for (const interval of INTERVALS) {
        const entry = s.intervals?.[interval.id];
        if (entry && Number.isSafeInteger(entry.total) && Number.isSafeInteger(entry.correct) && entry.total >= 0 && entry.correct >= 0 && entry.correct <= entry.total) state.stats.intervals[interval.id] = entry;
      }
    }
  }
} catch { /* Private browsing or unavailable storage: practice still works. */ }
let question;
let questionNumber = 0;
let countdownHandle = null;
let countdownDeadline = null;
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* Storage unavailable: keep settings and scores in memory. */ }
}

function spelledTarget(root, interval) {
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const natural = [0, 2, 4, 5, 7, 9, 11];
  const index = (letters.indexOf(root.name[0]) + interval.degree - 1) % 7;
  const target = (root.pc + interval.semitones) % 12;
  let accidental = (target - natural[index] + 12) % 12;
  if (accidental > 6) accidental -= 12;
  return letters[index] + (accidental > 0 ? '♯'.repeat(accidental) : '♭'.repeat(-accidental));
}

// Keep the existing chromatic button order, but spell each pitch by its
// interval from the root. The tritone uses the augmented-fourth spelling,
// matching the question's target note.
function answerNames(root) {
  const names = Array(12);
  names[root.pc] = root.name;
  for (const interval of INTERVALS) {
    names[(root.pc + interval.semitones) % 12] = spelledTarget(root, interval);
  }
  return names;
}

function renderSettings() {
  $('interval-options').innerHTML = INTERVALS.map(i => `<label class="interval-option ${state.selected.includes(i.id) ? 'selected' : ''}"><input type="checkbox" value="${i.id}" ${state.selected.includes(i.id) ? 'checked' : ''}><span class="check-box" aria-hidden="true">✓</span><span class="${i.id === 'TT' ? 'long-label' : ''}">${intervalName(i)}</span><span class="interval-abbr">${i.id === 'TT' ? '±4' : i.id}</span></label>`).join('');
  $('select-all').textContent = t(state.selected.length === INTERVALS.length ? 'chordTones' : 'selectAll');
  document.querySelectorAll('[data-strings]').forEach(b => {
    const active = Number(b.dataset.strings) === state.strings;
    b.classList.toggle('active', active);
    b.setAttribute('aria-pressed', String(active));
    b.textContent = t('strings', { count: b.dataset.strings });
  });
  document.querySelectorAll('[data-advance]').forEach(button => {
    const active = (button.dataset.advance === 'countdown') === state.autoNext;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('countdown-options').hidden = !state.autoNext;
  $('countdown-seconds').value = String(state.countdownSeconds);
  document.querySelectorAll('#countdown-seconds option').forEach(option => {
    option.textContent = t('seconds', { count: option.value });
  });
}

function stopCountdown() {
  if (countdownHandle !== null) clearTimeout(countdownHandle);
  countdownHandle = null;
  countdownDeadline = null;
}

function renderAdvance() {
  $('next-question').hidden = state.autoNext;
  $('next-question').disabled = !question.answered || state.autoNext;
  $('next-countdown').hidden = !state.autoNext || !question.answered;
  if (state.autoNext && question.answered) {
    const remaining = countdownDeadline === null ? state.countdownSeconds : Math.max(0, Math.ceil((countdownDeadline - Date.now()) / 1000));
    const label = t('nextIn', { count: remaining });
    if ($('countdown-label').textContent !== label) $('countdown-label').textContent = label;
  }
}

function startCountdown() {
  stopCountdown();
  if (!state.autoNext || !question.answered) { renderAdvance(); return; }
  const answeredQuestion = question;
  countdownDeadline = Date.now() + state.countdownSeconds * 1000;
  function tick() {
    // Never let a stale timer skip a newer question or advance in manual mode.
    if (question !== answeredQuestion || !state.autoNext || !question.answered) {
      stopCountdown();
      renderAdvance();
      return;
    }
    if (Date.now() >= countdownDeadline) {
      newQuestion();
      return;
    }
    renderAdvance();
    countdownHandle = setTimeout(tick, 250);
  }
  tick();
}

function newQuestion(first = false) {
  stopCountdown();
  const previous = question;
  const intervalId = state.selected[Math.floor(Math.random() * state.selected.length)];
  const interval = INTERVALS.find(i => i.id === intervalId);
  let root = ROOTS[Math.floor(Math.random() * ROOTS.length)];
  if (first) root = ROOTS[0];
  else if (previous && previous.root.pc === root.pc && previous.interval.id === interval.id) root = ROOTS[(root.pc + 5) % 12];
  question = { root, interval, target: (root.pc + interval.semitones) % 12, targetName: spelledTarget(root, interval), answered: false };
  questionNumber++;
  renderQuestion();
  question.startedAt = performance.now();
}
function renderQuestion() {
  $('question-number').textContent = t('question', { number: String(questionNumber).padStart(2, '0') });
  $('root-note').textContent = question.root.name;
  $('interval-short').textContent = question.interval.id === 'TT' ? 'A4 / d5' : question.interval.id;
  $('interval-short').style.fontSize = question.interval.id === 'TT' ? '19px' : '';
  $('target-note').textContent = '?';
  document.querySelector('.answer-tile').classList.remove('revealed');
  $('answer-grid').innerHTML = answerNames(question.root).map((name, pc) => `<button class="note-button ${name.length > 2 ? 'accidental' : ''}" data-pitch="${pc}" aria-label="${name}">${name}</button>`).join('');
  $('feedback').className = 'feedback';
  $('feedback').innerHTML = `<span class="feedback-icon">✧</span><span>${t('waiting')}</span>`;
  $('next-question').disabled = true;
  if (question.answered) renderAnsweredQuestion();
  if (question.notice) $('feedback').innerHTML = `<span class="feedback-icon">ⓘ</span><span>${t(question.notice)}</span>`;
  renderCircle();
  renderFretboard();
  renderAdvance();
}

function answer(pc) {
  if (question.answered) return;
  question.answered = true;
  question.answerPc = pc;
  delete question.notice;
  const correct = pc === question.target;
  const stats = state.stats;
  question.answerMs = Math.max(0, Math.round(performance.now() - question.startedAt));
  stats.totalAnswerMs += question.answerMs;
  stats.timedAnswers++;
  stats.total++;
  if (correct) stats.correct++;
  stats.streak = correct ? stats.streak + 1 : 0;
  stats.best = Math.max(stats.best, stats.streak);
  const entry = stats.intervals[question.interval.id] ||= { total: 0, correct: 0 };
  entry.total++;
  if (correct) entry.correct++;
  save();
  renderAnsweredQuestion();
  renderStats();
  renderCircle();
  renderFretboard();
  startCountdown();
  if (!state.autoNext) $('next-question').focus({ preventScroll: true });
}

// Re-render feedback without recording an answer again when the language changes.
function renderAnsweredQuestion() {
  const pc = question.answerPc;
  const correct = pc === question.target;
  document.querySelectorAll('.note-button').forEach(b => {
    b.disabled = true;
    if (Number(b.dataset.pitch) === question.target) b.classList.add('correct');
    else if (Number(b.dataset.pitch) === pc) b.classList.add('incorrect');
  });
  $('target-note').textContent = question.targetName;
  document.querySelector('.answer-tile').classList.add('revealed');
  $('feedback').className = `feedback ${correct ? 'is-correct' : 'is-wrong'}`;
  const targetLabel = PITCH_NAMES[question.target].split(' / ').includes(question.targetName) ? question.targetName : `${question.targetName} (${SHORT_NAMES[question.target]})`;
  $('feedback').innerHTML = `<span class="feedback-icon">${correct ? '✓' : '↗'}</span><span>${t(correct ? 'correct' : 'incorrect', { root: question.root.name, target: targetLabel })}</span>`;
  renderAdvance();
}

function renderCircle() {
  const order = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  const positions = order.map((pc, i) => {
    const angle = i * Math.PI / 6 - Math.PI / 2;
    return { pc, x: 140 + 108 * Math.cos(angle), y: 140 + 108 * Math.sin(angle) };
  });
  const root = positions.find(p => p.pc === question.root.pc);
  const target = positions.find(p => p.pc === question.target);
  const connection = question.answered ? `<path d="M ${root.x} ${root.y} Q 140 140 ${target.x} ${target.y}" fill="none" stroke="#d6ae7d" stroke-width="1.7" stroke-dasharray="4 4"/>` : '';
  $('circle').innerHTML = `<svg viewBox="0 0 280 280" role="img" aria-label="${t('circleAria', { root: question.root.name })}${question.answered ? t('circleTargetAria', { target: question.targetName }) : ''}"><circle cx="140" cy="140" r="108" fill="none" stroke="#edf0ee"/><circle cx="140" cy="140" r="79" fill="none" stroke="#f0f3f1" stroke-dasharray="2 5"/>${connection}${positions.map(p => {
    const type = p.pc === question.root.pc ? 'root' : question.answered && p.pc === question.target ? 'target' : '';
    const name = type === 'root' ? question.root.name : type === 'target' ? question.targetName : answerNames(question.root)[p.pc];
    return `<circle class="circle-node ${type}" cx="${p.x}" cy="${p.y}" r="18"/><text class="circle-note ${type}" x="${p.x}" y="${p.y + 4.5}" text-anchor="middle">${name}</text>`;
  }).join('')}</svg>`;
}

function renderFretboard() {
  // MIDI values keep octave and direction intact when finding playable interval pairs.
  const tuning = state.strings === 4 ? [43, 38, 33, 28] : state.strings === 5 ? [43, 38, 33, 28, 23] : [48, 43, 38, 33, 28, 23];
  const width = 850, left = 61, step = 60, top = 36, row = 35;
  const bottom = top + (tuning.length - 1) * row;
  const height = bottom + 30;
  const x = fret => fret === 0 ? 36 : left + (fret - .5) * step;
  const notes = [];
  tuning.forEach((midi, string) => {
    for (let fret = 0; fret <= 12; fret++) notes.push({ midi: midi + fret, pc: (midi + fret) % 12, string, fret, x: x(fret), y: top + string * row });
  });
  const roots = notes.filter(n => n.pc === question.root.pc);
  const targets = notes.filter(n => n.pc === question.target);
  let svg = `<svg class="fretboard-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${t('fretboardAria', { count: state.strings, root: question.root.name })}${question.answered ? t('fretboardTargetAria', { target: question.targetName, interval: intervalName(question.interval) }) : '.'}"><rect x="${left}" y="${top - 16}" width="720" height="${bottom - top + 32}" rx="4" fill="#faf9f6"/>`;
  [3, 5, 7, 9, 12].forEach(fret => {
    svg += `<circle cx="${x(fret)}" cy="${(top + bottom) / 2 - (fret === 12 ? 7 : 0)}" r="3.5" fill="#e3e3d9"/>`;
    if (fret === 12) svg += `<circle cx="${x(fret)}" cy="${(top + bottom) / 2 + 7}" r="3.5" fill="#e3e3d9"/>`;
  });
  for (let f = 0; f <= 12; f++) {
    svg += `<text x="${x(f)}" y="14" text-anchor="middle" fill="#9ca5a0" font-size="9">${f}</text>`;
    if (f > 0) svg += `<line x1="${left + f * step}" x2="${left + f * step}" y1="${top - 16}" y2="${bottom + 16}" stroke="#e0e0d9" stroke-width="1.5"/>`;
  }
  svg += `<line x1="${left}" x2="${left}" y1="${top - 16}" y2="${bottom + 16}" stroke="#b6bbb4" stroke-width="4"/>`;
  tuning.forEach((midi, s) => {
    svg += `<text x="9" y="${top + s * row + 3.5}" text-anchor="middle" fill="#77877f" font-size="10">${SHORT_NAMES[midi % 12]}</text><line x1="23" x2="781" y1="${top + s * row}" y2="${top + s * row}" stroke="#c5cac4" stroke-width="${1 + s * .25}"/>`;
  });
  notes.forEach(n => {
    const isRoot = n.pc === question.root.pc;
    const isTarget = question.answered && n.pc === question.target;
    if (!isRoot && !isTarget) return;
    const label = isRoot ? question.root.name : question.targetName;
    svg += `<circle cx="${n.x}" cy="${n.y}" r="11" fill="${isRoot ? '#287d68' : '#d59353'}" stroke="white" stroke-width="2"/><text x="${n.x}" y="${n.y + 3.2}" text-anchor="middle" fill="white" font-size="${label.length > 2 ? 7 : 9}" font-weight="600">${label}</text>`;
  });
  $('fretboard').innerHTML = svg + '</svg>';
}

function renderStats() {
  const s = state.stats;
  const accuracy = s.total ? Math.round(s.correct / s.total * 100) : 0;
  $('accuracy').textContent = s.total ? `${accuracy}%` : '—';
  $('correct-count').innerHTML = `${s.correct}<span> / ${s.total}</span>`;
  $('streak').innerHTML = `${s.streak}<span class="streak-flame">♨</span>`;
  $('answer-time').textContent = s.timedAnswers
    ? `${new Intl.NumberFormat(state.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(s.totalAnswerMs / s.timedAnswers / 1000)}s`
    : '—';
  $('stats-details').innerHTML = INTERVALS.map(i => {
    const entry = s.intervals[i.id];
    return `<div class="detail-row"><span>${intervalName(i)}</span><strong>${entry?.total ? `${entry.correct}/${entry.total} · ${Math.round(entry.correct / entry.total * 100)}%` : t('notPracticed')}</strong></div>`;
  }).join('');
}

$('interval-options').addEventListener('change', event => {
  if (!event.target.matches('input')) return;
  const id = event.target.value;
  if (!event.target.checked && state.selected.length === 1) {
    event.target.checked = true;
    question.notice = 'keepOne';
    $('feedback').innerHTML = `<span class="feedback-icon">ⓘ</span><span>${t('keepOne')}</span>`;
    return;
  }
  state.selected = event.target.checked ? [...state.selected, id] : state.selected.filter(v => v !== id);
  save();
  renderSettings();
  if (!question.answered && !state.selected.includes(question.interval.id)) newQuestion();
});
function setIntervals(ids) {
  state.selected = [...ids];
  save();
  renderSettings();
  if (!question.answered && !state.selected.includes(question.interval.id)) newQuestion();
}
$('select-all').addEventListener('click', () => setIntervals(state.selected.length === INTERVALS.length ? CHORD_TONES : INTERVALS.map(i => i.id)));
$('string-count').addEventListener('click', event => {
  const button = event.target.closest('[data-strings]');
  if (!button) return;
  state.strings = Number(button.dataset.strings);
  save();
  renderSettings();
  renderFretboard();
});
$('answer-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-pitch]');
  if (button) answer(Number(button.dataset.pitch));
});
$('next-question').addEventListener('click', () => { if (question.answered && !state.autoNext) newQuestion(); });
$('advance-mode').addEventListener('click', event => {
  const button = event.target.closest('[data-advance]');
  if (!button) return;
  const autoNext = button.dataset.advance === 'countdown';
  if (autoNext === state.autoNext) return;
  state.autoNext = autoNext;
  save();
  renderSettings();
  startCountdown();
});
$('countdown-seconds').addEventListener('change', event => {
  const seconds = Number(event.target.value);
  if (![3, 5, 10].includes(seconds)) return;
  state.countdownSeconds = seconds;
  save();
  renderSettings();
  startCountdown();
});
$('reset-stats').addEventListener('click', () => {
  if (!state.stats.total || window.confirm(t('resetConfirm'))) {
    state.stats = emptyStats();
    save();
    renderStats();
  }
});
$('details-toggle').addEventListener('click', () => {
  const hidden = !$('stats-details').hidden;
  $('stats-details').hidden = hidden;
  $('details-toggle').setAttribute('aria-expanded', String(!hidden));
  $('details-toggle').innerHTML = `${t('breakdown')} <span>${hidden ? '⌄' : '⌃'}</span>`;
});
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
  const index = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].indexOf(event.key);
  if (index >= 0 && !question.answered) { event.preventDefault(); answer(index); }
  else if (event.key === 'Enter' && question.answered && !state.autoNext && event.target === document.body) { event.preventDefault(); newQuestion(); }
});
document.querySelector('.language-switch').addEventListener('click', event => {
  const button = event.target.closest('[data-language]');
  if (!button || button.dataset.language === state.language) return;
  state.language = button.dataset.language;
  save();
  renderLanguage();
  renderSettings();
  renderStats();
  renderQuestion();
});
renderLanguage();
renderSettings();
renderStats();
newQuestion(true);
save();

// Keep these panels equally tall even when responsive layout stacks them.
if (typeof ResizeObserver !== 'undefined') {
  const quizPanel = document.querySelector('.quiz-panel');
  const circlePanel = document.querySelector('.circle-panel');
  const matchPanelHeight = () => {
    circlePanel.style.height = `${quizPanel.getBoundingClientRect().height}px`;
  };
  const panelHeightObserver = new ResizeObserver(matchPanelHeight);
  panelHeightObserver.observe(quizPanel, { box: 'border-box' });
  matchPanelHeight();
}

