#!/usr/bin/env python3
"""Build data/soccer_sgp_history.json from this repo's own git history.

The archive is the last pre-kickoff snapshot of data/soccer_sgp.json and
data/soccer_lopsided.json, graded only from a stored data/live_stats.json final.
It does not rerun the model and it does not read the results ledger.

Team scores are matched by abbreviation to the published card (and to a stable
schedule abbreviation pair when one exists). live_stats lists two teams; their
slot order is not treated as away/home.

This script is not wired to a publisher. The only workflow in this repo grades
an unrelated NFL article on its own schedule. Running it here once writes a
snapshot. Nothing in this repo refreshes that snapshot when new finals land.

Usage:
  python3 scripts/build_soccer_history.py [--ref origin/main] [--days 21]
      [--out data/soccer_sgp_history.json]
"""
import argparse, collections, json, re, subprocess, unicodedata
from datetime import datetime, timedelta, timezone

ABBR = re.compile(r'^[A-Z0-9]{2,6}$')
STAT_KEYS = {
    'anytime goal': ('totalGoals', 'goals'),
    'goals': ('totalGoals', 'goals'),
    'shots on target': ('shotsOnTarget',),
    'assists': ('goalAssists', 'assists'),
    'shots': ('totalShots', 'shots'),
}
KICK_TOLERANCE = 36 * 3600
METHOD = (
    'Last pre-kickoff published card from git history of soccer_sgp.json and '
    'soccer_lopsided.json. Graded only from stored live_stats.json finals. '
    'Team scores are matched by abbreviation to the published card and, when '
    'stable, the schedule; live_stats slot order is not treated as home/away. '
    'Unverifiable legs are unknown. This file is a snapshot from running '
    'scripts/build_soccer_history.py. No publisher in this repo refreshes it.'
)


def git(*args):
    return subprocess.run(['git', *args], check=True, capture_output=True).stdout


class Batch:
    def __init__(self):
        self.p = subprocess.Popen(['git', 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)

    def get(self, spec):
        self.p.stdin.write((spec + '\n').encode())
        self.p.stdin.flush()
        hdr = self.p.stdout.readline().split()
        if len(hdr) < 3 or hdr[1] == b'missing':
            return None
        data = self.p.stdout.read(int(hdr[2]))
        self.p.stdout.read(1)
        try:
            return json.loads(data)
        except ValueError:
            return None

    def close(self):
        try:
            self.p.stdin.close()
        except Exception:
            pass
        try:
            self.p.terminate()
        except Exception:
            pass


def commits(ref, path, since):
    out = git('log', '--format=%H %ct', '--since=' + since.isoformat(), ref, '--', path).decode().split('\n')
    return [(h, int(t)) for h, t in (line.split() for line in out if line.strip())]


def ts(value):
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()
    except ValueError:
        return None


def iso(epoch):
    return datetime.fromtimestamp(epoch, timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def norm_name(value):
    text = unicodedata.normalize('NFKD', value or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z]', '', text)


def as_num(value):
    if isinstance(value, bool) or value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number or number in (float('inf'), float('-inf')):
        return None
    return number


def as_score(value):
    number = as_num(value)
    if number is None or number < 0 or abs(number - round(number)) > 1e-9:
        return None
    return int(round(number))


def stat_value(stats, keys):
    if not isinstance(stats, dict):
        return None
    present = [stats[key] for key in keys if key in stats]
    if not present:
        return None
    nums = [as_num(v) for v in present]
    if any(v is None for v in nums) or any(v != nums[0] for v in nums):
        return None
    return nums[0]


def grade_stat(stats, market, line):
    keys = STAT_KEYS.get((market or '').strip().lower())
    if keys is None or line is None:
        return 'unknown', None
    value = stat_value(stats, keys)
    if value is None:
        return 'unknown', None
    if value > line:
        return 'win', value
    if value == line:
        return 'push', value
    return 'loss', value


def combine(results):
    if 'loss' in results:
        return 'loss'
    if not results or 'pending' in results:
        return 'pending'
    if 'unknown' in results:
        return 'unknown'
    live = [item for item in results if item not in ('void', 'push')]
    if live:
        return 'win'
    if 'push' in results:
        return 'push'
    return 'void'


def completed_final(row):
    return isinstance(row, list) and len(row) >= 6 and row[0] == 'post' and str(row[1]).strip() == 'Final'


def classify_latest(rows):
    """Newest observation wins. An older 'post' does not override a later non-final."""
    for row in rows:
        if row is None:
            continue
        return row if completed_final(row) else None
    return None


def consider_card(store, kind, commit_ts, card):
    """Keep the last snapshot whose commit is strictly before kickoff. Call oldest first."""
    if not isinstance(card, dict):
        return
    gid = str(card.get('game') or '')
    ko = ts(card.get('time') or '')
    if not gid or ko is None or commit_ts >= ko:
        return
    if kind == 'lop' and card.get('tier') == '-':
        return
    store.setdefault(gid, {})[kind] = (commit_ts, card)


def _consensus(kinds, field):
    vals = []
    for kind in ('sgp', 'lop'):
        if kind in kinds and kinds[kind][1].get(field) not in (None, ''):
            vals.append(kinds[kind][1].get(field))
    uniq = list(dict.fromkeys(vals))
    if len(uniq) == 1:
        return uniq[0]
    if len(uniq) > 1:
        return None
    return None


def card_name_aids(kinds):
    found = collections.defaultdict(set)
    lop = (kinds.get('lop') or (None, {}))[1] or {}
    for scorer in lop.get('scorers') or []:
        if isinstance(scorer, dict) and scorer.get('player') and scorer.get('aid') not in (None, ''):
            found[norm_name(scorer.get('player'))].add(str(scorer.get('aid')))
    sgp = (kinds.get('sgp') or (None, {}))[1] or {}
    for leg in sgp.get('legs') or []:
        if isinstance(leg, dict) and leg.get('player') and leg.get('aid') not in (None, ''):
            found[norm_name(leg.get('player'))].add(str(leg.get('aid')))
    return found


def player_aid(name, names, card_aids):
    key = norm_name(name)
    indexed = set(names.get(key) or ())
    published = set(card_aids.get(key) or ())
    if len(indexed) > 1 or len(published) > 1:
        return None
    if indexed and published and indexed != published:
        return None
    if indexed:
        return next(iter(indexed))
    if published:
        return next(iter(published))
    return None


def grade_text_leg(leg, fav_name, fav_score, dog_score):
    out = {'leg': leg, 'res': 'unknown', 'actual': None}
    kind = None
    team = None
    for suffix, label in ((' to win to nil', 'nil'), (' -1.5', 'm15'), (' to win', 'win')):
        if isinstance(leg, str) and leg.endswith(suffix):
            kind = label
            team = leg[:-len(suffix)]
            break
    if kind is None or norm_name(team) != norm_name(fav_name):
        return out
    margin = fav_score - dog_score
    if kind == 'nil':
        out['res'] = 'win' if margin > 0 and dog_score == 0 else 'loss'
        out['actual'] = '%d-%d' % (fav_score, dog_score)
    elif kind == 'm15':
        out['res'] = 'win' if margin >= 2 else 'loss'
        out['actual'] = 'margin %+d' % margin
    else:
        out['res'] = 'win' if margin > 0 else 'loss'
        out['actual'] = 'margin %+d' % margin
    return out


def _abbr(value):
    text = str(value or '').strip().upper()
    return text if ABBR.match(text) else None


def stable_schedule(pairs):
    """pairs is a set of (home, away) observed in games_soccer.json. Full names are ignored."""
    clean = set()
    for home, away in pairs or ():
        h, a = _abbr(home), _abbr(away)
        if h and a and h != a:
            clean.add((h, a))
    if len(clean) != 1:
        return None
    return next(iter(clean))


def slot_scores(row):
    if not completed_final(row):
        return None
    a_abbr, b_abbr = _abbr(row[2]), _abbr(row[4])
    a_score, b_score = as_score(row[3]), as_score(row[5])
    if not a_abbr or not b_abbr or a_abbr == b_abbr or a_score is None or b_score is None:
        return None
    return {a_abbr: a_score, b_abbr: b_score}


def resolve_final(row, fav, dog, home, fav_name, dog_name, card_time, schedule):
    """Return a final dict, or None when the stored row is not a verified final for these teams."""
    scores = slot_scores(row)
    fav_abbr, dog_abbr = _abbr(fav), _abbr(dog)
    if scores is None or not fav_abbr or not dog_abbr or fav_abbr == dog_abbr:
        return None
    if fav_abbr not in scores or dog_abbr not in scores:
        return None
    live_ko = row[6] if len(row) > 6 else None
    card_ko = ts(card_time)
    live_ts = ts(live_ko) if isinstance(live_ko, str) else None
    if card_ko is not None and live_ts is not None and abs(live_ts - card_ko) > KICK_TOLERANCE:
        return None
    sched = stable_schedule([schedule]) if isinstance(schedule, tuple) else None
    if sched is not None and set(sched) != set(scores):
        return None
    home_abbr = _abbr(home)
    away_abbr = None
    if home_abbr == fav_abbr:
        away_abbr = dog_abbr
    elif home_abbr == dog_abbr:
        away_abbr = fav_abbr
    else:
        home_abbr = None
    if sched is not None:
        if home_abbr is None:
            home_abbr, away_abbr = sched
        elif sched[0] != home_abbr:
            home_abbr, away_abbr = None, None
    orientation = 'verified' if home_abbr and away_abbr and home_abbr in scores and away_abbr in scores else 'teams_only'
    if orientation != 'verified':
        home_abbr, away_abbr = None, None
    names = {fav_abbr: fav_name, dog_abbr: dog_name}
    final = {
        'label': 'Final',
        'orientation': orientation,
        'fav': fav_abbr,
        'dog': dog_abbr,
        'fav_score': scores[fav_abbr],
        'dog_score': scores[dog_abbr],
        'fav_name': fav_name,
        'dog_name': dog_name,
        'home': home_abbr if orientation == 'verified' else None,
        'away': away_abbr if orientation == 'verified' else None,
        'home_score': scores[home_abbr] if orientation == 'verified' else None,
        'away_score': scores[away_abbr] if orientation == 'verified' else None,
        'home_name': names.get(home_abbr) if orientation == 'verified' else None,
        'away_name': names.get(away_abbr) if orientation == 'verified' else None,
    }
    if isinstance(live_ko, str) and live_ko and card_time and live_ko != card_time:
        final['live_time'] = live_ko
    return final


def _names_for(lop, sgp, field_lop, field_sgp, fallback):
    if lop and lop.get(field_lop):
        return lop.get(field_lop)
    if sgp and sgp.get(field_sgp):
        return sgp.get(field_sgp)
    return fallback


def assemble_game(gid, kinds, live, schedule):
    """live is {'row', 'players', 'names'} for the newest stored final, or None."""
    if not live or 'sgp' not in kinds and 'lop' not in kinds:
        return None
    sgp = kinds['sgp'][1] if 'sgp' in kinds else None
    lop = kinds['lop'][1] if 'lop' in kinds else None
    any_card = sgp or lop
    fav = _consensus(kinds, 'fav')
    dog = _consensus(kinds, 'dog')
    home = _consensus(kinds, 'home')
    if fav is None or dog is None:
        # consensus returns None both for missing and for conflict; distinguish
        favs, dogs = [], []
        for kind in ('sgp', 'lop'):
            if kind in kinds:
                favs.append(kinds[kind][1].get('fav'))
                dogs.append(kinds[kind][1].get('dog'))
        if len(set(v for v in favs if v)) > 1 or len(set(v for v in dogs if v)) > 1:
            return None
    fav_name = _names_for(lop, (sgp or {}).get('club') if sgp else None, 'fav_name', 'name', fav)
    if sgp and not (lop and lop.get('fav_name')):
        fav_name = (sgp.get('club') or {}).get('name') or fav
    dog_name = _names_for(lop, (sgp or {}).get('opp') if sgp else None, 'dog_name', 'name', dog)
    if sgp and not (lop and lop.get('dog_name')):
        dog_name = (sgp.get('opp') or {}).get('name') or dog
    final = resolve_final(live['row'], fav, dog, home, fav_name, dog_name, any_card.get('time'), schedule)
    if final is None:
        return None
    aids = card_name_aids(kinds)
    players = live.get('players') or {}
    names = live.get('names') or {}
    entry = {
        'game': gid,
        'lg': any_card.get('lg'),
        'time': any_card.get('time'),
        'fav': final['fav'],
        'dog': final['dog'],
        'published_at': iso(max(item[0] for item in kinds.values())),
        'status': 'final',
        'final': final,
        'sgp': None,
        'blowout': None,
    }
    if sgp:
        legs = []
        for leg in sgp.get('legs') or []:
            market = leg.get('market')
            line = as_num(leg.get('line'))
            aid = str(leg.get('aid')) if leg.get('aid') not in (None, '') else player_aid(leg.get('player'), names, aids)
            stats = players.get(aid) if aid else None
            res, actual = grade_stat(stats, market, line) if final else ('pending', None)
            legs.append({
                'player': leg.get('player'), 'market': market, 'line': leg.get('line'),
                'price': leg.get('ov'), 'res': res, 'actual': actual,
            })
        entry['sgp'] = {
            'title': sgp.get('title'),
            'tier': sgp.get('tier'),
            'fav_name': (sgp.get('club') or {}).get('name'),
            'dog_name': (sgp.get('opp') or {}).get('name'),
            'legs': legs,
            'res': combine([leg['res'] for leg in legs]),
        }
    if lop:
        legs = []
        for leg in lop.get('legs') or []:
            text = leg.get('leg') or ''
            if text.endswith(' anytime'):
                aid = player_aid(text[:-8], names, aids)
                stats = players.get(aid) if aid else None
                res, actual = grade_stat(stats, 'anytime goal', 0.5)
                item = {'leg': text, 'res': res, 'actual': actual, 'p': leg.get('p')}
            else:
                item = grade_text_leg(text, fav_name, final['fav_score'], final['dog_score'])
                item['p'] = leg.get('p')
            legs.append(item)
        entry['blowout'] = {
            'fav_name': lop.get('fav_name'),
            'dog_name': lop.get('dog_name'),
            'tier': lop.get('tier'),
            'pf': lop.get('pf'),
            'margin': final['fav_score'] - final['dog_score'],
            'legs': legs,
        }
    return entry


def index_snapshot(doc, gids):
    players = {gid: {} for gid in gids}
    names = collections.defaultdict(set)
    for key, value in (doc.get('p') or {}).items():
        if not str(key).startswith('soccer|') or not isinstance(value, list) or len(value) < 2 or not isinstance(value[1], dict):
            continue
        gid = str(value[0])
        if gid in players:
            players[gid][key[7:]] = value[1]
    for key, aid in (doc.get('n') or {}).items():
        if str(key).startswith('soccer|') and aid not in (None, ''):
            names[key[7:]].add(str(aid))
    return players, names


def schedule_pairs(batch, ref, since):
    found = collections.defaultdict(set)
    for sha, _commit_ts in reversed(commits(ref, 'data/games_soccer.json', since)):
        doc = batch.get(sha + ':data/games_soccer.json') or []
        if isinstance(doc, dict):
            doc = doc.get('games') or []
        for game in doc:
            if isinstance(game, dict) and game.get('id'):
                found[str(game['id'])].add((game.get('home'), game.get('away')))
    return {gid: stable_schedule(pairs) for gid, pairs in found.items()}


def collect_cards(batch, ref, since):
    cards = {}
    for kind, path, key in (('sgp', 'data/soccer_sgp.json', 'cards'), ('lop', 'data/soccer_lopsided.json', 'rows')):
        history = commits(ref, path, since - timedelta(days=4))
        for sha, commit_ts in reversed(history):
            doc = batch.get(sha + ':' + path) or {}
            for card in doc.get(key) or []:
                consider_card(cards, kind, commit_ts, card)
    return cards


def collect_finals(batch, ref, since, needed):
    finals = {}
    decided = set()
    for sha, _commit_ts in commits(ref, 'data/live_stats.json', since):
        if len(decided) == len(needed):
            break
        doc = batch.get(sha + ':data/live_stats.json') or {}
        games = doc.get('g') or {}
        pending = []
        for gid in needed:
            if gid in decided:
                continue
            row = games.get('soccer|' + gid)
            if row is None:
                continue
            pending.append((gid, row))
        if not pending:
            continue
        players, names = index_snapshot(doc, [gid for gid, _row in pending])
        for gid, row in pending:
            decided.add(gid)
            if completed_final(row):
                finals[gid] = {'row': row, 'players': players.get(gid) or {}, 'names': names}
    return finals


def build(ref, days, now):
    since = now - timedelta(days=days)
    batch = Batch()
    try:
        cards = collect_cards(batch, ref, since)
        schedules = schedule_pairs(batch, ref, since - timedelta(days=4))
        finals = collect_finals(batch, ref, since, set(cards))
    finally:
        batch.close()
    games = []
    omitted_future = omitted_old = omitted_no_final = omitted_identity = 0
    window_start = since.timestamp()
    stamp = now.timestamp()
    for gid, kinds in cards.items():
        any_card = (kinds.get('sgp') or kinds.get('lop'))[1]
        ko = ts(any_card.get('time') or '')
        if ko is None:
            omitted_identity += 1
            continue
        if ko > stamp:
            omitted_future += 1
            continue
        if ko < window_start:
            omitted_old += 1
            continue
        live = finals.get(gid)
        if live is None:
            omitted_no_final += 1
            continue
        entry = assemble_game(gid, kinds, live, schedules.get(gid))
        if entry is None:
            omitted_identity += 1
            continue
        games.append(entry)
    games.sort(key=lambda item: item['time'], reverse=True)
    return {
        'updated': iso(stamp),
        'window_days': days,
        'source_ref': ref,
        'auto_refresh': False,
        'omitted_no_final': omitted_no_final,
        'omitted_future': omitted_future,
        'omitted_old': omitted_old,
        'omitted_identity': omitted_identity,
        'method': METHOD,
        'games': games,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--days', type=int, default=21)
    parser.add_argument('--out', default='data/soccer_sgp_history.json')
    parser.add_argument('--now')
    args = parser.parse_args()
    now = datetime.fromisoformat(args.now.replace('Z', '+00:00')) if args.now else datetime.now(timezone.utc)
    doc = build(args.ref, args.days, now)
    with open(args.out, 'w', encoding='utf-8') as handle:
        json.dump(doc, handle, ensure_ascii=False, separators=(',', ':'))
        handle.write('\n')
    from collections import Counter
    leg_res = Counter()
    orient = Counter()
    sgp_res = Counter()
    for game in doc['games']:
        orient[game['final']['orientation']] += 1
        if game.get('sgp'):
            sgp_res[game['sgp']['res']] += 1
        for leg in ((game.get('blowout') or {}).get('legs') or []) + ((game.get('sgp') or {}).get('legs') or []):
            leg_res[leg.get('res')] += 1
    print(len(doc['games']), 'finals', 'omitted_no_final', doc['omitted_no_final'],
          'omitted_future', doc['omitted_future'], 'omitted_identity', doc['omitted_identity'],
          'omitted_old', doc['omitted_old'])
    print('orientation', dict(orient))
    print('sgp', dict(sgp_res))
    print('legs', dict(leg_res))


if __name__ == '__main__':
    main()
