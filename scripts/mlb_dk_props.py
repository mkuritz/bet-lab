"""DraftKings MLB player props for MLB Lab (batter_home_runs, pitcher_strikeouts) via The Odds API.
Credit-safe: the Odds API key/credits are budgeted for Arb Lab + Bet Lab (arb-lab data/odds_budget.json).
Rules: <=1 pull per ET day, only 0.5-4h before the day's first pitch, cost = 2 credits/event, MLB monthly cap 24,
and only when Arb Lab's published budget projects >=100 credits left at month end after this spend.
Otherwise writes status and MLB Lab falls back to Kalshi or shows 'no line'."""
import json,os,math,urllib.request,datetime as dt,unicodedata,re
OUT="data/mlb_dk_props.json";CAP=24;ET=dt.timezone(dt.timedelta(hours=-4))
def J(u):
  r=urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"bet-lab"}),timeout=30);return json.load(r),r.headers
def norm(s):s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower();s=re.sub(r'[^a-z ]','',s);return re.sub(r'\b(jr|sr|ii|iii)\b','',s).strip()
def main():
  now=dt.datetime.now(dt.timezone.utc);today=str(now.astimezone(ET).date());mon=today[:7]
  st=json.load(open(OUT)) if os.path.exists(OUT) else {}
  use=st.get("usage",{});use={"month":mon,"used":0,"polls":[]} if use.get("month")!=mon else use
  def done(status,**k):
    st.update(status=status,checked=now.isoformat(timespec="seconds"),usage=use,**k);json.dump(st,open(OUT,"w"),separators=(",",":"));print("mlb dk:",status)
  key=os.environ.get("ODDS_API_KEY")
  if not key:return done("no key")
  if any(p["day"]==today for p in use["polls"]):return done("already pulled today")
  try:ev,_=J(f"https://api.the-odds-api.com/v4/sports/baseball_mlb/events?apiKey={key}")   # events list: 0 credits
  except Exception as e:return done(f"events error {e}")
  todays=[e for e in ev if dt.datetime.fromisoformat(e["commence_time"].replace("Z","+00:00")).astimezone(ET).date().isoformat()==today]
  if not todays:return done("no MLB games today")
  first=min(dt.datetime.fromisoformat(e["commence_time"].replace("Z","+00:00")) for e in todays);hrs=(first-now).total_seconds()/3600
  if not (0.5<=hrs<=4):return done(f"outside pull window ({hrs:.1f}h to first pitch)")
  cost=2*len(todays)
  if use["used"]+cost>CAP:return done("MLB monthly cap reached")
  try:b,_=J("https://mkuritz.github.io/arb-lab/data/odds_budget.json")
  except Exception as e:return done(f"arb budget unreadable, skipping ({e})")
  rem=b.get("remaining");used=b.get("used") or 0
  if rem is None:return done("arb budget has no remaining figure, skipping")
  d=int(today[8:]);nxt=(dt.date.fromisoformat(today).replace(day=28)+dt.timedelta(days=4)).replace(day=1);left_days=(nxt-dt.date.fromisoformat(today)).days
  proj_arb=used/max(d,1)*left_days
  if rem-cost-proj_arb<100:return done(f"budget guard: remaining {rem}, projected Arb/Bet use {proj_arb:.0f}")
  hr,k={},{};hdr=None
  for e in todays:
    try:
      o,hdr=J(f"https://api.the-odds-api.com/v4/sports/baseball_mlb/events/{e['id']}/odds?apiKey={key}&regions=us&markets=batter_home_runs,pitcher_strikeouts&bookmakers=draftkings&oddsFormat=american")
    except Exception as x:print("event",e["id"],x);continue
    for bk in o.get("bookmakers",[]):
      for m in bk.get("markets",[]):
        for c in m.get("outcomes",[]):
          n=norm(c.get("description"))
          if m["key"]=="batter_home_runs" and c["name"]=="Over" and c.get("point")==0.5:hr[n]=dict(odds=c["price"],line=0.5,game=e["id"])
          if m["key"]=="pitcher_strikeouts":
            r=k.setdefault(n,dict(line=c.get("point"),game=e["id"]));r["over" if c["name"]=="Over" else "under"]=c["price"]
  use["used"]+=cost;use["polls"].append(dict(day=today,t=now.isoformat(timespec="seconds"),cost=cost,events=len(todays),hdr_remaining=hdr.get("x-requests-remaining") if hdr else None))
  done("ok",pulled=now.isoformat(timespec="seconds"),date=today,hr=hr,k=k)
if __name__=="__main__":main()
