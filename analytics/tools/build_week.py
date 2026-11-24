#!/usr/bin/env python3
"""Turns a raw weekly scan (items with sources) into analytics/YYYY-Www.json. Rules: see ../SCHEMA.md."""
import json, os, sys, datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
BASE = {"primary": 60, "outlet": 45, "weak": 30}

def confidence(item):
    srcs = [s for s in item["sources"] if s.get("read")]
    if not srcs:
        raise SystemExit("item without an opened source: " + item["id"])
    best = max(BASE[s["tier"]] for s in srcs)
    c = best + 15 * (len(srcs) - 1)
    if all(s["tier"] == "weak" for s in srcs):
        c = min(c, 40)
    if item.get("contradicted"):
        c -= 25
    return max(0, min(100, c))

def calm(items, region):
    p = 0.0
    for it in items:
        if it["type"] != "incident" or it["conf"] < 30:
            continue
        if it["region"] not in (region.upper(), "Global"):
            continue
        p += it.get("severity", 1) * it["conf"] / 100
    return round(max(0, 100 - 3 * p))

def main(raw_path):
    raw = json.load(open(raw_path))
    items = raw["items"]
    for it in items:
        it["conf"] = confidence(it)
        it["fakish"] = it["conf"] < 30
    live = [i for i in items if not i["fakish"]]
    topics = {}
    for i in live:
        topics[i["topic"]] = topics.get(i["topic"], 0) + 1
    counts = {
        "category": {k: sum(1 for i in live if i["category"] == k) for k in ("AI", "Cloud", "Cyber")},
        "type": {k: sum(1 for i in live if i["type"] == k) for k in ("incident", "release", "trend")},
        "niche": sum(1 for i in live if i["niche"] >= 4),
        "mainstream": sum(1 for i in live if i["niche"] <= 3),
    }
    week = {
        "id": raw["id"], "week_start": raw["week_start"], "label": raw["label"],
        "generated": dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).isoformat(timespec="minutes"),
        "window": raw["window"], "thin_week": len(live) < 10,
        "health": {"tk": calm(items, "tk"), "ph": calm(items, "ph")},
        "counts": counts, "topics": topics, "items": items,
    }
    path = os.path.join(OUT, raw["id"] + ".json")
    json.dump(week, open(path, "w"), indent=1, ensure_ascii=False)
    idx_path = os.path.join(OUT, "index.json")
    idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {"weeks": []}
    if raw["id"] not in idx["weeks"]:
        idx["weeks"].append(raw["id"])
    idx["weeks"].sort()
    idx["latest"] = idx["weeks"][-1]
    json.dump(idx, open(idx_path, "w"), indent=1)
    print(path, "items", len(items), "counted", len(live), "health", week["health"], "topics", topics)

if __name__ == "__main__":
    main(sys.argv[1])
