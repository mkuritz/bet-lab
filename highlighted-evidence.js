/* Bet Lab Highlighted · evidence drawer + bottom graded results (NHL High Hurdles pattern). Preview only. */
(function (root) {
  'use strict';
  const MIN_N = 5;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const et = (t) => {
    const n = Date.parse(t);
    if (!Number.isFinite(n)) return null;
    return new Date(n).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET';
  };
  const pct = (x, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? (x * 100).toFixed(d) + '%' : null);
  const am = (p) => (p == null || !Number.isFinite(+p) ? null : (+p > 0 ? '+' : '') + Math.round(+p));
  const impliedFromAm = (p) => {
    const x = +p;
    if (!Number.isFinite(x) || Math.abs(x) < 100) return null;
    return x > 0 ? 100 / (x + 100) : -x / (-x + 100);
  };
  const unitsFrom = (res, price) => {
    if (res === 'push' || price == null || !Number.isFinite(+price)) return null;
    const p = +price;
    if (res === 'win') return p > 0 ? p / 100 : 100 / -p;
    if (res === 'loss') return -1;
    return null;
  };

  /* Map legacy Gemma / validation fields → structured verdict without inventing content */
  function structuredReview(play) {
    if (!play || typeof play !== 'object') return null;
    const raw = play.gemma_review || play.review || null;
    let verdict = (raw && raw.verdict) || play.verdict || null;
    const status = play.validation_status || (raw && raw.validation_status) || null;
    if (!verdict && status) {
      if (status === 'CONFIRMED_HIGH_CONVICTION') verdict = 'pass';
      else if (status === 'CAUTION_HOLD') verdict = 'caution';
      else if (status === 'TRAP_FILTERED') verdict = 'fail';
    }
    if (verdict) verdict = String(verdict).toLowerCase();
    if (verdict && !['pass', 'caution', 'fail'].includes(verdict)) verdict = null;
    let conf = raw && raw.confidence != null ? +raw.confidence : null;
    if (conf == null && play.conviction_score != null) conf = Math.max(0, Math.min(1, +play.conviction_score / 100));
    if (conf == null || !Number.isFinite(conf)) conf = null;
    let reasons = (raw && Array.isArray(raw.reasons) && raw.reasons) || null;
    if (!reasons) {
      reasons = [play.situational_setup, play.strategic_matchup, play.tactical_exploits].filter((x) => typeof x === 'string' && x.trim());
    }
    reasons = (reasons || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 8);
    const missing = (raw && Array.isArray(raw.missing_data) ? raw.missing_data : []).map(String).filter(Boolean);
    const reviewedAt = (raw && (raw.reviewed_at || raw.reviewedAt)) || play.reviewed_at || play.logged_at || null;
    if (!verdict && conf == null && !reasons.length && !status) return null;
    return {
      verdict: verdict || null,
      confidence: conf,
      reasons,
      missing_data: missing,
      validation_status: status || null,
      reviewed_at: reviewedAt,
      entry_timing: play.entry_timing || (raw && raw.entry_timing) || null,
      risk_payoff_grade: play.risk_payoff_grade || (raw && raw.risk_payoff_grade) || null,
    };
  }

  function miss(label) {
    return `<p class="he-miss">Not on this snapshot: ${esc(label)}</p>`;
  }

  function formSection(play) {
    const why = Array.isArray(play.why) ? play.why.filter((x) => typeof x === 'string' && x.trim()) : [];
    const checks = play.spot && Array.isArray(play.spot.checks) ? play.spot.checks : [];
    const formChecks = checks.filter((c) => /L10|L5|SZN|form|season|rate|cleared|hit/i.test(`${c.k || ''} ${c.v || ''}`));
    if (!why.length && !formChecks.length) return `<div class="he-sec"><h4>Recent form</h4>${miss('recent form')}</div>`;
    let body = '';
    if (why.length) body += `<ul class="he-list">${why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`;
    if (formChecks.length) {
      body += `<div class="he-meta" style="margin-top:8px">${formChecks.map((c) => `<div><b>${esc(c.k)}</b> · ${esc(c.v)}${c.st ? ` <span class="mut">(${esc(c.st)})</span>` : ''}</div>`).join('')}</div>`;
    }
    return `<div class="he-sec"><h4>Recent form</h4>${body}</div>`;
  }

  function matchupSection(play) {
    const parts = [];
    if (play.strategic_matchup) parts.push(play.strategic_matchup);
    if (play.game || play.matchup || play.opp) {
      parts.push([play.team, play.opp || play.matchup, play.game ? `game ${play.game}` : null].filter(Boolean).join(' · '));
    }
    const checks = play.spot && Array.isArray(play.spot.checks) ? play.spot.checks : [];
    const mu = checks.filter((c) => /matchup|DvP|Dvp|defense|script|opponent/i.test(`${c.k || ''} ${c.v || ''}`));
    if (!parts.length && !mu.length) return `<div class="he-sec"><h4>Matchup context</h4>${miss('matchup context')}</div>`;
    let body = parts.length ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5">${esc(parts[0])}</p>` : '';
    if (parts.length > 1) body += `<p class="he-meta">${esc(parts.slice(1).join(' · '))}</p>`;
    if (mu.length) body += mu.map((c) => `<div class="he-meta"><b>${esc(c.k)}</b> · ${esc(c.v)}</div>`).join('');
    return `<div class="he-sec"><h4>Matchup context</h4>${body}</div>`;
  }

  function injurySection(play, injuryIndex) {
    const bits = [];
    const stamps = [];
    const checks = play.spot && Array.isArray(play.spot.checks) ? play.spot.checks : [];
    const act = checks.find((c) => /active|injury|starter|opportunity|role|lineup/i.test(`${c.k || ''} ${c.v || ''}`));
    if (act) bits.push(`${act.k}: ${act.v}`);
    if (play.situational_setup && /active|injury|out|questionable|doubtful|starter/i.test(play.situational_setup)) {
      bits.push(play.situational_setup);
    }
    const hit = injuryIndex && (injuryIndex.get(String(play.aid || '')) || injuryIndex.get((play.player || '').toLowerCase()));
    if (hit) {
      if (hit.status) bits.push(`Status: ${hit.status}${hit.detail ? ` · ${hit.detail}` : ''}`);
      if (hit.note) bits.push(hit.note);
      if (hit.asof || hit.updated || hit.date) stamps.push(et(hit.asof || hit.updated || hit.date));
    }
    if (play.reviewed_at) stamps.push('Reviewed ' + et(play.reviewed_at));
    if (play.logged_at) stamps.push('Logged ' + et(play.logged_at));
    if (!bits.length) return `<div class="he-sec"><h4>Injury & starter status</h4>${miss('injury / starter status')}</div>`;
    return `<div class="he-sec"><h4>Injury & starter status</h4><ul class="he-list">${bits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>${stamps.filter(Boolean).length ? `<p class="he-meta">${stamps.filter(Boolean).map(esc).join(' · ')}</p>` : ''}</div>`;
  }

  function priceSection(play) {
    const ours = typeof play.ours === 'number' ? play.ours : typeof play.p_cal === 'number' ? play.p_cal : typeof play.p_model === 'number' ? play.p_model : null;
    const price = play.price != null ? +play.price : play.price_am != null ? parseFloat(String(play.price_am).replace('+', '')) : null;
    const priceLabel = play.price_am != null ? String(play.price_am) : am(price);
    const book = (play.best_book || play.book || '').replace(/\s*\(.*\)/, '').replace(/\s*via.*$/i, '') || null;
    const implied = typeof play.book === 'number' ? play.book : typeof play.implied === 'number' ? play.implied : impliedFromAm(price);
    const edge = typeof play.edge === 'number' ? play.edge : ours != null && implied != null ? ours - implied : null;
    const fair = play.fair_odds || null;
    const tiles = [];
    if (priceLabel) tiles.push(['Book price', `${esc(priceLabel)}${book ? ` · ${esc(book)}` : ''}`]);
    if (ours != null) tiles.push(['Our probability', pct(ours, 1)]);
    if (implied != null) tiles.push(['Implied', pct(implied, 1)]);
    if (edge != null) tiles.push(['Edge', (edge >= 0 ? '+' : '') + (edge * 100).toFixed(1) + ' pp']);
    if (fair) tiles.push(['Fair odds', esc(fair)]);
    if (!tiles.length) return `<div class="he-sec"><h4>Price vs probability</h4>${miss('price / probability')}</div>`;
    const shown = tiles.slice(0, 4);
    const rest = tiles.slice(4);
    return `<div class="he-sec"><h4>Price vs probability</h4><div class="he-kpis">${shown.map(([k, v]) => `<div class="he-kpi"><small>${esc(k)}</small><strong>${v}</strong></div>`).join('')}</div>${rest.map(([k, v]) => `<div class="he-meta"><b>${esc(k)}</b> · ${v}</div>`).join('')}</div>`;
  }

  function gemmaSection(play) {
    const r = structuredReview(play);
    if (!r) return `<div class="he-sec"><h4>Gemma review</h4>${miss('structured review')}</div>`;
    const pill = r.verdict === 'pass' ? 'pass' : r.verdict === 'caution' ? 'caution' : r.verdict === 'fail' ? 'fail' : 'na';
    const label = r.verdict === 'pass' ? 'Pass' : r.verdict === 'caution' ? 'Caution' : r.verdict === 'fail' ? 'Fail' : 'Unavailable';
    const conf = r.confidence != null ? Math.round(r.confidence * 100) + '%' : null;
    let body = `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><span class="he-pill ${pill}">${esc(label)}</span>${conf ? `<span class="he-meta">Confidence ${esc(conf)}</span>` : ''}${r.validation_status ? `<span class="he-meta">${esc(r.validation_status.replace(/_/g, ' '))}</span>` : ''}</div>`;
    if (r.reasons.length) body += `<ul class="he-list">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    else body += miss('review reasons');
    if (r.missing_data.length) body += `<p class="he-miss">Missing inputs: ${esc(r.missing_data.join(' · '))}</p>`;
    if (r.entry_timing) body += `<p class="he-meta">${esc(r.entry_timing)}</p>`;
    if (r.risk_payoff_grade) body += `<p class="he-meta">${esc(r.risk_payoff_grade)}</p>`;
    if (r.reviewed_at && et(r.reviewed_at)) body += `<p class="he-meta">Reviewed ${esc(et(r.reviewed_at))}</p>`;
    return `<div class="he-sec"><h4>Gemma's verdict</h4>${body}</div>`;
  }

  function drawerHtml(play, injuryIndex) {
    const title = play.title || [play.player, play.market, play.line != null ? play.line : ''].filter(Boolean).join(' ') || 'Highlighted pick';
    return `<div class="he-handle" aria-hidden="true"></div>
      <header><div><div class="he-meta" style="margin:0 0 4px">${esc((play.sport || '').toUpperCase())}${play.start && et(play.start) ? ' · ' + esc(et(play.start)) : ''}</div><h3 id="he-drawer-title">${esc(title)}</h3></div>
      <button type="button" class="he-close" aria-label="Close evidence">×</button></header>
      <div class="he-body" tabindex="0">
        ${formSection(play)}
        ${matchupSection(play)}
        ${injurySection(play, injuryIndex)}
        ${priceSection(play)}
        ${gemmaSection(play)}
        <p class="he-meta">Informational only. Existing validation badges on the card are unchanged.</p>
      </div>`;
  }

  function ensureDrawer() {
    let scrim = document.getElementById('he-scrim');
    let drawer = document.getElementById('he-drawer');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.id = 'he-scrim';
      scrim.className = 'he-scrim';
      scrim.addEventListener('click', close);
      document.body.appendChild(scrim);
    }
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.id = 'he-drawer';
      drawer.className = 'he-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-labelledby', 'he-drawer-title');
      document.body.appendChild(drawer);
      let touchY = null;
      drawer.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
      drawer.addEventListener('touchend', (e) => {
        if (touchY == null) return;
        const dy = e.changedTouches[0].clientY - touchY;
        if (dy > 70) close();
        touchY = null;
      }, { passive: true });
    }
    return { scrim, drawer };
  }

  let lastFocus = null;
  function open(play, injuryIndex) {
    const { scrim, drawer } = ensureDrawer();
    lastFocus = document.activeElement;
    drawer.innerHTML = drawerHtml(play, injuryIndex);
    drawer.querySelector('.he-close').onclick = close;
    const kick = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn) => setTimeout(fn, 0);
    kick(() => {
      scrim.classList.add('on');
      drawer.classList.add('on');
      document.body.classList.add('he-open');
      const closeBtn = drawer.querySelector('.he-close');
      if (closeBtn && closeBtn.focus) closeBtn.focus();
    });
  }
  function close() {
    const scrim = document.getElementById('he-scrim');
    const drawer = document.getElementById('he-drawer');
    scrim && scrim.classList.remove('on');
    drawer && drawer.classList.remove('on');
    document.body.classList.remove('he-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('he-open')) {
        e.preventDefault();
        close();
      }
    });
  }

  function buildInjuryIndex(inj) {
    const map = new Map();
    if (!inj || typeof inj !== 'object') return map;
    const lists = []
      .concat(inj.prop_freerolls || [])
      .concat(inj.line_opportunities || [])
      .concat(inj.players || [])
      .concat(inj.rows || []);
    lists.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const entry = {
        status: row.status || row.inj_status || row.designation || null,
        detail: row.detail || row.injury || row.note_short || null,
        note: row.note || row.blurb || row.why || null,
        asof: row.asof || row.updated || row.date || inj.updated || null,
      };
      if (row.aid != null) map.set(String(row.aid), entry);
      if (row.id != null) map.set(String(row.id), entry);
      if (row.player) map.set(String(row.player).toLowerCase(), entry);
      if (row.name) map.set(String(row.name).toLowerCase(), entry);
    });
    return map;
  }

  /* NHL High Hurdles–style graded record at page bottom */
  function aggregate(rows, groupKey) {
    const by = new Map();
    rows.forEach((r) => {
      const key = groupKey(r);
      if (!key) return;
      if (!by.has(key)) by.set(key, { key, w: 0, l: 0, p: 0, units: 0, priced: 0, sport: r.sport, market: r.market });
      const b = by.get(key);
      const res = r.res || r.result;
      if (res === 'win') b.w++;
      else if (res === 'loss') b.l++;
      else if (res === 'push') b.p++;
      else return;
      const u = unitsFrom(res, r.price);
      if (u != null) {
        b.units += u;
        b.priced++;
      }
    });
    return [...by.values()]
      .map((b) => {
        const n = b.w + b.l;
        return {
          ...b,
          n,
          sample: n + b.p,
          hit: n ? b.w / n : null,
          units: Math.round(b.units * 100) / 100,
        };
      })
      .filter((b) => b.n >= MIN_N)
      .sort((a, b) => (b.hit || 0) - (a.hit || 0) || b.units - a.units || b.n - a.n);
  }

  function renderGraded(ledger, mount, opts = {}) {
    if (!mount) return;
    const windowDays = opts.windowDays || 30;
    const all = [];
    (ledger.by_day || []).forEach((d) => {
      (d.rows || []).forEach((r) => {
        if (r.strategy !== 'Highlighted') return;
        all.push(r);
      });
    });
    const cutoff = new Date(Date.now() - windowDays * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    let rows = all.filter((r) => (r.day || '') >= cutoff);
    if (rows.length < MIN_N) rows = all; // fall back to season sample when window too thin
    const mode = opts.mode || 'market';
    const grouped =
      mode === 'sport'
        ? aggregate(rows, (r) => (r.sport || '—').toUpperCase())
        : aggregate(rows, (r) => `${(r.sport || '—').toUpperCase()} · ${r.market || 'Market'}`);
    const strat = (ledger.by_strategy || {}).Highlighted;
    const overallN = strat ? strat.w + strat.l : 0;
    const hasOverall = !!(strat && overallN >= MIN_N);
    const recTxt = hasOverall ? `${strat.w}-${strat.l}${strat.p ? '-' + strat.p : ''}` : '—';
    const hitTxt = hasOverall && strat.hit_pct != null ? strat.hit_pct.toFixed(1) + '%' : '—';
    const unitsTxt = hasOverall ? `${strat.units >= 0 ? '+' : ''}${strat.units}u` : '—';
    const unitsCls = hasOverall ? (strat.units >= 0 ? 'he-pos' : 'he-neg') : '';
    const overall = hasOverall
      ? `<div class="he-kpis" style="margin-bottom:12px">
          <div class="he-kpi"><small>Highlighted record</small><strong>${recTxt}</strong></div>
          <div class="he-kpi"><small>Hit rate</small><strong>${hitTxt}</strong></div>
          <div class="he-kpi"><small>Units</small><strong class="${unitsCls}">${unitsTxt}</strong></div>
          <div class="he-kpi"><small>Sample</small><strong>n=${strat.n}</strong></div>
        </div>`
      : '';

    const sort = opts.sort || 'hit';
    const sorted = grouped.slice().sort((a, b) => {
      if (sort === 'units') return b.units - a.units || (b.hit || 0) - (a.hit || 0);
      if (sort === 'n') return b.n - a.n || (b.hit || 0) - (a.hit || 0);
      return (b.hit || 0) - (a.hit || 0) || b.units - a.units;
    });

    // Collapsed by default; preserve open state across mode/sort re-renders
    let expanded = opts.expanded;
    if (expanded == null) {
      const prev = mount.querySelector('.he-grade-tog');
      expanded = prev ? prev.getAttribute('aria-expanded') === 'true' : false;
    }

    const summary = hasOverall
      ? `<span class="he-grade-sum"><b>${esc(recTxt)}</b> · ${esc(hitTxt)} · <b class="${unitsCls}">${esc(unitsTxt)}</b>${strat.n != null ? ` · n=${strat.n}` : ''}</span>`
      : `<span class="he-grade-sum">No graded sample yet</span>`;

    const panelId = 'hlGradedPanel';
    mount.innerHTML = `<button type="button" class="he-grade-tog" aria-expanded="${expanded ? 'true' : 'false'}" aria-controls="${panelId}">
        <span class="he-grade-title">Graded results</span>
        ${summary}
        <span class="he-chev" aria-hidden="true">▾</span>
      </button>
      <div class="he-grade-panel" id="${panelId}"${expanded ? '' : ' hidden'}>
      <p class="he-sub">Consolidated Highlighted record from the results ledger (same source as the Results Hub). Rows need at least ${MIN_N} graded decisions. Window: ${rows === all ? 'full Highlighted sample' : `last ${windowDays} days`}.</p>
      <div class="he-ctl" role="group" aria-label="Results controls">
        <button type="button" data-mode="market" aria-pressed="${mode === 'market'}">By market</button>
        <button type="button" data-mode="sport" aria-pressed="${mode === 'sport'}">By sport</button>
        <label>Sort
          <select data-sort aria-label="Sort graded results">
            <option value="hit"${sort === 'hit' ? ' selected' : ''}>Hit rate</option>
            <option value="units"${sort === 'units' ? ' selected' : ''}>Units</option>
            <option value="n"${sort === 'n' ? ' selected' : ''}>Sample size</option>
          </select>
        </label>
      </div>
      ${overall}
      ${sorted.length
        ? `<div class="wrap"><table class="he-rec"><thead><tr><th>${mode === 'sport' ? 'Sport' : 'Market / line'}</th><th>Record</th><th>Hit rate</th><th>Units</th><th>n</th></tr></thead><tbody>
        ${sorted
          .map(
            (b) => `<tr>
          <td><b>${esc(b.key)}</b></td>
          <td>${b.w}-${b.l}${b.p ? '-' + b.p : ''}</td>
          <td>${b.hit != null ? Math.round(b.hit * 100) + '%' : '—'}</td>
          <td class="${b.units >= 0 ? 'he-pos' : 'he-neg'}">${b.units >= 0 ? '+' : ''}${b.units.toFixed(2)}u</td>
          <td>${b.n}</td>
        </tr>`
          )
          .join('')}
      </tbody></table></div>`
        : `<div class="he-empty">No graded Highlighted markets with at least ${MIN_N} decisions in this window yet.</div>`}
      <p class="he-meta">Does not change which plays appear above or how they are validated.</p>
      </div>`;

    const tog = mount.querySelector('.he-grade-tog');
    const panel = mount.querySelector('.he-grade-panel');
    if (tog && panel) {
      tog.onclick = () => {
        const open = tog.getAttribute('aria-expanded') !== 'true';
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
      };
    }
    mount.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.onclick = () =>
        renderGraded(ledger, mount, {
          ...opts,
          mode: btn.dataset.mode,
          sort,
          expanded: tog && tog.getAttribute('aria-expanded') === 'true',
        });
    });
    const sel = mount.querySelector('[data-sort]');
    if (sel)
      sel.onchange = () =>
        renderGraded(ledger, mount, {
          ...opts,
          mode,
          sort: sel.value,
          expanded: tog && tog.getAttribute('aria-expanded') === 'true',
        });
  }

  function decorateRecs(container, playsById, injuryIndex) {
    if (!container) return;
    const rows = [...container.querySelectorAll('tbody tr')];
    rows.forEach((tr, i) => {
      const play = Array.isArray(playsById) ? playsById[i] : playsById.get(tr.dataset.heId);
      if (!play) return;
      tr.classList.add('he-pick');
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Open evidence for ' + (play.title || 'pick'));
      const first = tr.querySelector('td');
      if (first && !first.querySelector('.he-tap')) {
        const tip = document.createElement('span');
        tip.className = 'he-tap';
        tip.textContent = 'Evidence →';
        first.appendChild(tip);
      }
      const go = (e) => {
        e.preventDefault();
        open(play, injuryIndex);
      };
      tr.addEventListener('click', go);
      tr.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') go(e);
      });
    });
  }

  root.HighlightedEvidence = {
    MIN_N,
    structuredReview,
    open,
    close,
    buildInjuryIndex,
    renderGraded,
    decorateRecs,
    aggregate,
    unitsFrom,
  };
})(typeof window !== 'undefined' ? window : globalThis);
