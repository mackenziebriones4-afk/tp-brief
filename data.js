/* Terminal Paradigm Brief: step 3 sample content.
   Stands in for the parts of daily.json and sources.json that the daily job writes in Part 2.
   Everything here is sample text. None of it is real news or a real source. */
window.TP_EXTRA = {

  /* per-story extras, in the same order as the story lists */
  tk: [
    { topic: "atk", type: "incident",
      what: "Attackers got into the hospital group's network and ran ransomware, software that locks files until a payment is made.",
      why: "Hospitals cannot pause care, so locked records put pressure on them fast. It shows how an IT failure becomes a public problem.",
      terms: [["Fidye yazılımı", "Turkish for ransomware"], ["Backup", "A spare copy of data kept apart from the main system"]],
      matters: "Health providers and their IT suppliers will be asked how they would recover. Companies that sell backup, monitoring or incident response have a clear moment to explain what they do.",
      risk: [
        { k: "unverified", line: "Cause and attacker are not confirmed." },
        { k: "sensitive", line: "Patients and a hospital are involved. Do not name the hospital unless it has confirmed." },
        { k: "legal", line: "Do not attribute the attack to any group." }
      ],
      angles: [
        "What the first hour of a ransomware attack looks like inside a hospital, shown from the IT room.",
        "Paper appointments: the human side of a locked system, and what brings it back.",
        "Three questions every clinic should ask its IT supplier this week."
      ] },
    { topic: "reg", type: "regulation",
      what: "A public body published advice on protecting APIs, the connections that let apps and systems talk to each other.",
      why: "Many data leaks start at a poorly protected API. A checklist gives small teams a starting point.",
      terms: [["API", "A doorway one program uses to ask another for data"], ["Rate limit", "A cap on how many requests one user can send"]],
      matters: "Guidance from a public body often becomes what customers and auditors expect. API security vendors can map their product to the checklist.",
      risk: [],
      angles: [
        "The API checklist in 60 seconds: five points, one visual each.",
        "Before and after: an API with no limits, then the same API with the guide applied.",
        "How advice from a public body turns into what customers ask for."
      ] },
    { topic: "ai", type: "launch",
      what: "A security company announced software that uses AI to sort security alerts, so analysts see the serious ones first.",
      why: "Security teams receive more alerts than they can read. Sorting them is where time is lost.",
      terms: [["SOC", "Security operations centre: the team that watches for attacks"], ["False alarm", "An alert that turns out to be harmless"]],
      matters: "Buyers will compare this claim with other tools. Competitors and partners need a clear way to show what AI does and does not do in their own product.",
      risk: [
        { k: "unverified", line: "Performance claims come from the company only." },
        { k: "legal", line: "Write \"the company says\". Do not repeat the claim as fact." }
      ],
      angles: [
        "A day in a SOC: 1,000 alerts, and the ten that matter.",
        "What \"AI-assisted\" means in this tool, explained without the hype.",
        "Questions a buyer should ask before trusting an AI to sort alerts."
      ] }
  ],
  ph: [
    { risk: [{ k: "sensitive", line: "People in the affected area. Keep the tone careful." }] },
    { risk: [] }, { risk: [] }, { risk: [] }, { risk: [] },
    { risk: [{ k: "unverified", line: "Location and scale are unclear." }] },
    { risk: [] }, { risk: [] }, { risk: [] }, { risk: [] }
  ],

  risks: {
    unverified: "Unverified claim",
    sensitive: "Sensitive incident",
    legal: "Attribution or legal caution"
  },

  /* growth radar: niches that are gaining attention and could become content.
     Each one names the wider field it leads to. 14 days ending on the sample brief date. */
  attention: {
    days: ["3 Nov","4 Nov","5 Nov","6 Nov","7 Nov","8 Nov","9 Nov","10 Nov","11 Nov","12 Nov","13 Nov","14 Nov","15 Nov","16 Nov"],
    topics: [
      { k: "cam", name: "Advanced security cameras", short: "Smart cameras", ab: "CAM", color: "#3987e5", leads: "Cybersecurity",
        idea: "Who else can watch a connected camera? Show the path from lens to network.",
        hist: [22,24,27,29,33,36,41,45,50,56,61,66,72,78] },
      { k: "drn", name: "Drone detection systems", short: "Drone detection", ab: "DRN", color: "#d95926", leads: "Defense and critical infrastructure",
        idea: "How a site spots a drone before it arrives.",
        hist: [35,36,38,37,41,44,43,47,50,52,55,57,60,63] },
      { k: "rob", name: "Factory robots working beside people", short: "Factory cobots", ab: "ROB", color: "#199e70", leads: "Robotics and AI",
        idea: "What happens when a factory robot is given the wrong command.",
        hist: [40,41,40,43,44,46,45,48,49,51,50,53,55,56] },
      { k: "evc", name: "EV charging networks", short: "EV charging", ab: "EVC", color: "#c98500", leads: "Critical infrastructure",
        idea: "A charging station is a computer on the street.",
        hist: [18,19,18,21,22,24,23,26,27,29,30,33,35,38] },
      { k: "eid", name: "Digital ID and e-signature", short: "Digital ID", ab: "EID", color: "#d55181", leads: "Regulation and cybersecurity",
        idea: "One signature, many systems: what protects a digital ID.",
        hist: [48,47,49,48,50,49,51,50,52,51,50,52,51,53] }
    ]
  },

  /* city wellbeing: is the city alright? One overall percentage per important city, recorded weekly.
     Overall wellbeing, not only cybersecurity. Higher is better. */
  wellbeing: {
    weeks: ["28 Sep","5 Oct","12 Oct","19 Oct","26 Oct","2 Nov","9 Nov","16 Nov"],
    year: "2026",
    tk: [
      { city: "İstanbul", code: "IST", hist: [76,74,71,73,68,66,72,70] },
      { city: "Ankara", code: "ANK", hist: [62,60,58,55,57,52,48,50] },
      { city: "İzmir", code: "IZM", hist: [80,82,79,81,84,83,80,82] },
      { city: "Bursa", code: "BUR", hist: [70,68,71,66,64,67,65,64] },
      { city: "Antalya", code: "ANT", hist: [85,86,84,87,88,86,89,88] }
    ],
    ph: [
      { city: "Manila", code: "MNL", hist: [64,62,60,57,61,59,55,58] },
      { city: "Cebu City", code: "CEB", hist: [70,72,71,74,73,75,72,74] },
      { city: "Davao City", code: "DVO", hist: [78,80,79,81,82,80,83,81] },
      { city: "Baguio", code: "BAG", hist: [69,66,68,64,62,65,63,66] },
      { city: "Iloilo City", code: "ILO", hist: [74,75,77,76,78,77,79,77] }
    ]
  },

  intel: {
    text: "Sample card. In the live app this shows one Turkey cybersecurity fact for the day, for example a count from a public official list, with the source named under it.",
    source: "Sample source B"
  },

  briefing: "Good morning. Turkey is somewhat happening today: one serious incident story and two lighter ones. The Philippines is somewhat okay, with weather leading. Eight sources were read. Sample source A carried the top story. One Philippine location is unclear, so it is not pinned.",
  remarkable: ["Sample source A"],

  /* source profiles (sources.json in Part 2, so the wording can be edited) */
  sources: [
    { name: "Sample source A", mode: "tk", kind: "News outlet", official: false, country: "Türkiye", lang: "Turkish",
      covers: "Technology and cybersecurity news.", why: "Reports incidents in Turkey early.",
      read: "Reported news. Check whether the affected organisation has confirmed it." },
    { name: "Sample source B", mode: "tk", kind: "Official body", official: true, country: "Türkiye", lang: "Turkish",
      covers: "Public guidance and announcements.", why: "First-hand source for rules and advice.",
      read: "Official guidance. Reliable for what it says, and written formally." },
    { name: "Sample source C", mode: "tk", kind: "Company", official: false, country: "Türkiye", lang: "Turkish and English",
      covers: "Its own products and research.", why: "A company you follow.",
      read: "Company's own announcement, so promotional." },
    { name: "Sample source 1", mode: "ph", kind: "News outlet", official: false, country: "Philippines", lang: "English",
      covers: "National news and weather.", why: "General daily news for Philippines mode.", read: "Reported news." },
    { name: "Sample source 2", mode: "ph", kind: "News outlet", official: false, country: "Philippines", lang: "English",
      covers: "Business and energy.", why: "General daily news for Philippines mode.", read: "Reported news." },
    { name: "Sample source 3", mode: "ph", kind: "News outlet", official: false, country: "Philippines", lang: "English and Filipino",
      covers: "Transport and cities.", why: "General daily news for Philippines mode.", read: "Reported news." },
    { name: "Sample source 4", mode: "ph", kind: "News outlet", official: false, country: "Philippines", lang: "Filipino",
      covers: "Regions, farming and schools.", why: "General daily news for Philippines mode.", read: "Reported news. Filipino titles are translated." },
    { name: "Sample source 5", mode: "ph", kind: "Data provider", official: true, country: "Philippines", lang: "English",
      covers: "Economic figures and sport results.", why: "Numbers behind the news.", read: "Figures from the provider. Check the date of each number." }
  ],

  /* real sources named in the build spec. Not connected yet: live reading starts in Part 2.
     ok = the link was confirmed by a web search on 17 Nov 2026. Terms are not checked yet. */
  real: [
    { tier: "A · Official Turkey", name: "USOM", kind: "Official body", official: true, country: "Türkiye", lang: "Turkish",
      what: "Turkey's national centre for responding to cyber incidents. It works within BTK.",
      covers: "A public list of malicious links, plus security notices.", why: "First-hand official signal for Turkey. Feeds the map level.",
      read: "Official and technical. The list shows what was blocked, not who was attacked.", url: "https://www.usom.gov.tr", ok: false },
    { tier: "A · Official Turkey", name: "Siber Güvenlik Başkanlığı", kind: "Official body", official: true, country: "Türkiye", lang: "Turkish",
      what: "The Cybersecurity Presidency, set up by decree in January 2025 and attached to the Presidency. Based in Ankara.",
      covers: "National cybersecurity policy, strategy and announcements.", why: "Sets the direction that Turkish companies follow.",
      read: "Official statements. Formal wording, so read for what changes.", url: "https://siberguvenlik.gov.tr", ok: true },
    { tier: "A · Official Turkey", name: "BTK", kind: "Official body", official: true, country: "Türkiye", lang: "Turkish",
      what: "The Information and Communication Technologies Authority, Turkey's telecom regulator.",
      covers: "Rules, board decisions and announcements for telecoms and internet.", why: "Regulation that affects IT and telecom companies.",
      read: "Official decisions. Often long legal documents.", url: "https://www.btk.gov.tr", ok: true },
    { tier: "B · Data", name: "Cloudflare Radar", kind: "Data provider", official: false, country: "United States", lang: "English",
      what: "Cloudflare's public dashboard of internet traffic and attack trends, with pages for Turkey.",
      covers: "Application-layer and network-layer attack trends by country.", why: "A daily number for attack activity aimed at Turkey.",
      read: "Shows only what Cloudflare's own network sees, so it is a sample, not the whole internet.", url: "https://radar.cloudflare.com/security/application-layer/tr", ok: true },
    { tier: "B · Data", name: "CISA KEV", kind: "Official body and data provider", official: true, country: "United States", lang: "English",
      what: "The US cyber agency's catalog of vulnerabilities known to be exploited in real attacks.",
      covers: "One entry per exploited vulnerability, with dates. Also offered as data files.", why: "Shows which weaknesses attackers use right now.",
      read: "Authoritative but US-focused. An entry means exploited somewhere, not necessarily in Turkey.", url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog", ok: true },
    { tier: "B · Data", name: "abuse.ch", kind: "Data provider", official: false, country: "Switzerland", lang: "English",
      what: "An independent, community-driven project that shares threat intelligence on malware and botnets.",
      covers: "Public platforms such as MalwareBazaar, URLhaus and ThreatFox.", why: "Free malware signals to cross-check other sources.",
      read: "Technical indicators from volunteers. Good for counts and trends, not for stories.", url: "https://abuse.ch", ok: true },
    { tier: "C · News", name: "Daily Sabah", kind: "News outlet", official: false, country: "Türkiye", lang: "English",
      what: "An English-language Turkish daily newspaper.", covers: "Turkish news in English, including technology.", why: "Turkey stories already in English.",
      read: "Reported news. Check the original statement where one exists.", url: "https://www.dailysabah.com", ok: false },
    { tier: "C · News", name: "NTV", kind: "News outlet", official: false, country: "Türkiye", lang: "Turkish",
      what: "A Turkish news channel with a technology news section.", covers: "General news and technology.", why: "Fast Turkish coverage of incidents and announcements.",
      read: "Reported news. Titles are translated in the app.", url: "https://www.ntv.com.tr/haberleri/teknoloji", ok: true },
    { tier: "C · News", name: "TRT Haber", kind: "News outlet", official: false, country: "Türkiye", lang: "Turkish",
      what: "The news site of Turkey's public broadcaster, with a science and technology section.", covers: "General news, science and technology.", why: "Carries official announcements quickly.",
      read: "Public broadcaster. Reported news, close to official sources.", url: "https://www.trthaber.com/haber/bilim-teknoloji/", ok: true },
    { tier: "D · Companies you follow", name: "ApiFort AI & API Security", kind: "Company", official: false, country: "Türkiye", lang: "Turkish",
      what: "An API security product developed by Kafein Teknoloji.", covers: "Its own product news.", why: "A company you follow.",
      read: "Company's own announcement, so promotional.", url: "", ok: false },
    { tier: "D · Companies you follow", name: "Deepinfo", kind: "Company", official: false, country: "Türkiye", lang: "English",
      what: "A company that makes an attack surface management platform.", covers: "Its own product and research.", why: "A company you follow.",
      read: "Company's own announcement, so promotional.", url: "https://www.deepinfo.com", ok: true },
    { tier: "D · Companies you follow", name: "PortSwigger", kind: "Company", official: false, country: "United Kingdom", lang: "English",
      what: "A web security company, maker of Burp Suite.", covers: "Web security research and product news.", why: "A company you follow.",
      read: "Research is technical and well regarded. Product posts are promotional.", url: "https://portswigger.net", ok: false },
    { tier: "D · Companies you follow", name: "LetsDefend", kind: "Company", official: false, country: "", lang: "English",
      what: "A training platform for security operations analysts. Your spec notes it now publishes on the Hack The Box blog.", covers: "Training and blue-team articles.", why: "A company you follow.",
      read: "Educational content with product promotion.", url: "https://letsdefend.io", ok: false },
    { tier: "D · Companies you follow", name: "TBD Türkiye Bilişim Derneği", kind: "Association", official: false, country: "Türkiye", lang: "Turkish",
      what: "The Informatics Association of Turkey.", covers: "Sector events, statements and reports.", why: "A page you follow.",
      read: "An association's view of the sector.", url: "https://www.tbd.org.tr", ok: false },
    { tier: "D · Companies you follow", name: "SK shieldus", kind: "Company", official: false, country: "South Korea", lang: "Korean and English",
      what: "A South Korean security company.", covers: "Its own security reports and news.", why: "A company you follow.",
      read: "Company's own announcement, so promotional.", url: "https://www.skshieldus.com", ok: false },
    { tier: "PH · Philippine news", name: "GMA News Online · 24 Oras", kind: "News outlet", official: false, country: "Philippines", lang: "Filipino and English",
      what: "The news site of GMA Network. 24 Oras is the network's flagship national newscast.",
      covers: "National daily news, including 24 Oras news articles.", why: "Your chosen source for the 10 Philippine stories.",
      read: "Reported news. 24 Oras items are in Filipino, so the app translates them.", url: "https://www.gmanetwork.com", ok: true }
  ],
  /* followed companies whose profile and site are not confirmed yet */
  pending: ["PolariStar", "TRIAS Technology", "İstanbulut", "ECHO External Threat Protection", "NESA Havacılık ve Mühendislik", "Holoxone by Nativia Tech", "DORAES", "Eksa Elektronik Bilgi İşlem"]
};
