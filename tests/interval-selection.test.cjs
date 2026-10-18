const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

test('all selected intervals appear before any interval repeats', () => {
  const app = loadApp();
  app.api.state.selected = app.api.INTERVALS.map(interval => interval.id);
  app.api.resetIntervalDeck();
  const selected = new Set(app.api.state.selected);
  let previous = app.api.question.interval.id;
  const seen = new Set();
  for (let i = 0; i < selected.size; i++) {
    app.api.newQuestion();
    const id = app.api.question.interval.id;
    assert.ok(selected.has(id), `only selected interval generated: ${id}`);
    assert.notEqual(id, previous, 'adjacent questions do not repeat an interval');
    assert.ok(!seen.has(id), `interval appears once in shuffled round: ${id}`);
    seen.add(id);
    previous = id;
  }
  assert.deepEqual(seen, selected);
});

test('interval changes start a new round containing only the new selection', () => {
  const app = loadApp();
  app.api.state.selected = app.api.INTERVALS.map(interval => interval.id);
  app.api.resetIntervalDeck();
  for (let i = 0; i < 3; i++) app.api.newQuestion();
  app.api.state.selected = ['P4', 'TT'];
  app.api.resetIntervalDeck();
  app.api.newQuestion();
  const first = app.api.question.interval.id;
  assert.ok(['P4', 'TT'].includes(first));
  app.api.newQuestion();
  assert.notEqual(app.api.question.interval.id, first);
  assert.ok(['P4', 'TT'].includes(app.api.question.interval.id));
});

test('one selected interval continues to generate normally', () => {
  const app = loadApp();
  app.api.state.selected = ['TT'];
  app.api.resetIntervalDeck();
  for (let i = 0; i < 5; i++) {
    app.api.newQuestion();
    assert.equal(app.api.question.interval.id, 'TT');
  }
});
