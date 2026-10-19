const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

for (const correct of [true, false]) {
  test(`target colors reflect a ${correct ? 'correct' : 'wrong'} answer across diagrams and tile`, () => {
    const app = loadApp();
    const classes = new Set();
    app.element('.answer-tile').classList = {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); }
    };
    const result = correct ? 'correct' : 'incorrect';
    const color = correct ? 'green' : 'red';
    app.api.answer(correct ? app.api.question.target : (app.api.question.target + 1) % 12);
    assert.ok(classes.has('revealed'));
    assert.ok(classes.has(result));
    assert.match(app.element('circle').innerHTML, new RegExp(`<svg class="${result}"`));
    assert.match(app.element('circle').innerHTML, new RegExp(`stroke="var\\(--${color}\\)"`));
    assert.match(app.element('fretboard').innerHTML, /fill="var\(--root\)"/);
    assert.match(app.element('fretboard').innerHTML, new RegExp(`fill="var\\(--${color}\\)"`));
    app.api.newQuestion();
    assert.equal(classes.size, 0);
    assert.doesNotMatch(app.element('fretboard').innerHTML, /fill="var\(--(?:green|red)\)"/);
  });
}
