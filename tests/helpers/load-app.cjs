const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

// Load the real app with a minimal DOM and deterministic timers, without a
// browser dependency. Integration checks still run in a real browser.
function loadApp(saved = null) {
  const elements = new Map();
  const listeners = new Map();
  const timers = new Map();
  let now = 0;
  let timerId = 0;
  function element(id) {
    if (!elements.has(id)) {
      const handlers = new Map();
      elements.set(id, {
        style: {}, hidden: true, dataset: {}, handlers,
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(type, callback) { handlers.set(type, callback); },
        setAttribute() {}, focus() {}
      });
    }
    return elements.get(id);
  }
  class FakeDate extends Date { static now() { return now; } }
  const context = vm.createContext({
    Date: FakeDate,
    performance: { now: () => now },
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, time: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    document: {
      documentElement: {}, getElementById: element, querySelector: element,
      querySelectorAll: () => [], addEventListener(type, callback) { listeners.set(type, callback); }
    },
    window: { confirm: () => true },
    localStorage: { getItem: () => saved === null ? null : JSON.stringify(saved), setItem() {} }
  });
  for (const file of ['i18n.js', 'app.js']) {
    vm.runInContext(readFileSync(join(__dirname, '../..', file), 'utf8'), context);
  }
  vm.runInContext(`globalThis.api = {
    answerNames, spelledTarget, ROOTS, INTERVALS, answer, newQuestion,
    renderQuestion, renderCircle, renderAdvance, startCountdown, stopCountdown,
    setQuestion(value) { question = value; },
    get state() { return state; }, get question() { return question; },
    get questionNumber() { return questionNumber; },
    get countdownDeadline() { return countdownDeadline; }
  };`, context);
  function advance(milliseconds) {
    const end = now + milliseconds;
    while (timers.size) {
      const [id, timer] = [...timers.entries()].sort((a, b) => a[1].time - b[1].time)[0];
      if (timer.time > end) break;
      timers.delete(id);
      now = timer.time;
      timer.callback();
    }
    now = end;
  }
  return { context, api: context.api, elements, element, listeners, timers, advance };
}
module.exports = { loadApp };
