const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

const stats = overrides => ({ total: 2, correct: 2, streak: 2, best: 2, intervals: {}, ...overrides });

test('average answer time includes correct and incorrect answers, once each', () => {
  const app = loadApp();
  assert.equal(app.element('answer-time').textContent, '—');
  app.advance(1200);
  app.api.answer(app.api.question.target);
  assert.equal(app.api.question.answerMs, 1200);
  assert.equal(app.element('answer-time').textContent, '1.2s');
  app.advance(5000);
  app.api.answer(app.api.question.target);
  assert.equal(app.api.state.stats.timedAnswers, 1);
  app.api.newQuestion();
  app.advance(3800);
  app.api.answer((app.api.question.target + 1) % 12);
  assert.equal(app.api.state.stats.totalAnswerMs, 5000);
  assert.equal(app.api.state.stats.timedAnswers, 2);
  assert.equal(app.element('answer-time').textContent, '2.5s');
});

test('countdown and time spent reviewing an answer are excluded', () => {
  const app = loadApp({ autoNext: true, countdownSeconds: 3 });
  app.advance(1200);
  app.api.answer(app.api.question.target);
  app.advance(3000);
  assert.equal(app.api.questionNumber, 2);
  app.advance(2000);
  app.api.answer(app.api.question.target);
  assert.equal(app.api.state.stats.totalAnswerMs, 3200);
  assert.equal(app.element('answer-time').textContent, '1.6s');
});

test('switching languages preserves the question start and localizes seconds', () => {
  const app = loadApp();
  app.advance(1000);
  const startedAt = app.api.question.startedAt;
  app.element('.language-switch').handlers.get('click')({
    target: { closest: () => ({ dataset: { language: 'pt-BR' } }) }
  });
  assert.equal(app.api.question.startedAt, startedAt);
  app.advance(2000);
  app.api.answer(app.api.question.target);
  assert.equal(app.element('answer-time').textContent, '3,0s');
});

test('legacy scores are preserved without counting untimed answers in the average', () => {
  const app = loadApp({ stats: stats({ total: 10 }) });
  assert.equal(app.api.state.stats.total, 10);
  assert.equal(app.element('answer-time').textContent, '—');
  app.advance(2000);
  app.api.answer(app.api.question.target);
  assert.equal(app.api.state.stats.total, 11);
  assert.equal(app.api.state.stats.timedAnswers, 1);
  assert.equal(app.element('answer-time').textContent, '2.0s');
});

test('saved timing data is restored and reset clears it, keeping preferences', () => {
  const app = loadApp({ autoNext: true, countdownSeconds: 10, stats: stats({ totalAnswerMs: 5000, timedAnswers: 2 }) });
  assert.equal(app.element('answer-time').textContent, '2.5s');
  app.element('reset-stats').handlers.get('click')();
  assert.equal(app.api.state.stats.totalAnswerMs, 0);
  assert.equal(app.api.state.stats.timedAnswers, 0);
  assert.equal(app.element('answer-time').textContent, '—');
  assert.equal(app.api.state.autoNext, true);
  assert.equal(app.api.state.countdownSeconds, 10);
});

test('invalid timing data is ignored without discarding valid scores', () => {
  for (const timing of [{ totalAnswerMs: -1, timedAnswers: 1 }, { totalAnswerMs: 3000, timedAnswers: 3 }, { totalAnswerMs: 3000, timedAnswers: 0 }]) {
    const app = loadApp({ stats: stats(timing) });
    assert.equal(app.api.state.stats.total, 2);
    assert.equal(app.api.state.stats.timedAnswers, 0);
    assert.equal(app.element('answer-time').textContent, '—');
  }
});
