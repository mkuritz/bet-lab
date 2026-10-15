"""Walk-forward recalibration + evaluation for Edge Tracker picks (honest, out-of-sample only).
For each graded pick in start-time order, fit the calibrator ONLY on picks graded before it started, then score it.
Candidates: raw (identity), Platt (logistic on logit p, L2-shrunk toward identity), isotonic (PAV, shrunk toward raw by n/(n+K)).
A calibrator ships (data/edge_calib.json "active") only if its out-of-sample Brier AND log-loss beat raw on >= MIN_EVAL picks.
Market baseline = entry implied probability on the same picks (where priced)."""
import json, math, os, datetime as dt
D = os.path.join(os.path.dirname(__file__), "..", "data")
MIN_TRAIN, MIN_EVAL, K_SHRINK = 30, 40, 50
def p_(f): return os.path.join(D, f)
def load(f, d):
    try: return json.load(open(p_(f)))
    except Exception: return d
def clip(p): return min(max(p, 1e-4), 1 - 1e-4)
def logit(p): p = clip(p); return math.log(p / (1 - p))
def sig(z): return 1 / (1 + math.exp(-z))

def fit_platt(P, Y, lam=2.0, it=200):
    a, b = 1.0, 0.0  # identity prior; L2 penalty pulls toward (1,0)
    X = [logit(p) for p in P]
    for _ in range(it):
        ga = gb = 0.0; haa = hbb = hab = 0.0
        for x, y in zip(X, Y):
            q = sig(a * x + b); r = q - y; w = q * (1 - q)
            ga += r * x; gb += r; haa += w * x * x; hbb += w; hab += w * x
        ga += lam * (a - 1); gb += lam * b; haa += lam; hbb += lam
        det = haa * hbb - hab * hab
        if det <= 1e-12: break
        da = (hbb * ga - hab * gb) / det; db = (haa * gb - hab * ga) / det
        a -= da; b -= db
        if abs(da) + abs(db) < 1e-7: break
    return lambda p: sig(a * logit(p) + b), (round(a, 4), round(b, 4))

def fit_iso(P, Y):
    pts = sorted(zip(P, Y)); blocks = []  # [sum_y, n, max_p]
    for p, y in pts:
        blocks.append([y, 1, p])
        while len(blocks) > 1 and blocks[-2][0] / blocks[-2][1] > blocks[-1][0] / blocks[-1][1]:
            y2, n2, p2 = blocks.pop(); blocks[-1][0] += y2; blocks[-1][1] += n2; blocks[-1][2] = p2
    n = len(P); w = n / (n + K_SHRINK)
    def f(p):
        for sy, nb, mx in blocks:
            if p <= mx: return clip(w * (sy / nb) + (1 - w) * p)
        return clip(w * blocks[-1][0] / blocks[-1][1] + (1 - w) * p)
    return f, len(blocks)

def scores(P, Y):
    n = len(P)
    if not n: return None
    return {"n": n, "brier": round(sum((p - y) ** 2 for p, y in zip(P, Y)) / n, 4),
            "logloss": round(-sum(y * math.log(clip(p)) + (1 - y) * math.log(1 - clip(p)) for p, y in zip(P, Y)) / n, 4)}

def rows_from(log, G, C):
    out = []
    for e in log:
        g = G.get(e["id"])
        if not g or g["result"] not in ("win", "loss") or e.get("p_model") is None: continue
        c = (C.get(e["id"]) or {}).get("implied")
        out.append({"id": e["id"], "t": e["start"], "p": e["p_model"], "y": 1 if g["result"] == "win" else 0, "imp": e.get("implied"),
                    "dec": e.get("price_dec"), "market": e["market"], "sport": e["sport"], "signals": e["signals"],
                    "clv": (c - e["implied"]) if (c is not None and e.get("implied") is not None) else None})
    return sorted(out, key=lambda r: r["t"])

def walk_forward(rows):
    pred = {"raw": [], "platt": [], "iso": []}; Y = []; IMP = []; used = []
    for i, r in enumerate(rows):
        train = [x for x in rows[:i] if x["t"] < r["t"]]  # strictly earlier games
        if len(train) < MIN_TRAIN: continue
        P0 = [x["p"] for x in train]; Y0 = [x["y"] for x in train]
        fp, _ = fit_platt(P0, Y0); fi, _ = fit_iso(P0, Y0)
        pred["raw"].append(r["p"]); pred["platt"].append(fp(r["p"])); pred["iso"].append(fi(r["p"]))
        Y.append(r["y"]); IMP.append(r["imp"]); used.append(r)
    res = {k: scores(v, Y) for k, v in pred.items()}
    mk = [(i, imp) for i, imp in enumerate(IMP) if imp is not None]
    res["market_same_picks"] = scores([imp for _, imp in mk], [Y[i] for i, _ in mk])
    for k in ("raw", "platt", "iso"):
        res[k + "_priced_subset"] = scores([pred[k][i] for i, _ in mk], [Y[i] for i, _ in mk])
    return res, pred, Y, used

def roi(rows, thr, pfun):
    sel = [r for r in rows if r["dec"] and r["imp"] is not None and pfun(r) - r["imp"] >= thr]
    if not sel: return {"thr": thr, "n": 0}
    u = sum((r["dec"] - 1) if r["y"] else -1 for r in sel)
    cl = [r["clv"] for r in sel if r["clv"] is not None]
    return {"thr": thr, "n": len(sel), "hit": round(sum(r["y"] for r in sel) / len(sel), 3), "units": round(u, 2), "roi": round(u / len(sel), 3),
            "exp_hit": round(sum(pfun(r) for r in sel) / len(sel), 3), "clv_n": len(cl), "clv": round(sum(cl) / len(cl), 4) if cl else None}

def run(log, G, C):
    rows = rows_from(log, G, C)
    res, pred, Y, used = walk_forward(rows)
    ev = res["raw"]["n"] if res.get("raw") else 0
    best = "raw"
    for k in ("platt", "iso"):
        r = res.get(k)
        if r and ev >= MIN_EVAL and r["brier"] < res[best]["brier"] and r["logloss"] < res[best]["logloss"]: best = k
    # full-sample fit of the shipped calibrator (applied ONLY to future picks)
    P = [r["p"] for r in rows]; Yall = [r["y"] for r in rows]; params = None
    if best == "platt": _, params = fit_platt(P, Yall)
    elif best == "iso":
        f, nb = fit_iso(P, Yall); params = {"knots": [[round(x / 20, 2), round(f(x / 20), 4)] for x in range(1, 20)], "blocks": nb}
    # threshold study on walk-forward-calibrated p where available (OOS), raw otherwise
    oos = {r["id"]: pred[best][i] for i, r in enumerate(used)} if ev else {}
    thr = [roi(rows, t, lambda r: r["p"]) for t in (0.0, 0.02, 0.04, 0.06, 0.08)]
    thr_oos = [roi([r for r in rows if r["id"] in oos], t, lambda r: oos[r["id"]]) for t in (0.0, 0.02, 0.04, 0.06, 0.08)]
    out = {"updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="minutes"), "graded": len(rows), "oos_evaluated": ev,
           "min_train": MIN_TRAIN, "min_eval": MIN_EVAL, "walk_forward": res, "active": best, "params": params,
           "thresholds_raw_insample": thr, "thresholds_oos": thr_oos,
           "note": "Calibrator only ships if out-of-sample Brier and log-loss both beat raw. Samples under ~100 are noise-dominated."}
    json.dump(out, open(p_("edge_calib.json"), "w"), separators=(",", ":"), sort_keys=True)
    return out

def apply(p, cal):
    if p is None or not cal or cal.get("active") in (None, "raw"): return p
    if cal["active"] == "platt":
        a, b = cal["params"]; return round(sig(a * logit(p) + b), 4)
    ks = cal["params"]["knots"]
    if p <= ks[0][0]: return ks[0][1]
    for (x0, y0), (x1, y1) in zip(ks, ks[1:]):
        if p <= x1: return round(y0 + (y1 - y0) * (p - x0) / (x1 - x0), 4)
    return ks[-1][1]
