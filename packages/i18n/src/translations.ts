export type Language = "en" | "hi" | "hinglish";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    app_title: "Bharat Social Insights",
    sub_title: "AI Social Media Analytics Platform",
    nav_dashboard: "Dashboard",
    nav_sentiment: "Sentiment",
    nav_trends: "Trends",
    nav_demographics: "Demographics",
    nav_network: "Network",
    nav_alerts: "Alerts",
    nav_settings: "Settings",

    // KPI Cards
    kpi_active_topics: "Active Topics",
    kpi_rumors: "High-Risk Rumors",
    kpi_anxiety_spike: "Anxiety Spike Flag",
    kpi_top_platform: "Top Platform Volume",

    // Dashboard sections
    rumor_radar_title: "Rumor Radar & Threat Scoring",
    rumor_radar_desc: "Multi-factor AI threat evaluation combining anxiety spikes, velocity, and cross-platform spread.",
    view_risk_analysis: "View Risk Analysis & Action Cards",
    trending_now: "Trending Topics",
    sentiment_timeline_title: "24h Multi-Line Sentiment & Emotion Timeline",
    language_breakdown: "Language Distribution",
    network_preview: "Network Cascade Preview",
    view_full_network: "Explore Full Network Graph →",

    // Sentiment Page
    sentiment_page_title: "Sentiment & Multi-Label Emotion Analytics",
    filter_topic: "Filter by Topic",
    filter_platform: "Filter by Platform",
    date_range: "Date Range",
    emotion_anxiety: "Anxiety",
    emotion_anger: "Anger",
    emotion_sarcasm: "Sarcasm",
    emotion_support: "Support",
    emotion_excitement: "Excitement",
    emotion_fear: "Fear",

    // Trends Page
    trends_page_title: "Topic Velocity & Volume Forecast",
    col_topic: "Topic Name",
    col_posts: "Post Count",
    col_velocity: "Hourly Velocity",
    col_forecast: "Next-Hour Forecast",
    col_sentiment: "Dominant Sentiment",
    col_badge: "Activity Level",

    // Demographics Page
    demographics_page_title: "Regional & Demographic Intelligence",
    map_title: "India Regional Density (SVG Choropleth)",
    profession_title: "Profession Breakdown",
    interest_title: "Interest Category Breakdown",
    k_anonymity_note: "Privacy Enforced: Any bucket with fewer than 5 users is suppressed under k-anonymity (n≥5).",
    suppressed_label: "Not enough data (k<5 suppressed)",

    // Network Page
    network_page_title: "Graph Influence & Cascade Path Tracing",
    story_of_spread: "Story of Spread (Cascade Scrubber)",
    pagerank_note: "Node size represents PageRank score. Node color represents Louvain community cluster.",
    play_cascade: "Scrub Cascade Timeline",

    // Alerts Page
    alerts_page_title: "Automated Incident Alerts & Action Cards",

    // Settings Page
    settings_page_title: "System Configuration & Connector Status",
    ui_mode: "UI Render Mode",
    normal_mode: "Normal Mode (Full Charts)",
    lite_mode: "Lite Mode (Fast Plain Tables)",
    connector_status_title: "Platform Connector Health Matrix"
  },
  hi: {
    app_title: "भारत सोशल इनसाइट्स",
    sub_title: "एआई सोशल मीडिया विश्लेषक प्लेटफॉर्म",
    nav_dashboard: "डैशबोर्ड",
    nav_sentiment: "भावना विश्लेषण",
    nav_trends: "ट्रेंड्स",
    nav_demographics: "जनसांख्यिकी",
    nav_network: "नेटवर्क ग्राफ",
    nav_alerts: "अलर्ट",
    nav_settings: "सेटिंग्स",

    kpi_active_topics: "सक्रिय विषय",
    kpi_rumors: "उच्च जोखिम अफवाहें",
    kpi_anxiety_spike: "चिंता वृद्धि फ्लैग",
    kpi_top_platform: "शीर्ष प्लेटफॉर्म वॉल्यूम",

    rumor_radar_title: "अफवाह रडार और खतरा स्कोरिंग",
    rumor_radar_desc: "चिंता स्पाइक्स, वेग और क्रॉस-प्लेटफॉर्म प्रसार का बहु-कारक एआई मूल्यांकन।",
    view_risk_analysis: "जोखिम विश्लेषण और कार्रवाई कार्ड देखें",
    trending_now: "ट्रेंडिंग विषय",
    sentiment_timeline_title: "24-घंटे भावना एवं संवेग समयरेखा",
    language_breakdown: "भाषा वितरण",
    network_preview: "नेटवर्क कैस्केड पूर्वावलोकन",
    view_full_network: "पूर्ण नेटवर्क ग्राफ देखें →",

    sentiment_page_title: "भावना एवं बहु-लेबल संवेग विश्लेषण",
    filter_topic: "विषय के अनुसार फ़िल्टर करें",
    filter_platform: "प्लेटफॉर्म के अनुसार फ़िल्टर करें",
    date_range: "तिथि सीमा",
    emotion_anxiety: "चिंता",
    emotion_anger: "क्रोध",
    emotion_sarcasm: "कटाक्ष",
    emotion_support: "समर्थन",
    emotion_excitement: "उत्साह",
    emotion_fear: "भय",

    trends_page_title: "विषय वेग एवं आयतन पूर्वानुमान",
    col_topic: "विषय का नाम",
    col_posts: "पोस्ट संख्या",
    col_velocity: "प्रति घंटा वेग",
    col_forecast: "अगले घंटे का अनुमान",
    col_sentiment: "प्रमुख भावना",
    col_badge: "गतिविधि स्तर",

    demographics_page_title: "क्षेत्रीय एवं जनसांख्यिकीय विश्लेषण",
    map_title: "भारत क्षेत्रीय घनत्व (एसवीजी मानचित्र)",
    profession_title: "व्यवसाय वितरण",
    interest_title: "रुचि श्रेणी वितरण",
    k_anonymity_note: "गोपनीयता नियम लागू: 5 से कम उपयोगकर्ताओं वाले समूह k-anonymity (n≥5) के तहत छिपाए गए हैं।",
    suppressed_label: "पर्याप्त डेटा नहीं (k<5 गुप्त)",

    network_page_title: "ग्राफ प्रभाव एवं प्रसार समयरेखा",
    story_of_spread: "प्रसार की कहानी (कैस्केड टाइमलाइन)",
    pagerank_note: "नोड का आकार PageRank स्कोर दिखाता है। नोड का रंग Louvain समुदाय को दर्शाता है।",
    play_cascade: "प्रसार समयरेखा चलाएं",

    alerts_page_title: "स्वचालित चेतावनी और कार्रवाई कार्ड",

    settings_page_title: "सिस्टम कॉन्फ़िगरेशन और कनेक्टर स्थिति",
    ui_mode: "यूआई मोड",
    normal_mode: "सामान्य मोड (पूर्ण चार्ट)",
    lite_mode: "लाइट मोड (केवल तालिकाएं)",
    connector_status_title: "प्लेटफॉर्म कनेक्टर स्थिति"
  },
  hinglish: {
    app_title: "Bharat Social Insights",
    sub_title: "AI Social Media Analytics System",
    nav_dashboard: "Dashboard",
    nav_sentiment: "Sentiment & Emotions",
    nav_trends: "Top Trends",
    nav_demographics: "Demographics & Region",
    nav_network: "Network Graph",
    nav_alerts: "Active Alerts",
    nav_settings: "Settings & Keys",

    kpi_active_topics: "Active Topics",
    kpi_rumors: "High-Risk Rumors",
    kpi_anxiety_spike: "Anxiety Spike Flag",
    kpi_top_platform: "Top Volume Platform",

    rumor_radar_title: "Rumor Radar & Risk Score",
    rumor_radar_desc: "Anxiety spikes, speed, aur multi-platform spread ka real AI scoring.",
    view_risk_analysis: "Risk Analysis & Action Cards Dekhein",
    trending_now: "Trending Topics",
    sentiment_timeline_title: "24h Sentiment & Emotion Timeline",
    language_breakdown: "Language Split",
    network_preview: "Network Preview",
    view_full_network: "Full Network Graph Kholein →",

    sentiment_page_title: "Sentiment & Emotion Breakdown",
    filter_topic: "Filter by Topic",
    filter_platform: "Filter by Platform",
    date_range: "Date Range",
    emotion_anxiety: "Anxiety",
    emotion_anger: "Anger",
    emotion_sarcasm: "Sarcasm",
    emotion_support: "Support",
    emotion_excitement: "Excitement",
    emotion_fear: "Fear",

    trends_page_title: "Topic Velocity & Forecast",
    col_topic: "Topic Name",
    col_posts: "Post Count",
    col_velocity: "Hourly Velocity",
    col_forecast: "Next-Hour Forecast",
    col_sentiment: "Dominant Sentiment",
    col_badge: "Badge",

    demographics_page_title: "Region & Demographics",
    map_title: "India Region Map (SVG)",
    profession_title: "Profession Breakdown",
    interest_title: "Interest Categories",
    k_anonymity_note: "Privacy Protection: 5 se kam users wale buckets hide kiye gaye hain (k≥5).",
    suppressed_label: "Not enough data (k<5 hidden)",

    network_page_title: "Graph & Story of Spread",
    story_of_spread: "Story of Spread (Cascade Timeline)",
    pagerank_note: "Node size = PageRank. Node color = Louvain Community.",
    play_cascade: "Play Spread Timeline",

    alerts_page_title: "System Alerts & Action Cards",

    settings_page_title: "Settings & Connector Status",
    ui_mode: "UI Mode Select",
    normal_mode: "Normal Mode (Full Charts)",
    lite_mode: "Lite Mode (Tables Only)",
    connector_status_title: "Connector Status Panel"
  }
};
