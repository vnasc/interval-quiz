const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

function mockAudio(app, state = 'running') {
  app.api.state.audioEnabled = true;
  const notes = [];
  const partials = [];
  const ctx = {
    state, currentTime: 0, destination: {},
    resume() { this.state = 'running'; return Promise.resolve(); },
    createOscillator() {
      return { frequency: {}, connect() {}, disconnect() {},
        start(start) {
          const partial = { frequency: this.frequency.value, start, type: this.type };
          partials.push(partial);
          // One note consists of multiple partials sharing a start time.
          if (!notes.some(note => note.start === start)) notes.push(partial);
        }, stop() {} };
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
    }
  };
  app.context.window.AudioContext = function () { return ctx; };
  return { notes, partials, ctx };
}
const frequency = midi => 440 * Math.pow(2, (midi - 69) / 12);

test('each note has four sine harmonics with a strong fundamental', () => {
  const app = loadApp();
  const { partials } = mockAudio(app);
  app.api.answer(app.api.question.target);
  assert.equal(partials.length, 8);
  for (const offset of [0, 4]) {
    const fundamental = partials[offset];
    for (let i = 0; i < 4; i++) {
      assert.equal(partials[offset + i].type, 'sine');
      assert.equal(partials[offset + i].frequency, fundamental.frequency * (i + 1));
      assert.equal(partials[offset + i].start, fundamental.start);
    }
  }
});

test('audio defaults off and invalid saved preferences are ignored', () => {
  for (const saved of [null, { audioEnabled: 'true', audioDirection: 'invalid' }]) {
    const app = loadApp(saved);
    assert.equal(app.api.state.audioEnabled, false);
    assert.equal(app.api.state.audioDirection, 'ascending');
    const { notes } = mockAudio(app);
    app.api.state.audioEnabled = false;
    app.api.answer(app.api.question.target);
    assert.equal(notes.length, 0);
  }
});

test('controls save preferences and restore them on reload', () => {
  const app = loadApp();
  let saved;
  app.context.localStorage.setItem = (key, value) => { saved = JSON.parse(value); };
  app.element('audio-toggle').handlers.get('click')();
  app.element('audio-direction').handlers.get('click')();
  assert.equal(saved.audioEnabled, true);
  assert.equal(saved.audioDirection, 'descending');
  const restored = loadApp(saved);
  assert.equal(restored.api.state.audioEnabled, true);
  assert.equal(restored.api.state.audioDirection, 'descending');
  app.element('audio-direction').handlers.get('click')();
  app.element('audio-toggle').handlers.get('click')();
  assert.equal(saved.audioEnabled, false);
  assert.equal(saved.audioDirection, 'ascending');
});

test('direction control is disabled while audio is off', () => {
  const app = loadApp();
  assert.equal(app.element('audio-direction').disabled, true);
  app.element('audio-direction').handlers.get('click')();
  assert.equal(app.api.state.audioDirection, 'ascending');
  app.element('audio-toggle').handlers.get('click')();
  assert.equal(app.element('audio-direction').disabled, false);
  app.element('audio-direction').handlers.get('click')();
  assert.equal(app.api.state.audioDirection, 'descending');
  app.element('audio-toggle').handlers.get('click')();
  assert.equal(app.element('audio-direction').disabled, true);
  assert.equal(app.api.state.audioDirection, 'descending');
});

test('descending plays selected pitch then root for every root and answer', () => {
  for (let root = 0; root < 12; root++) {
    for (let offset = 0; offset < 12; offset++) {
      const app = loadApp({ audioEnabled: true, audioDirection: 'descending' });
      const { notes } = mockAudio(app);
      app.api.question.root = { name: 'C', pc: root };
      app.api.answer((root + offset) % 12);
      assert.deepEqual(notes.map(n => n.frequency), [frequency(48 + root + offset), frequency(48 + root)]);
    }
  }
});

test('direction changes replay a selected answer in the new direction', () => {
  const app = loadApp();
  const { notes } = mockAudio(app);
  app.api.question.root = { name: 'C', pc: 0 };
  app.api.answer(7);
  const total = app.api.state.stats.total;
  notes.length = 0;
  app.element('audio-direction').handlers.get('click')();
  assert.deepEqual(notes.map(n => n.frequency), [frequency(55), frequency(48)]);
  notes.length = 0;
  app.element('audio-direction').handlers.get('click')();
  assert.deepEqual(notes.map(n => n.frequency), [frequency(48), frequency(55)]);
  assert.equal(app.api.state.stats.total, total);
});

test('direction changes before answering do not play audio', () => {
  const app = loadApp();
  const { notes } = mockAudio(app);
  app.element('audio-direction').handlers.get('click')();
  assert.equal(notes.length, 0);
});

test('muting cancels playback waiting for audio to resume', async () => {
  const app = loadApp();
  const { notes } = mockAudio(app, 'suspended');
  app.api.answer(app.api.question.target);
  app.element('audio-toggle').handlers.get('click')();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notes.length, 0);
});

test('new questions and rendering remain silent', () => {
  const app = loadApp();
  const { notes } = mockAudio(app);
  app.api.newQuestion();
  app.api.renderQuestion();
  assert.deepEqual(notes, []);
});

test('answers play root then selected pitch ascending, only once', () => {
  for (const correct of [true, false]) {
    const app = loadApp();
    const { notes } = mockAudio(app);
    app.api.question.root = { name: 'B', pc: 11 };
    app.api.question.target = correct ? 0 : 1;
    app.api.answer(0);
    assert.deepEqual(notes.map(n => n.frequency), [frequency(59), frequency(60)]);
    assert.equal(notes[0].start, 0.25, 'wait a quarter of a second before playing the root');
    assert.ok(Math.abs(notes[1].start - notes[0].start - 0.7) < 1e-9);
    app.api.answer(1);
    assert.equal(notes.length, 2);
  }
});

test('suspended audio resumes and plays both notes', async () => {
  const app = loadApp();
  const { notes } = mockAudio(app, 'suspended');
  app.api.answer(app.api.question.target);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notes.length, 2);
});

test('advancing cancels an answer waiting for audio to resume', async () => {
  const app = loadApp();
  const { notes } = mockAudio(app, 'suspended');
  app.api.answer(app.api.question.target);
  app.api.newQuestion();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notes.length, 0);
});

test('audio errors do not prevent answering or advancing', () => {
  const app = loadApp();
  app.api.state.audioEnabled = true;
  app.context.window.AudioContext = function () { throw new Error('unavailable'); };
  app.api.answer(app.api.question.target);
  assert.equal(app.api.state.stats.total, 1);
  app.api.newQuestion();
  assert.equal(app.api.question.answered, false);
});
