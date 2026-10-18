const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

test('Brazilian Portuguese primary locale selects Portuguese', () => {
  for (const locale of ['pt-BR', 'pt-br', 'pt-BR-u-nu-latn']) {
    const app = loadApp(null, { languages: [locale, 'en-US'] });
    assert.equal(app.api.state.language, 'pt-BR');
    assert.equal(app.context.document.documentElement.lang, 'pt-BR');
  }
});

test('other primary locales default to English, even with Portuguese as a secondary preference', () => {
  for (const locale of ['en-US', 'en-BR', 'pt-PT', 'pt', 'es-ES']) {
    assert.equal(loadApp(null, { languages: [locale, 'pt-BR'] }).api.state.language, 'en');
  }
});

test('uses navigator.language when the preferred language list is unavailable or empty', () => {
  assert.equal(loadApp(null, { language: 'pt-BR' }).api.state.language, 'pt-BR');
  assert.equal(loadApp(null, { languages: [], language: 'pt-BR' }).api.state.language, 'pt-BR');
  assert.equal(loadApp(null, { languages: ['en-US'], language: 'pt-BR' }).api.state.language, 'en');
});

test('missing browser locale defaults to English', () => {
  assert.equal(loadApp().api.state.language, 'en');
  assert.equal(loadApp(null, {}).api.state.language, 'en');
});

test('valid saved language overrides browser locale', () => {
  assert.equal(loadApp({ language: 'en' }, { language: 'pt-BR' }).api.state.language, 'en');
  assert.equal(loadApp({ language: 'pt-BR' }, { language: 'en-US' }).api.state.language, 'pt-BR');
});

test('missing or invalid saved language uses the browser default', () => {
  for (const saved of [{}, { language: 'fr' }, { language: null }]) {
    assert.equal(loadApp(saved, { language: 'pt-BR' }).api.state.language, 'pt-BR');
  }
});
