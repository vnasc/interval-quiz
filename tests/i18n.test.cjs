const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function loadTranslations(language = 'en') {
  const context = vm.createContext({ state: { language } });
  const source = readFileSync(join(__dirname, '../i18n.js'), 'utf8');
  vm.runInContext(`${source}\nglobalThis.api = { TRANSLATIONS, t, intervalName };`, context);
  return { context, ...context.api };
}

test('English and Brazilian Portuguese have matching translation keys', () => {
  const { TRANSLATIONS } = loadTranslations();
  const keys = language => Object.keys(TRANSLATIONS[language]).sort().join(',');
  assert.equal(keys('en'), keys('pt-BR'));
  for (const language of ['en', 'pt-BR']) {
    for (const [key, value] of Object.entries(TRANSLATIONS[language])) {
      if (key !== 'intervalNames') assert.ok(typeof value === 'string' && value.length > 0, `${language}: ${key}`);
    }
  }
});

test('all static interface and accessibility keys have translations', () => {
  const { TRANSLATIONS } = loadTranslations();
  const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) {
    for (const language of ['en', 'pt-BR']) assert.equal(typeof TRANSLATIONS[language][match[1]], 'string', `${language}: ${match[1]}`);
  }
});

test('all eleven interval names are available in both languages', () => {
  const { context, intervalName } = loadTranslations();
  const ids = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'];
  for (const language of ['en', 'pt-BR']) {
    context.state.language = language;
    for (const id of ids) assert.ok(intervalName({ id }), `${language}: ${id}`);
  }
  assert.equal(intervalName({ id: 'P5' }), 'quinta justa');
});

test('dynamic messages interpolate and pluralize in both languages', () => {
  const { context, t } = loadTranslations();
  assert.equal(t('question', { number: '07' }), 'QUESTION 07');
  assert.equal(t('semitonesUp', { count: 1, plural: '' }), '1 semitone up');
  assert.equal(t('semitonesUp', { count: 7, plural: 's' }), '7 semitones up');
  context.state.language = 'pt-BR';
  assert.equal(t('question', { number: '07' }), 'QUESTÃO 07');
  assert.equal(t('semitonesUp', { count: 1 }), '1 semitom acima');
  assert.equal(t('semitonesUp', { count: 7 }), '7 semitons acima');
  assert.equal(t('correct', { root: 'C', target: 'E' }), 'Muito bem! C → E.');
  assert.equal(t('strings', { count: 6 }), '6 cordas');
});
