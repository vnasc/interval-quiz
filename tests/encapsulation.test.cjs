const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadApp } = require('./helpers/load-app.cjs');

test('app internals stay private to the IIFE', () => {
  const { context, api } = loadApp();

  for (const name of ['state', '$', 'question', 'answer', 'newQuestion', 'INTERVALS', 't', 'renderLanguage']) {
    assert.equal(vm.runInContext(`typeof ${name}`, context), 'undefined', name);
  }

  assert.ok(api.question, 'the test-only API can still access private state');
});
