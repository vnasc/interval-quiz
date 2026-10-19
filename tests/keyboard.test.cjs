const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

function press(app, key, options = {}) {
  let prevented = false;
  app.listeners.get('keydown')({
    key, target: { tagName: 'BODY' }, shiftKey: false,
    preventDefault() { prevented = true; }, ...options
  });
  return prevented;
}

test('note letters answer with natural pitches, regardless of letter case', () => {
  for (const [letter, pitch] of Object.entries({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 })) {
    for (const key of [letter, letter.toUpperCase()]) {
      const app = loadApp();
      assert.equal(press(app, key), true);
      assert.equal(app.api.question.answerPc, pitch);
    }
  }
});

test('Shift selects the displayed accidental for that letter, including flats', () => {
  for (const [key, pitch] of Object.entries({ D: 1, E: 3, F: 6, A: 8, B: 10 })) {
    const app = loadApp();
    assert.equal(press(app, key, { shiftKey: true }), true);
    assert.equal(app.api.question.answerPc, pitch);
  }
});

test('shortcuts follow displayed spellings for every root, including double accidentals', () => {
  const app = loadApp();
  for (const root of app.api.ROOTS) {
    const names = app.api.answerNames(root);
    for (const letter of 'ABCDEFG') {
      for (const shiftKey of [false, true]) {
        const matches = names.map((name, pitch) => ({ name, pitch }))
          .filter(option => option.name[0] === letter)
          .sort((a, b) => a.name.length - b.name.length);
        const option = shiftKey
          ? matches.filter(option => option.name.length > 1).at(-1)
          : matches.find(option => option.name.length === 1) || (matches.length > 1 ? matches[0] : undefined);
        const pitch = option?.pitch ?? -1;
        app.api.setQuestion({ ...app.api.question, root, answered: false });
        assert.equal(press(app, letter, { shiftKey }), pitch >= 0);
        assert.equal(app.api.question.answered, pitch >= 0);
        if (pitch >= 0) assert.equal(app.api.question.answerPc, pitch);
      }
    }
  }
});

test('E selects E flat and Shift+E selects E double-flat when both are shown', () => {
  for (const [shiftKey, expectedName, expectedPitch] of [[false, 'E♭', 3], [true, 'E♭♭', 2]]) {
    const app = loadApp();
    const root = app.api.ROOTS.find(root => root.name === 'D♭');
    app.api.setQuestion({ ...app.api.question, root, answered: false });
    assert.equal(app.api.answerNames(root)[expectedPitch], expectedName);
    assert.equal(press(app, 'e', { shiftKey }), true);
    assert.equal(app.api.question.answerPc, expectedPitch);
  }
});

test('old shortcuts and unrelated keys do not answer', () => {
  const app = loadApp();
  for (const key of ['1', '0', '-', '=', 'x', 'Shift']) {
    assert.equal(press(app, key), false);
    assert.equal(app.api.question.answered, false);
  }
});

test('typing in controls, editing, composing, repeats and modified shortcuts are ignored', () => {
  for (const options of [
    { ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true },
    { isComposing: true }, { target: { isContentEditable: true } },
    ...['INPUT', 'SELECT', 'TEXTAREA'].map(tagName => ({ target: { tagName } }))
  ]) {
    const app = loadApp();
    assert.equal(press(app, 'c', options), false);
    assert.equal(app.api.question.answered, false);
  }
});

test('note shortcuts only record one answer per question', () => {
  const app = loadApp();
  press(app, 'c');
  assert.equal(press(app, 'd'), false);
  assert.equal(app.api.question.answerPc, 0);
  assert.equal(app.api.state.stats.total, 1);
});
