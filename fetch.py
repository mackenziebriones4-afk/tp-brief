#!/usr/bin/env python3
"""Terminal Paradigm Brief: daily updater.

Reads public RSS feeds, scores the stories with simple keyword rules, works out a rough
city score from headline counts, and writes live.js (what the app shows) and history.json
(the weekly city record). Standard library only.

Rules it follows:
- Only a headline, a short summary (max ~240 characters) and the link are kept. No full articles.
- Turkey stories come from English-language feeds only, so every Turkey title is already English.
- A story gets a map pin only when the city name is in the headline. Otherwise no pin.
- Every feed is tried on its own. A broken feed is logged and skipped, never fatal.
"""
import datetime as dt
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (compatible; TPBriefBot/1.0; +https://github.com/)"
MANILA = dt.timezone(dt.timedelta(hours=8))
NOW = dt.datetime.now(dt.timezone.utc)

# ---- feeds. url lists are tried in order until one works ------------------------------
FEEDS = [
    dict(id="dailysabah", mode="tk", name="Daily Sabah", country="Türkiye", lang="English",
         urls=["https://www.dailysabah.com/rssFeed/technology", "https://www.dailysabah.com/rssFeed/turkey"],
         home="https://www.dailysabah.com/", covers="Turkish news in English, with a technology section."),
    dict(id="hdn", mode="tk", name="Hürriyet Daily News", country="Türkiye", lang="English",
         urls=["https://www.hurriyetdailynews.com/rss"],
         home="https://www.hurriyetdailynews.com/", covers="Turkish news in English."),
    dict(id="duvar", mode="tk", name="Duvar English", country="Türkiye", lang="English",
         urls=["https://www.duvarenglish.com/export/rss"],
         home="https://www.duvarenglish.com/", covers="Turkish news in English from an independent outlet."),
    dict(id="aa", mode="tk", name="Anadolu Agency", country="Türkiye", lang="English",
         urls=["https://www.aa.com.tr/en/rss/default?cat=turkiye", "https://www.aa.com.tr/en/rss/default?cat=science-technology"],
         home="https://www.aa.com.tr/en", covers="State news agency, English service."),
    dict(id="gma", mode="ph", name="GMA News Online", country="Philippines", lang="English and Filipino",
         urls=["https://data.gmanetwork.com/gno/rss/news/feed.xml", "https://www.gmanetwork.com/news/rss/news"],
         home="https://www.gmanetwork.com/news/", covers="Philippine national news, home of 24 Oras."),
    dict(id="inquirer", mode="ph", name="Inquirer.net", country="Philippines", lang="English",
         urls=["https://www.inquirer.net/fullfeed", "https://newsinfo.inquirer.net/feed"],
         home="https://www.inquirer.net/", covers="Philippine national news."),
    dict(id="rappler", mode="ph", name="Rappler", country="Philippines", lang="English",
         urls=["https://www.rappler.com/feed/"],
         home="https://www.rappler.com/", covers="Philippine news and explainers."),
    dict(id="philstar", mode="ph", name="Philstar", country="Philippines", lang="English",
         urls=["https://www.philstar.com/rss/headlines", "https://www.philstar.com/rss/nation"],
         home="https://www.philstar.com/", covers="Philippine national news."),
]
KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

# ---- cities ---------------------------------------------------------------------------
TK_CITIES = {"İstanbul": ["istanbul", "i̇stanbul"], "Ankara": ["ankara"], "İzmir": ["izmir", "i̇zmir"],
             "Bursa": ["bursa"], "Antalya": ["antalya"], "Adana": ["adana"], "Konya": ["konya"],
             "Gaziantep": ["gaziantep"], "Kayseri": ["kayseri"], "Mersin": ["mersin"],
             "Diyarbakır": ["diyarbakir", "diyarbakır"], "Samsun": ["samsun"], "Trabzon": ["trabzon"]}
PH_CITIES = {"Manila": ["manila", "metro manila"], "Cebu City": ["cebu city", "cebu"],
             "Davao City": ["davao"], "Zamboanga City": ["zamboanga"],
             "Cagayan de Oro": ["cagayan de oro"], "Iloilo City": ["iloilo"], "Bacolod": ["bacolod"],
             "Baguio": ["baguio"], "Angeles": ["angeles city"], "General Santos": ["general santos"],
             "Tacloban": ["tacloban"], "Puerto Princesa": ["puerto princesa"], "Legazpi": ["legazpi"],
             "Tuguegarao": ["tuguegarao"], "Laoag": ["laoag"]}
WELL = {"tk": [("İstanbul", "IST"), ("Ankara", "ANK"), ("İzmir", "IZM"), ("Bursa", "BUR"), ("Antalya", "ANT")],
        "ph": [("Manila", "MNL"), ("Cebu City", "CEB"), ("Davao City", "DVO"), ("Baguio", "BAG"), ("Iloilo City", "ILO")]}

# ---- keyword rules (simple on purpose) ------------------------------------------------
RED = ["ransomware", "breach", "hacked", "cyberattack", "cyber attack", "data leak", "leaked", "outage", "blackout",
       "earthquake", "typhoon", "flood", "flooding", "landslide", "explosion", "fire", "killed", "dead", "deaths",
       "collapse", "crash", "state of calamity", "evacuat", "wildfire", "attack", "airstrike", "suicide"]
YEL = ["warning", "alert", "vulnerability", "exploit", "scam", "phishing", "storm", "signal no", "rain", "delay",
       "shortage", "protest", "strike", "price hike", "inflation", "investigation", "probe", "suspend", "ban",
       "fraud", "arrest", "fine", "recall", "drought", "heat"]
INCIDENT = ["attack", "breach", "hacked", "outage", "blackout", "earthquake", "typhoon", "flood", "landslide",
            "explosion", "fire", "crash", "collapse", "storm", "evacuat", "wildfire", "ransomware", "leak"]
CYBER = ["cyber", "hack", "ransomware", "malware", "phishing", "breach", "data leak", "vulnerab", "encryption", "firewall",
         "security", "software", "ai ", "artificial intelligence", "chip", "semiconductor", "5g", "telecom", "satellite",
         "drone", "robot", "camera", "surveillance", "digital", "internet", "online", "app ", "startup", "technology",
         "tech ", "electric vehicle", "ev ", "battery", "data center", "cloud", "blockchain", "e-government", "identity"]
POS = ["opens", "launch", "wins", "win ", "improve", "record high", "festival", "boost", "growth", "expands",
       "approves", "inaugurat", "success", "agreement", "rises", "recovers", "new "]
UNVERIFIED = ["reportedly", "alleged", "allegedly", "unconfirmed", "claims", "claimed", "rumor", "rumour", "sources say", "suspected"]
SENSITIVE = ["hospital", "child", "children", "minor", "victim", "killed", "dead", "deaths", "school", "student", "rape", "suicide", "patients"]
LEGAL = ["arrest", "court", "sued", "lawsuit", "charged", "accused", "hacker group", "indict", "trial", "convict", "suspect"]
PALETTE = [("#1f9c8a", "#0a3550"), ("#2f6fd6", "#0b2a63"), ("#5a6fb8", "#1b2452"), ("#3f9a4a", "#123a1c")]


# ---- helpers --------------------------------------------------------------------------
def log(*a):
    print(*a, file=sys.stderr)


def http_get(feed_id, url):
    off = os.environ.get("TP_OFFLINE_DIR")
    if off:  # test mode: read a saved file instead of the network
        p = os.path.join(off, feed_id + ".xml")
        if not os.path.exists(p):
            raise IOError("no fixture")
        return open(p, "rb").read()
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read(3_000_000)


def clean(s):
    s = html.unescape(s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def short(s, n=240):
    if len(s) <= n:
        return s
    cut = s[:n]
    m = max(cut.rfind(". "), cut.rfind("? "), cut.rfind("! "))
    if m > n * 0.5:
        return cut[:m + 1]
    return cut[:cut.rfind(" ")].rstrip(",;:") + "…"


def local(tag):
    return tag.split("}")[-1].lower()


def parse_date(s):
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d


def parse_feed(raw):
    root = ET.fromstring(raw)
    items = []
    for el in root.iter():
        if local(el.tag) not in ("item", "entry"):
            continue
        f = {}
        for c in el:
            t = local(c.tag)
            if t == "link":
                f["link"] = c.attrib.get("href") or (c.text or "").strip() or f.get("link")
            elif t in ("title", "description", "summary", "content", "encoded"):
                f.setdefault(t if t == "title" else "desc", c.text or "")
            elif t in ("pubdate", "published", "updated", "date"):
                f.setdefault("date", c.text or "")
        title = clean(f.get("title"))
        if not title or not f.get("link"):
            continue
        desc = short(clean(f.get("desc")))
        if desc.lower().startswith(title.lower()[:40]):
            desc = ""
        items.append(dict(title=title, summary=desc, url=f["link"].strip(), date=parse_date(f.get("date"))))
    return items


def has(text, words):
    t = " " + text.lower() + " "
    return [w for w in words if w in t]


def find_city(text, table):
    t = text.lower()
    best = None
    for name, aliases in table.items():
        for a in aliases:
            i = t.find(a)
            if i >= 0 and (best is None or i < best[0]):
                best = (i, name)
    return best[1] if best else None


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


# ---- scoring --------------------------------------------------------------------------
def build_story(it, feed, mode):
    text = it["title"]
    full = it["title"] + " " + it["summary"]
    red, yel = has(full, RED), has(full, YEL)
    lvl = "r" if red else "y" if yel else "g"
    blink = (lvl == "r" and len(red) >= 2) or (lvl == "y" and len(yel) >= 3)
    incident = bool(has(full, INCIDENT))
    table = TK_CITIES if mode == "tk" else PH_CITIES
    city_t, city_s = find_city(it["title"], table), find_city(it["summary"], table)
    loc = {"city": city_t, "conf": "high"} if city_t else {"city": city_s, "conf": "low"} if city_s else None
    cyber = bool(has(full, CYBER))
    flags = []
    if has(full, UNVERIFIED):
        flags.append({"k": "unverified", "line": "The report uses cautious wording (alleged, reportedly, suspected). Check it before you rely on it."})
    if has(full, SENSITIVE):
        flags.append({"k": "sensitive", "line": "People may be hurt or named. Be careful with names, faces and wording."})
    if has(full, LEGAL):
        flags.append({"k": "legal", "line": "Arrests, court or accusations are involved. Do not state guilt, and do not name suspects."})
    score = (4 if lvl == "r" else 2 if lvl == "y" else 0) + (2 if blink else 0) + (3 if cyber else 0)
    age_h = (NOW - it["date"]).total_seconds() / 3600 if it["date"] else 24
    score += max(0, 2 - age_h / 12)
    a1, a2 = {"r": ("#b3312b", "#4a1220"), "y": ("#c9a227", "#3c3410")}.get(lvl) or PALETTE[sum(map(ord, it["title"])) % 4]
    recap = it["summary"] or "No summary in the feed. Open the source to read the story."
    s = dict(lvl=lvl, blink=blink, title=text, src=feed["name"], incident=incident, loc=loc,
             recap=recap, url=it["url"], a1=a1, a2=a2)
    ex = dict(type="incident" if incident else "news", risk=flags)
    if mode == "tk":
        t = text.rstrip(".")
        ex["angles"] = [
            "Explain it in 60 seconds: what happened, who is affected, what to watch next. Story: " + t,
            "Turn it into a question for a small business owner in Türkiye: what would you check today?",
            "One calm, practical thing a viewer can do this week because of this story.",
        ]
    return s, ex, score, norm(text)


def pick(items, feed_by_item, mode, limit, max_age_h):
    seen, out = set(), []
    for it in items:
        if it["date"] and (NOW - it["date"]).total_seconds() > max_age_h * 3600:
            continue
        s, ex, score, key = build_story(it, feed_by_item[id(it)], mode)
        k = key[:60]
        if k in seen:
            continue
        seen.add(k)
        out.append((score, s, ex))
    out.sort(key=lambda x: -x[0])
    return out[:limit]


# ---- wellbeing ------------------------------------------------------------------------
def city_scores(items, table, mode, prev):
    res = {}
    for name, code in WELL[mode]:
        neg = pos = n = 0
        for it in items:
            full = it["title"] + " " + it["summary"]
            if find_city(it["title"], {name: table[name]}):
                n += 1
                if has(full, RED) or has(full, INCIDENT):
                    neg += 1
                elif has(full, POS):
                    pos += 1
        if n == 0:
            res[name] = prev.get(name) if prev.get(name) is not None else 70
        else:
            res[name] = max(20, min(95, 80 - 12 * neg + 3 * pos))
    return res


def week_label():
    d = NOW.astimezone(MANILA).date()
    mon = d - dt.timedelta(days=d.weekday())
    return f"{mon.day} {mon.strftime('%b')}"


def update_history(scores):
    path = os.path.join(HERE, "history.json")
    try:
        h = json.load(open(path, encoding="utf-8"))
    except Exception:
        h = {"weeks": [], "tk": {}, "ph": {}}
    wk = week_label()
    new_week = not h["weeks"] or h["weeks"][-1] != wk
    if new_week:
        h["weeks"].append(wk)
    for mode in ("tk", "ph"):
        for city, v in scores[mode].items():
            lst = h[mode].setdefault(city, [])
            while len(lst) < len(h["weeks"]) - 1:
                lst.insert(0, v)              # a city that appeared late: fill earlier weeks with its first value
            if new_week:
                lst.append(v)
            else:
                lst[-1] = v
    h["weeks"] = h["weeks"][-12:]
    for mode in ("tk", "ph"):
        for city in h[mode]:
            h[mode][city] = h[mode][city][-12:]
    json.dump(h, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return h


# ---- main -----------------------------------------------------------------------------
def main():
    all_items, owner, feeds_out, used = [], {}, [], []
    for f in FEEDS:
        got, err, used_url = [], "", ""
        for u in f["urls"]:
            try:
                got = parse_feed(http_get(f["id"], u))
                used_url = u
                if got:
                    break
            except Exception as e:  # one broken feed never stops the run
                err = f"{type(e).__name__}: {e}"[:120]
        for it in got:
            it["feed"] = f["id"]
            owner[id(it)] = f
            all_items.append(it)
        ok = bool(got)
        log(("OK   " if ok else "FAIL ") + f["name"], len(got), used_url or err)
        feeds_out.append(dict(id=f["id"], ok=ok, n=len(got)))
        used.append((f, ok, len(got), used_url or f["home"], err))

    tk_items = [i for i in all_items if owner[id(i)]["mode"] == "tk"]
    ph_items = [i for i in all_items if owner[id(i)]["mode"] == "ph"]
    # Turkey is a cyber / IT / tech brief: keep tech-fit stories, and only top up with serious incidents if there are few
    tk_all = pick(tk_items, owner, "tk", 40, 72)
    tk = [x for x in tk_all if has(x[1]["title"] + " " + x[1]["recap"], CYBER)]
    if len(tk) < 3:
        tk += [x for x in tk_all if x not in tk and x[1]["lvl"] in ("r", "y")][:3 - len(tk)]
    tk = tk[:6]
    ph = pick(ph_items, owner, "ph", 10, 48)

    tk_stories, tk_ex = [], []
    for rank, (_, s, ex) in enumerate(tk, 1):
        s["rank"] = rank
        tk_stories.append(s)
        tk_ex.append(ex)
    ph_stories = [s for _, s, _ in ph]
    ph_ex = [ex for _, _, ex in ph]

    # rough city score from headline counts over the last 7 days
    week_items = [i for i in all_items if not i["date"] or (NOW - i["date"]).days <= 7]
    try:
        old = json.load(open(os.path.join(HERE, "history.json"), encoding="utf-8"))
    except Exception:
        old = {"tk": {}, "ph": {}}
    prev = {m: {c: (v[-1] if v else None) for c, v in old.get(m, {}).items()} for m in ("tk", "ph")}
    scores = {"tk": city_scores([i for i in week_items if owner[id(i)]["mode"] == "tk"], TK_CITIES, "tk", prev["tk"]),
              "ph": city_scores([i for i in week_items if owner[id(i)]["mode"] == "ph"], PH_CITIES, "ph", prev["ph"])}
    h = update_history(scores)
    wellbeing = {"weeks": h["weeks"], "year": str(NOW.astimezone(MANILA).year)}
    for mode in ("tk", "ph"):
        wellbeing[mode] = [dict(city=c, code=code, hist=h[mode][c]) for c, code in WELL[mode]]

    # one real fact for the intel card
    intel = None
    try:
        kev = json.loads(http_get("kev", KEV_URL).decode("utf-8"))
        vulns = kev.get("vulnerabilities", [])
        cut = (NOW - dt.timedelta(days=7)).date().isoformat()
        recent = sum(1 for v in vulns if v.get("dateAdded", "") >= cut)
        intel = dict(text=f"CISA's Known Exploited Vulnerabilities list holds {len(vulns)} entries. {recent} were added in the past 7 days.",
                     source="CISA KEV")
    except Exception as e:
        log("FAIL CISA KEV", type(e).__name__, e)

    ok_n = sum(1 for _, ok, _, _, _ in used if ok)
    top_tk = tk_stories[0]["title"] if tk_stories else None
    top_ph = ph_stories[0]["title"] if ph_stories else None
    unclear = sum(1 for s in tk_stories + ph_stories if s["loc"] and s["loc"]["conf"] != "high")
    parts = ["Good morning."]
    parts.append(f"Turkey: {len(tk_stories)} stories" + (f", led by \"{top_tk}\"." if top_tk else "."))
    parts.append(f"Philippines: {len(ph_stories)} stories" + (f", led by \"{top_ph}\"." if top_ph else "."))
    parts.append(f"{ok_n} of {len(FEEDS)} feeds were read.")
    if unclear:
        parts.append(f"{unclear} stor{'y has' if unclear == 1 else 'ies have'} an unclear location, so no pin.")
    sources = []
    for f, ok, n, url, err in used:
        sources.append(dict(name=f["name"], mode=f["mode"], kind="News outlet", official=False, country=f["country"],
                            lang=f["lang"], covers=f["covers"], why="Public RSS feed read by the daily job.",
                            read="Reported news. Check names and numbers against the story itself.", url=f["home"],
                            live=True, ok=ok, n=n,
                            read_at=NOW.astimezone(MANILA).strftime("%d %b %Y, %H:%M PH")))
    live = dict(generated=NOW.astimezone(MANILA).isoformat(timespec="minutes"),
                tk=dict(stories=tk_stories,
                        update=f"{len(tk_stories)} stories from English-language feeds. Ranked by level, then cyber and tech fit."),
                ph=dict(stories=ph_stories, update=f"{len(ph_stories)} stories from Philippine feeds, ranked by level and recency."),
                extra=dict(tk=tk_ex, ph=ph_ex), wellbeing=wellbeing, intel=intel, briefing=" ".join(parts),
                sources=[s for s in sources if s["ok"]] or sources,
                remarkable=[tk_stories[0]["src"]] if tk_stories else [], feeds=feeds_out)
    # if nothing was read, keep the previous live.js instead of replacing it with an empty one
    if not tk_stories and not ph_stories:
        log("No stories read. Keeping the previous live.js.")
        return 0
    with open(os.path.join(HERE, "live.js"), "w", encoding="utf-8") as fh:
        fh.write("/* Written by fetch.py. Do not edit by hand. */\nwindow.TP_LIVE = ")
        json.dump(live, fh, ensure_ascii=False)
        fh.write(";\n")
    log(f"Wrote live.js: {len(tk_stories)} TR, {len(ph_stories)} PH stories")
    return 0


if __name__ == "__main__":
    sys.exit(main())
