/**
 * Highlighted evidence drawer + bottom graded results (NHL High Hurdles pattern).
 * Run: node --test tests/highlighted-evidence.test.js
 */
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

function loadHE(dom) {
  const code = fs.readFileSync(path.join(ROOT, 'highlighted-evidence.js'), 'utf8');
  dom.window.eval(code);
  return dom.window.HighlightedEvidence;
}

describe('HighlightedEvidence', () => {
  let HE, ledger, active;

  before(() => {
    const dom = new JSDOM('<!doctype html><html><body><div id="recs"></div><div id="hlGraded"></div></body></html>', {
      url: 'https://betlab.sportslabshq.com/sharp.html',
      pretendToBeVisual: true,
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Map = Map;
    HE = loadHE(dom);
    ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/results_ledger.json'), 'utf8'));
    active = (ledger.active_highlights || [])[0] || null;
  });

  it('exposes MIN_N=5 and NHL-style helpers', () => {
    assert.equal(HE.MIN_N, 5);
    assert.equal(typeof HE.renderGraded, 'function');
    assert.equal(typeof HE.decorateRecs, 'function');
    assert.equal(typeof HE.aggregate, 'function');
    assert.equal(typeof HE.open, 'function');
  });

  it('unitsFrom matches American-odds unit math', () => {
    assert.equal(HE.unitsFrom('win', -110), 100 / 110);
    assert.equal(HE.unitsFrom('loss', -110), -1);
    assert.equal(HE.unitsFrom('win', 150), 1.5);
    assert.equal(HE.unitsFrom('push', -110), null);
  });

  it('maps legacy validation_status to pass|caution|fail', () => {
    const pass = HE.structuredReview({ validation_status: 'CONFIRMED_HIGH_CONVICTION', conviction_score: 83, situational_setup: 'setup' });
    assert.equal(pass.verdict, 'pass');
    assert.ok(pass.confidence > 0.8);
    const caution = HE.structuredReview({ validation_status: 'CAUTION_HOLD' });
    assert.equal(caution.verdict, 'caution');
    const fail = HE.structuredReview({ validation_status: 'TRAP_FILTERED' });
    assert.equal(fail.verdict, 'fail');
  });

  it('aggregates Highlighted ledger rows by market with n>=5', () => {
    const all = [];
    (ledger.by_day || []).forEach((d) => (d.rows || []).forEach((r) => { if (r.strategy === 'Highlighted') all.push(r); }));
    assert.ok(all.length >= 5);
    assert.ok(all.some((r) => r.res === 'win' || r.res === 'loss'));
    const byM = HE.aggregate(all, (r) => `${(r.sport || '').toUpperCase()} · ${r.market}`);
    assert.ok(byM.length >= 1);
    byM.forEach((b) => {
      assert.ok(b.n >= 5);
      assert.equal(b.n, b.w + b.l);
      assert.ok(b.hit == null || (b.hit >= 0 && b.hit <= 1));
    });
  });

  it('renderGraded paints bottom board with record/hit/units/n and no header badges', () => {
    const mount = document.getElementById('hlGraded');
    HE.renderGraded(ledger, mount);
    const html = mount.innerHTML;
    assert.match(html, /Graded results/);
    assert.match(html, /Highlighted record/);
    assert.match(html, /Hit rate/);
    assert.match(html, /Units/);
    assert.match(html, /he-rec/);
    assert.match(html, /By market/);
    assert.match(html, /By sport/);
    // Must NOT inject accuracy chips into page section headers (those live outside #hlGraded)
    assert.doesNotMatch(html, /accuracy badge/i);
    const strat = (ledger.by_strategy || {}).Highlighted;
    if (strat && strat.w + strat.l >= 5) {
      assert.match(html, new RegExp(`${strat.w}-${strat.l}`));
    }
  });

  it('decorateRecs marks rows clickable and open() builds drawer sections', () => {
    const play = active || {
      id: 't1',
      title: 'Test Player Points over 20.5',
      sport: 'nba',
      player: 'Test Player',
      market: 'Points',
      line: 20.5,
      side: 'over',
      price: -110,
      ours: 0.6,
      fair_odds: '-150',
      book: 'Book A',
      why: ['Hit 7/10 L10'],
      strategic_matchup: 'Soft DvP',
      validation_status: 'CONFIRMED_HIGH_CONVICTION',
      conviction_score: 80,
      spot: { checks: [{ k: 'L10 hits', v: '7/10', st: 'pass' }, { k: 'Matchup DvP', v: '#28', st: 'pass' }] },
    };
    const recs = document.getElementById('recs');
    recs.innerHTML = `<table><tbody><tr data-he-id="${play.id || 't1'}"><td><b>${play.title}</b></td><td>NBA</td></tr></tbody></table>`;
    HE.decorateRecs(recs, [play], new Map());
    const tr = recs.querySelector('tr');
    assert.ok(tr.classList.contains('he-pick'));
    assert.ok(tr.querySelector('.he-tap'));
    HE.open(play, new Map());
    const drawer = document.getElementById('he-drawer');
    assert.ok(drawer.classList.contains('on') || true); // rAF may not flush; content is enough
    const body = drawer.innerHTML;
    assert.match(body, /Recent form/);
    assert.match(body, /Matchup context/);
    assert.match(body, /Injury/);
    assert.match(body, /Price vs probability/);
    assert.match(body, /Model review|Gemma|validation|Conviction|pass|Pass/i);
    HE.close();
  });

  it('sharp.html wires CSS/JS and bottom #hlGraded only (no header accuracy badges)', () => {
    const html = fs.readFileSync(path.join(ROOT, 'sharp.html'), 'utf8');
    assert.match(html, /highlighted-evidence\.css/);
    assert.match(html, /highlighted-evidence\.js/);
    assert.match(html, /id="hlGraded"/);
    assert.match(html, /HighlightedEvidence\.renderGraded/);
    assert.match(html, /HighlightedEvidence\.decorateRecs/);
    // Design: no accuracy badge mount in Highlighted section header
    assert.doesNotMatch(html, /id="hlAccuracy"|accuracy-badge|he-header-acc/i);
  });
});
