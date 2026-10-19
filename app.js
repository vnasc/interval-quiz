(() => {
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
  const SHORT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const ROOTS = [{ name: 'C', pc: 0 }, { name: 'D♭', pc: 1 }, { name: 'D', pc: 2 }, { name: 'E♭', pc: 3 }, { name: 'E', pc: 4 }, { name: 'F', pc: 5 }, { name: 'F♯', pc: 6 }, { name: 'G', pc: 7 }, { name: 'A♭', pc: 8 }, { name: 'A', pc: 9 }, { name: 'B♭', pc: 10 }, { name: 'B', pc: 11 }];
  const STORAGE_KEY = 'interval-practice-v1';
  const $ = id => document.getElementById(id);
  const emptyStats = () => ({ total: 0, correct: 0, streak: 0, best: 0, totalAnswerMs: 0, timedAnswers: 0 });
  const browserLocale = globalThis.navigator?.languages?.[0] || globalThis.navigator?.language || '';
  const defaultLanguage = /^pt-BR(?:-|$)/i.test(browserLocale) ? 'pt-BR' : 'en';
  let state = { selected: [...CHORD_TONES], strings: 4, language: defaultLanguage, autoNext: false, countdownSeconds: 5, audioEnabled: false, audioDirection: 'ascending', stats: emptyStats() };
  const { t, intervalName, renderLanguage } = createI18n(() => state.language, $);

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved) {
      const selected = Array.isArray(saved.selected) ? saved.selected.filter(id => INTERVALS.some(i => i.id === id)) : [];
      if (selected.length) state.selected = [...new Set(selected)];
      if ([4, 5, 6].includes(saved.strings)) state.strings = saved.strings;
      if (['en', 'pt-BR'].includes(saved.language)) state.language = saved.language;
      if (typeof saved.autoNext === 'boolean') state.autoNext = saved.autoNext;
      if ([3, 5].includes(saved.countdownSeconds)) state.countdownSeconds = saved.countdownSeconds;
      if (typeof saved.audioEnabled === 'boolean') state.audioEnabled = saved.audioEnabled;
      if (['ascending', 'descending'].includes(saved.audioDirection)) state.audioDirection = saved.audioDirection;
      const s = saved.stats;

      if (s && ['total', 'correct', 'streak', 'best'].every(k => Number.isSafeInteger(s[k]) && s[k] >= 0) && s.correct <= s.total && s.streak <= s.correct && s.best <= s.correct) {
        state.stats = { total: s.total, correct: s.correct, streak: s.streak, best: s.best, totalAnswerMs: 0, timedAnswers: 0 };

        // Older scores have no timing data: average only the measured answers.
        if (Number.isSafeInteger(s.totalAnswerMs) && s.totalAnswerMs >= 0 && Number.isSafeInteger(s.timedAnswers) && s.timedAnswers >= 0 && s.timedAnswers <= s.total && (s.timedAnswers > 0 || s.totalAnswerMs === 0)) {
          state.stats.totalAnswerMs = s.totalAnswerMs;
          state.stats.timedAnswers = s.timedAnswers;
        }

      }
    }
  } catch { /* Private browsing or unavailable storage: practice still works. */ }

  let question;
  let questionNumber = 0;
  let intervalDeck = [];
  let countdownHandle = null;
  let countdownDeadline = null;
  let shiftHeld = false;
  let audioContext;
  let playbackId = 0;
  const activeOscillators = new Set();

  function stopAudio() {
    playbackId++;
    activeOscillators.forEach(osc => { try { osc.stop(); } catch {} });
    activeOscillators.clear();
  }

  function renderAudioControls() {
    const speaker = '<path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    const sound = state.audioEnabled
      ? '<path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
      : '<path d="m16 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    $('audio-direction').disabled = !state.audioEnabled;
    const descending = state.audioDirection === 'descending';
    const direction = descending ? 'M5 5 19 19m-8 0h8v-8' : 'M5 19 19 5m-8 0h8v8';
    for (const [id, icon, label, pressed] of [
      ['audio-toggle', speaker + sound, t(state.audioEnabled ? 'audioOn' : 'audioOff'), state.audioEnabled],
      ['audio-direction', `<path d="${direction}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`, t(descending ? 'audioDescending' : 'audioAscending'), descending]
    ]) {
      const button = $(id);
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${icon}</svg>`;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(pressed));
      button.title = label;
      button.classList.toggle('active', id === 'audio-toggle' ? state.audioEnabled : descending);
    }
  }

  async function playAnswer(rootPc, answerPc) {
    if (!state.audioEnabled) return;
    stopAudio();
    const id = playbackId;
    const descending = state.audioDirection === 'descending';
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioContext ||= new AudioContext();
      const ctx = audioContext;
      if (ctx.state === 'suspended') await ctx.resume();
      // Never play a stale answer if resuming audio takes a while.
      if (id !== playbackId || !state.audioEnabled || ctx.state !== 'running') return;
      const base = ctx.currentTime + 0.25;
      const duration = 0.6;
      // Keep the selected note above the root when its pitch class wraps past B.
      const rootMidi = 48 + rootPc;
      const notes = [rootMidi, rootMidi + (answerPc - rootPc + 12) % 12];

      if (descending) notes.reverse();

      notes.forEach((midi, index) => {
        const start = base + index * 0.7;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        activeOscillators.add(osc);
        osc.onended = () => { activeOscillators.delete(osc); osc.disconnect(); gain.disconnect(); };
        osc.start(start);
        osc.stop(start + duration + 0.03);
      });
    } catch { /* Audio unavailable or blocked: the quiz still works silently. */ }
  }

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

  function keyboardOption(letter, shiftKey) {
    const candidates = answerNames(question.root)
      .map((name, pitch) => ({ name, pitch }))
      .filter(option => option.name[0] === letter)
      .sort((a, b) => a.name.length - b.name.length);
    // Use the simpler spelling normally and the other with Shift, including
    // cases such as E♭ and E♭♭ where both options have accidentals.
    return shiftKey
      ? candidates.filter(option => option.name.length > 1).at(-1)
      : candidates.find(option => option.name.length === 1) || (candidates.length > 1 ? candidates[0] : undefined);
  }

  function renderShiftHighlights() {
    $('answer-grid').classList.toggle('shift-held', shiftHeld && !question.answered);
    const pitches = new Set(shiftHeld && !question.answered
      ? [...'ABCDEFG'].map(letter => keyboardOption(letter, true)?.pitch)
      : []);
    document.querySelectorAll('.note-button').forEach(button => {
      button.classList.toggle('shift-highlight', pitches.has(Number(button.dataset.pitch)));
    });
  }

  function renderSettings() {
    renderAudioControls();
    $('interval-options').innerHTML = INTERVALS.map(i => `<label class="interval-option ${state.selected.includes(i.id) ? 'selected' : ''}"><input type="checkbox" value="${i.id}" ${state.selected.includes(i.id) ? 'checked' : ''}><span class="check-box" aria-hidden="true">✓</span><span class="${i.id === 'TT' ? 'long-label' : ''}">${intervalName(i)}</span><span class="interval-abbr">${i.id === 'TT' ? '±4' : i.id}</span></label>`).join('');
    $('select-all').textContent = t(state.selected.length === INTERVALS.length ? 'chordTones' : 'selectAll');

    document.querySelectorAll('[data-strings]').forEach(b => {
      const active = Number(b.dataset.strings) === state.strings;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
      b.textContent = t('strings', { count: b.dataset.strings });
    });

    document.querySelectorAll('[data-advance]').forEach(button => {
      const seconds = Number(button.dataset.advance);
      const active = seconds === (state.autoNext ? state.countdownSeconds : 0);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = seconds === 0 ? t('advanceManual') : t('seconds', { count: seconds });
    });
  }

  function stopCountdown() {
    if (countdownHandle !== null) clearTimeout(countdownHandle);
    countdownHandle = null;
    countdownDeadline = null;
  }

  function renderAdvance() {
    const counting = state.autoNext && question.answered;
    $('next-question').hidden = !question.answered;
    $('next-question').disabled = !question.answered || state.autoNext;
    $('next-arrow').style.display = counting ? 'none' : '';
    $('countdown-label').hidden = !counting;

    if (counting) {
      const remaining = countdownDeadline === null ? state.countdownSeconds : Math.max(0, Math.ceil((countdownDeadline - Date.now()) / 1000));
      const label = String(remaining);
      if ($('countdown-label').textContent !== label) $('countdown-label').textContent = label;
      $('next-question').setAttribute('aria-label', t('nextIn', { count: remaining }));
    } else {
      $('next-question').setAttribute('aria-label', t('next'));
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

  function drawIntervalId() {
    if (!intervalDeck.length) {
      intervalDeck = [...state.selected];

      for (let i = intervalDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [intervalDeck[i], intervalDeck[j]] = [intervalDeck[j], intervalDeck[i]];
      }

      // Avoid a repeat right at the boundary between shuffled rounds.
      if (intervalDeck.length > 1 && question?.interval.id === intervalDeck[intervalDeck.length - 1]) {
        [intervalDeck[0], intervalDeck[intervalDeck.length - 1]] = [intervalDeck[intervalDeck.length - 1], intervalDeck[0]];
      }
    }

    return intervalDeck.pop();
  }

  function newQuestion(first = false) {
    stopCountdown();
    const previous = question;
    const intervalId = drawIntervalId();
    const interval = INTERVALS.find(i => i.id === intervalId);
    let root = ROOTS[Math.floor(Math.random() * ROOTS.length)];
    if (first) root = ROOTS[0];
    else if (previous && previous.root.pc === root.pc && previous.interval.id === interval.id) root = ROOTS[(root.pc + 5) % 12];
    question = { root, interval, target: (root.pc + interval.semitones) % 12, targetName: spelledTarget(root, interval), answered: false };
    questionNumber++;
    renderQuestion();
    question.startedAt = performance.now();
    stopAudio();
  }

  function renderQuestion() {
    $('root-note').textContent = question.root.name;
    $('interval-short').textContent = question.interval.id === 'TT' ? 'A4 / d5' : question.interval.id;
    $('interval-short').style.fontSize = question.interval.id === 'TT' ? '19px' : '';
    $('target-note').textContent = '?';
    document.querySelector('.answer-tile').classList.remove('revealed', 'correct', 'incorrect');
    $('answer-grid').innerHTML = answerNames(question.root).map((name, pc) => `<button class="note-button ${name.length > 2 ? 'accidental' : ''}" data-pitch="${pc}" aria-label="${name}">${name}</button>`).join('');
    $('next-question').disabled = true;
    renderShiftHighlights();
    if (question.answered) renderAnsweredQuestion();
    renderCircle();
    renderFretboard();
    renderAdvance();
  }

  function answer(pc) {
    if (question.answered) return;
    playAnswer(question.root.pc, pc);
    question.answered = true;
    question.answerPc = pc;
    const correct = pc === question.target;
    const stats = state.stats;
    question.answerMs = Math.max(0, Math.round(performance.now() - question.startedAt));
    stats.totalAnswerMs += question.answerMs;
    stats.timedAnswers++;
    stats.total++;
    if (correct) stats.correct++;
    stats.streak = correct ? stats.streak + 1 : 0;
    stats.best = Math.max(stats.best, stats.streak);
    save();
    renderAnsweredQuestion();
    renderStats();
    renderCircle();
    renderFretboard();
    startCountdown();
    if (!state.autoNext) $('next-question').focus({ preventScroll: true });
  }

  // Restore answer highlighting without recording an answer again when the language changes.
  function renderAnsweredQuestion() {
    renderShiftHighlights();
    const pc = question.answerPc;

    document.querySelectorAll('.note-button').forEach(b => {
      b.disabled = true;
      if (Number(b.dataset.pitch) === question.target) b.classList.add('correct');
      else if (Number(b.dataset.pitch) === pc) b.classList.add('incorrect');
    });

    $('target-note').textContent = question.targetName;
    document.querySelector('.answer-tile').classList.add('revealed', pc === question.target ? 'correct' : 'incorrect');
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
    const connection = question.answered ? `<path d="M ${root.x} ${root.y} Q 140 140 ${target.x} ${target.y}" fill="none" stroke="var(--green)" stroke-width="2.25" stroke-dasharray="4 4"/>` : '';

    $('circle').innerHTML = `<svg class="correct" viewBox="13 13 254 254" role="img" aria-label="${t('circleAria', { root: question.root.name })}${question.answered ? t('circleTargetAria', { target: question.targetName }) : ''}"><circle cx="140" cy="140" r="108" fill="none" stroke="#a5b2ac"/>${connection}${positions.map(p => {
      const type = p.pc === question.root.pc ? 'root' : question.answered && p.pc === question.target ? 'target' : '';
      const name = type === 'root' ? question.root.name : type === 'target' ? question.targetName : answerNames(question.root)[p.pc];
      return `<circle class="circle-node ${type}" cx="${p.x}" cy="${p.y}" r="18"/><text class="circle-note ${type}" x="${p.x}" y="${p.y + 4.5}" text-anchor="middle">${name}</text>`;
    }).join('')}</svg>`;
  }

  function renderFretboard() {
    // MIDI values keep octave and direction intact when finding playable interval pairs.
    const tuning = state.strings === 4 ? [43, 38, 33, 28] : state.strings === 5 ? [43, 38, 33, 28, 23] : [48, 43, 38, 33, 28, 23];
    const width = 800, left = 61, step = 60, top = 36, row = 35;
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

    // Soften the fretboard guides without dimming the highlighted notes.
    svg += '<g opacity="0.8">';
    [3, 5, 7, 9, 12].forEach(fret => {
      svg += `<circle cx="${x(fret)}" cy="${(top + bottom) / 2 - (fret === 12 ? 7 : 0)}" r="3.5" fill="#929b94"/>`;
      if (fret === 12) svg += `<circle cx="${x(fret)}" cy="${(top + bottom) / 2 + 7}" r="3.5" fill="#929b94"/>`;
    });

    for (let f = 0; f <= 12; f++) {
      svg += `<text x="${x(f)}" y="14" text-anchor="middle" fill="var(--ink)" font-size="10" font-weight="600">${f}</text>`;
      if (f > 0) svg += `<line x1="${left + f * step}" x2="${left + f * step}" y1="${top - 16}" y2="${bottom + 16}" stroke="#89958d" stroke-width="1.5"/>`;
    }

    svg += `<line x1="${left}" x2="${left}" y1="${top - 16}" y2="${bottom + 16}" stroke="#59675e" stroke-width="4"/>`;

    tuning.forEach((midi, s) => {
      svg += `<text x="9" y="${top + s * row + 3.5}" text-anchor="middle" fill="var(--ink)" font-size="11" font-weight="600">${SHORT_NAMES[midi % 12]}</text><line x1="23" x2="781" y1="${top + s * row}" y2="${top + s * row}" stroke="#707e74" stroke-width="${1.25 + s * .25}"/>`;
    });

    svg += '</g>';

    notes.forEach(n => {
      const isRoot = n.pc === question.root.pc;
      const isTarget = question.answered && n.pc === question.target;
      if (!isRoot && !isTarget) return;
      const label = isRoot ? question.root.name : question.targetName;
      svg += `<circle cx="${n.x}" cy="${n.y}" r="11" fill="var(--${isRoot ? 'root' : 'green'})" stroke="white" stroke-width="2"/><text x="${n.x}" y="${n.y + 3.2}" text-anchor="middle" fill="white" font-size="${label.length > 2 ? 7 : 9}" font-weight="600">${label}</text>`;
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

  }

  $('interval-options').addEventListener('change', event => {
    if (!event.target.matches('input')) return;
    const id = event.target.value;

    if (!event.target.checked && state.selected.length === 1) {
      event.target.checked = true;
      return;
    }

    state.selected = event.target.checked ? [...state.selected, id] : state.selected.filter(v => v !== id);
    intervalDeck = [];
    save();
    renderSettings();
    if (!question.answered && !state.selected.includes(question.interval.id)) newQuestion();
  });

  function setIntervals(ids) {
    state.selected = [...ids];
    intervalDeck = [];
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

  $('audio-toggle').addEventListener('click', () => {
    state.audioEnabled = !state.audioEnabled;
    if (!state.audioEnabled) stopAudio();
    save();
    renderAudioControls();
  });

  $('audio-direction').addEventListener('click', () => {
    if (!state.audioEnabled) return;
    state.audioDirection = state.audioDirection === 'ascending' ? 'descending' : 'ascending';
    stopAudio();
    save();
    renderAudioControls();
    if (question.answered) playAnswer(question.root.pc, question.answerPc);
  });

  $('answer-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-pitch]');
    if (button) answer(Number(button.dataset.pitch));
  });

  $('next-question').addEventListener('click', () => { if (question.answered && !state.autoNext) newQuestion(); });

  $('advance-mode').addEventListener('click', event => {
    const button = event.target.closest('[data-advance]');
    if (!button) return;
    const seconds = Number(button.dataset.advance);
    if (![0, 3, 5].includes(seconds)) return;
    if (seconds === (state.autoNext ? state.countdownSeconds : 0)) return;
    state.autoNext = seconds !== 0;
    if (state.autoNext) state.countdownSeconds = seconds;
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

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || event.isComposing || event.target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
    shiftHeld = event.shiftKey || event.key === 'Shift';
    renderShiftHighlights();
    const letter = event.key.toUpperCase();
    const option = /^[A-G]$/.test(letter) ? keyboardOption(letter, event.shiftKey) : undefined;
    const pitch = option?.pitch ?? -1;
    if (pitch >= 0 && !question.answered) {
      event.preventDefault();
      answer(pitch);
    }
    else if (event.key === 'Enter' && question.answered && !state.autoNext && event.target === document.body) { event.preventDefault(); newQuestion(); }
  });

  document.addEventListener('keyup', event => {
    if (event.key !== 'Shift') return;
    shiftHeld = false;
    renderShiftHighlights();
  });

  window.addEventListener('blur', () => {
    shiftHeld = false;
    renderShiftHighlights();
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
})();
