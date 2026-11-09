#!/usr/bin/env python3
"""Grade and identity tests for the soccer history builder. No network."""
import importlib.util
import unittest
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('soccer_history_build', ROOT / 'scripts' / 'build_soccer_history.py')
B = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(B)

KO = '2026-11-07T15:00:00Z'
ROW_HOME_SECOND = ['post', 'Final', 'HUL', 0, 'ARS', 1, KO]
ROW_HOME_FIRST = ['post', 'Final', 'ARS', 1, 'HUL', 0, KO]


class GradeTests(unittest.TestCase):
    def test_swapped_slots_follow_published_home(self):
        final = B.resolve_final(ROW_HOME_FIRST, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, ('ARS', 'HUL'))
        self.assertEqual(final['orientation'], 'verified')
        self.assertEqual(final['home'], 'ARS')
        self.assertEqual(final['home_score'], 1)
        self.assertEqual(final['away'], 'HUL')
        self.assertEqual(final['away_score'], 0)
        self.assertEqual((final['fav_score'], final['dog_score']), (1, 0))

    def test_feed_order_same_identity(self):
        final = B.resolve_final(ROW_HOME_SECOND, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, ('ARS', 'HUL'))
        self.assertEqual((final['home'], final['home_score'], final['away'], final['away_score']), ('ARS', 1, 'HUL', 0))

    def test_missing_card_home_uses_schedule_identity(self):
        final = B.resolve_final(ROW_HOME_FIRST, 'ARS', 'HUL', None, 'Arsenal', 'Hull City', KO, ('ARS', 'HUL'))
        self.assertEqual(final['orientation'], 'verified')
        self.assertEqual((final['home'], final['home_score'], final['away'], final['away_score']), ('ARS', 1, 'HUL', 0))

    def test_schedule_home_conflict_does_not_invent_orientation(self):
        final = B.resolve_final(ROW_HOME_SECOND, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, ('HUL', 'ARS'))
        self.assertEqual(final['orientation'], 'teams_only')
        self.assertIsNone(final['home'])
        self.assertEqual((final['fav_score'], final['dog_score']), (1, 0))

    def test_wrong_teams_rejected(self):
        self.assertIsNone(B.resolve_final(ROW_HOME_SECOND, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, ('CHE', 'HUL')))

    def test_duplicate_abbreviation_rejected(self):
        self.assertIsNone(B.resolve_final(['post', 'Final', 'ARS', 1, 'ARS', 0, KO], 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull', KO, None))

    def test_non_final_and_postponed_rejected(self):
        self.assertIsNone(B.resolve_final(['in', "43'", 'HUL', 0, 'ARS', 1, KO], 'ARS', 'HUL', 'ARS', 'A', 'H', KO, None))
        self.assertIsNone(B.resolve_final(['post', 'Postponed', 'HUL', 0, 'ARS', 0, KO], 'ARS', 'HUL', 'ARS', 'A', 'H', KO, None))

    def test_newest_observation_wins_over_older_final(self):
        live = ['in', "43'", 'HUL', 0, 'ARS', 1, KO]
        self.assertIsNone(B.classify_latest([live, ROW_HOME_SECOND]))
        self.assertEqual(B.classify_latest([None, ROW_HOME_SECOND]), ROW_HOME_SECOND)
        self.assertEqual(B.classify_latest([ROW_HOME_SECOND, live]), ROW_HOME_SECOND)
        postponed = ['post', 'Postponed', 'HUL', 0, 'ARS', 0, KO]
        self.assertIsNone(B.classify_latest([postponed, ROW_HOME_SECOND]))

    def test_kickoff_far_from_card_rejected(self):
        late = ['post', 'Final', 'HUL', 0, 'ARS', 1, '2026-11-10T15:00:00Z']
        self.assertIsNone(B.resolve_final(late, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, None))
        day = ['post', 'Final', 'HUL', 0, 'ARS', 1, '2026-11-08T15:00:00Z']
        self.assertIsNotNone(B.resolve_final(day, 'ARS', 'HUL', 'ARS', 'Arsenal', 'Hull City', KO, None))

    def test_text_legs_use_favorite_identity(self):
        nil = B.grade_text_leg('Arsenal to win to nil', 'Arsenal', 1, 0)
        self.assertEqual(nil['res'], 'win')
        spread = B.grade_text_leg('Arsenal -1.5', 'Arsenal', 1, 0)
        self.assertEqual(spread['res'], 'loss')
        drew = B.grade_text_leg('Arsenal to win', 'Arsenal', 1, 1)
        self.assertEqual(drew['res'], 'loss')
        other = B.grade_text_leg('Hull City -1.5', 'Arsenal', 3, 0)
        self.assertEqual(other['res'], 'unknown')
        mystery = B.grade_text_leg('Arsenal over 2.5 team goals', 'Arsenal', 3, 0)
        self.assertEqual(mystery['res'], 'unknown')

    def test_player_grades_and_unknowns(self):
        self.assertEqual(B.grade_stat({'totalGoals': 0}, 'Anytime Goal', 0.5), ('loss', 0))
        self.assertEqual(B.grade_stat({'shotsOnTarget': 2}, 'Shots on Target', 0.5), ('win', 2))
        self.assertEqual(B.grade_stat({'goalAssists': 1}, 'Assists', 1), ('push', 1))
        self.assertEqual(B.grade_stat({'totalGoals': 0}, 'Shots on Target', 0.5)[0], 'unknown')
        self.assertEqual(B.grade_stat({'totalGoals': 1, 'goals': 0}, 'Anytime Goal', 0.5)[0], 'unknown')
        self.assertEqual(B.grade_stat(None, 'Anytime Goal', 0.5)[0], 'unknown')

    def test_anytime_aid_from_published_card_not_a_guess(self):
        names = {}
        card = {'khvichakvaratskhelia': {'274745'}}
        self.assertEqual(B.player_aid('Khvicha Kvaratskhelia', names, card), '274745')
        self.assertIsNone(B.player_aid('Khvicha Kvaratskhelia', {'khvichakvaratskhelia': {'1', '2'}}, card))
        self.assertIsNone(B.player_aid('Khvicha Kvaratskhelia', {'khvichakvaratskhelia': {'999'}}, card))

    def test_last_prekickoff_card_only(self):
        store = {}
        early = {'game': '1', 'time': '2026-11-07T20:00:00Z', 'title': 'early', 'tier': 'main'}
        late = {'game': '1', 'time': '2026-11-07T20:00:00Z', 'title': 'late', 'tier': 'main'}
        after = {'game': '1', 'time': '2026-11-07T20:00:00Z', 'title': 'after', 'tier': 'main'}
        hidden = {'game': '2', 'time': '2026-11-07T20:00:00Z', 'tier': '-'}
        ko = datetime(2026, 11, 7, 20, tzinfo=timezone.utc).timestamp()
        B.consider_card(store, 'sgp', ko - 100, early)
        B.consider_card(store, 'sgp', ko - 5, late)
        B.consider_card(store, 'sgp', ko + 5, after)
        B.consider_card(store, 'lop', ko - 5, hidden)
        self.assertEqual(store['1']['sgp'][1]['title'], 'late')
        self.assertNotIn('2', store)

    def test_combine_keeps_losses_and_neutral(self):
        self.assertEqual(B.combine(['win', 'loss']), 'loss')
        self.assertEqual(B.combine(['loss', 'pending']), 'loss')
        self.assertEqual(B.combine(['win', 'unknown']), 'unknown')
        self.assertEqual(B.combine(['win', 'push']), 'win')
        self.assertEqual(B.combine(['push', 'void']), 'push')
        self.assertEqual(B.combine(['void']), 'void')
        self.assertEqual(B.combine([]), 'pending')

    def test_assemble_does_not_use_another_games_stats(self):
        kinds = {'sgp': (1, {
            'game': '9', 'time': KO, 'fav': 'ARS', 'dog': 'HUL', 'home': 'ARS', 'lg': 'eng.1', 'tier': 'main',
            'club': {'name': 'Arsenal'}, 'opp': {'name': 'Hull City'},
            'legs': [{'player': 'Kai Havertz', 'aid': '231182', 'market': 'Anytime Goal', 'line': 0.5}],
        })}
        live = {'row': ROW_HOME_SECOND, 'players': {'231182': {'totalGoals': 0, 'shotsOnTarget': 1}}, 'names': {}}
        other = {'row': ROW_HOME_SECOND, 'players': {'999': {'totalGoals': 4}}, 'names': {}}
        game = B.assemble_game('9', kinds, live, ('ARS', 'HUL'))
        self.assertEqual(game['sgp']['legs'][0]['res'], 'loss')
        self.assertEqual(game['sgp']['legs'][0]['actual'], 0)
        self.assertEqual(game['sgp']['res'], 'loss')
        self.assertEqual(B.assemble_game('9', kinds, other, ('ARS', 'HUL'))['sgp']['legs'][0]['res'], 'unknown')

    def test_builder_does_not_read_ledger_or_restricted_sources(self):
        src = (ROOT / 'scripts' / 'build_soccer_history.py').read_text()
        self.assertNotIn('results_ledger', src)
        self.assertNotIn('statsbomb', src.lower())
        self.assertNotIn('SoccerVisualLab', src)
        ui = (ROOT / 'soccer-history.js').read_text()
        self.assertNotIn('results_ledger', ui)
        self.assertIn('does not refresh on its own', ui)


if __name__ == '__main__':
    unittest.main()
