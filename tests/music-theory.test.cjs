const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./helpers/load-app.cjs');

const { elements, api } = loadApp();
const { answerNames, spelledTarget, ROOTS, INTERVALS } = api;
const root = name => ROOTS.find(r => r.name === name);

function pitchClass(name) {
  const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  assert.match(name, /^[A-G][♯♭]*$/);
  const offset = [...name.slice(1)].reduce((sum, symbol) => sum + (symbol === '♯' ? 1 : -1), 0);
  return (natural[name[0]] + offset + 12) % 12;
}

test('C answer options have one interval-aware name per pitch', () => {
  assert.equal(Array.from(answerNames(root('C'))).join(','), 'C,D♭,D,E♭,E,F,F♯,G,A♭,A,B♭,B');
});

test('spellings follow sharp and flat roots, including theoretical notes', () => {
  assert.equal(answerNames(root('D'))[1], 'C♯');
  assert.equal(answerNames(root('F'))[10], 'B♭');
  assert.equal(answerNames(root('F♯'))[5], 'E♯');
  assert.equal(answerNames(root('F♯'))[0], 'B♯');
  assert.equal(answerNames(root('D♭'))[9], 'B♭♭');
});

test('all roots provide twelve distinct pitches with correctly spelled targets', () => {
  for (const r of ROOTS) {
    const names = answerNames(r);
    assert.equal(names.length, 12);
    assert.equal(new Set(names).size, 12);
    assert.equal(names[r.pc], r.name);
    names.forEach((name, pc) => assert.equal(pitchClass(name), pc, `${r.name}: ${name}`));
    for (const interval of INTERVALS) {
      assert.equal(names[(r.pc + interval.semitones) % 12], spelledTarget(r, interval));
    }
  }
});

test('circle notes use the same root-aware spellings as answer choices', () => {
  for (const r of ROOTS) {
    api.setQuestion({ root: r, interval: INTERVALS[0], target: (r.pc + INTERVALS[0].semitones) % 12, targetName: spelledTarget(r, INTERVALS[0]), answered: false });
    api.renderCircle();
    const rendered = [...elements.get('circle').innerHTML.matchAll(/<text class="circle-note[^\"]*"[^>]*>(.*?)<\/text>/g)].map(match => match[1]);
    const fifthsOrder = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
    assert.deepEqual(rendered, fifthsOrder.map(pc => answerNames(r)[pc]), `circle labels for ${r.name}`);
    assert.ok(rendered.every(name => !name.includes('/')), `single spellings for ${r.name}`);
  }
});

test('rendered answer buttons use a single name, including accessible labels', () => {
  const markup = elements.get('answer-grid').innerHTML;
  assert.ok(!markup.includes(' / '));
  assert.equal([...markup.matchAll(/data-pitch="\d+"/g)].length, 12);
  assert.ok(markup.includes('data-pitch="1" aria-label="D♭">D♭</button>'));
});
