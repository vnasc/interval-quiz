const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

function chooseMode(app, mode) {
  chooseDelay(app, mode === 'manual' ? 0 : app.api.state.countdownSeconds);
}
function chooseDelay(app, seconds) {
  app.element('advance-mode').handlers.get('click')({
    target: { closest: () => ({ dataset: { advance: String(seconds) } }) }
  });
}

test('manual mode remains the default and never starts a timer', () => {
  const app = loadApp();
  assert.equal(app.api.state.autoNext, false);
  assert.equal(app.element('next-question').hidden, true);
  app.api.answer(app.api.question.target);
  app.advance(20000);
  assert.equal(app.api.questionNumber, 1);
  assert.equal(app.element('next-question').disabled, false);
  assert.equal(app.element('next-question').hidden, false);
  assert.equal(app.element('countdown-label').hidden, true);
  assert.equal(app.timers.size, 0);
  app.api.newQuestion();
  assert.equal(app.element('next-question').hidden, true);
});

test('countdown starts only after answering and advances exactly once', () => {
  const app = loadApp();
  chooseMode(app, 'countdown');
  app.advance(10000);
  assert.equal(app.api.questionNumber, 1);
  assert.equal(app.timers.size, 0);
  app.api.answer(app.api.question.target);
  assert.equal(app.element('next-question').hidden, false);
  assert.equal(app.element('next-question').disabled, true);
  assert.equal(app.element('next-arrow').style.display, 'none');
  assert.equal(app.element('countdown-label').hidden, false);
  assert.equal(app.element('countdown-label').textContent, '5');
  app.advance(2000);
  assert.equal(app.element('countdown-label').textContent, '3');
  app.api.answer(app.api.question.target);
  assert.equal(app.api.state.stats.total, 1);
  app.advance(2999);
  assert.equal(app.api.questionNumber, 1);
  app.advance(1);
  assert.equal(app.api.questionNumber, 2);
  assert.equal(app.api.question.answered, false);
  assert.equal(app.element('countdown-label').hidden, true);
  app.advance(30000);
  assert.equal(app.api.questionNumber, 2);
  assert.equal(app.timers.size, 0);
});

test('switching to manual mode cancels a running countdown', () => {
  const app = loadApp();
  chooseMode(app, 'countdown');
  app.api.answer((app.api.question.target + 1) % 12);
  app.advance(2000);
  chooseMode(app, 'manual');
  assert.equal(app.timers.size, 0);
  assert.equal(app.element('next-question').hidden, false);
  assert.equal(app.element('next-question').disabled, false);
  app.advance(10000);
  assert.equal(app.api.questionNumber, 1);
});

test('changing the delay restarts the timer without recording another answer', () => {
  const app = loadApp();
  chooseMode(app, 'countdown');
  app.api.answer(app.api.question.target);
  app.advance(4000);
  chooseDelay(app, 3);
  assert.equal(app.element('countdown-label').textContent, '3');
  app.advance(2999);
  assert.equal(app.api.questionNumber, 1);
  app.advance(1);
  assert.equal(app.api.questionNumber, 2);
  assert.equal(app.api.state.stats.total, 1);
});

test('language switching translates a live timer without restarting it', () => {
  const app = loadApp();
  chooseMode(app, 'countdown');
  app.api.answer(app.api.question.target);
  app.advance(2000);
  const deadline = app.api.countdownDeadline;
  app.element('.language-switch').handlers.get('click')({
    target: { closest: () => ({ dataset: { language: 'pt-BR' } }) }
  });
  assert.equal(app.api.countdownDeadline, deadline);
  assert.equal(app.element('countdown-label').textContent, '3');
  app.advance(3000);
  assert.equal(app.api.questionNumber, 2);
  assert.equal(app.api.state.stats.total, 1);
});

test('a new question clears any timer and preferences are validated on load', () => {
  const app = loadApp({ autoNext: true, countdownSeconds: 3 });
  assert.equal(app.api.state.autoNext, true);
  assert.equal(app.api.state.countdownSeconds, 3);
  app.api.answer(app.api.question.target);
  app.api.newQuestion();
  app.advance(5000);
  assert.equal(app.api.questionNumber, 2);
  assert.equal(app.timers.size, 0);
  const invalid = loadApp({ autoNext: 'true', countdownSeconds: -1 });
  assert.equal(invalid.api.state.autoNext, false);
  assert.equal(invalid.api.state.countdownSeconds, 5);
});
