import {
  TopicData,
  SentimentTimelinePoint,
  EmotionMetric,
  AlertItem,
  NetworkNode,
  NetworkEdge,
  KeyInfluencer,
  SpreadStep,
  Platform,
  SocialComment,
  TelegramLiveMessage,
  DemoXTweet,
  ActionCardItem,
  ArchitectureLayer,
  AlgorithmExplainer,
  TopicForensicSpread,
} from '../types';

export const mockTopics: TopicData[] = [
  {
    id: 'neet-exam-2026',
    name: 'NEET exam date change',
    nameHi: 'नीट परीक्षा तिथि बदलाव का दावा',
    posts: 12450,
    growth: '+142%',
    growthValue: 142,
    velocity: 'High',
    dominantSentiment: 'negative',
    sentimentBreakdown: {
      positive: 14,
      neutral: 28,
      negative: 58,
    },
    dominantEmotion: 'Anxiety (38%)',
    platforms: ['telegram', 'youtube', 'reddit', 'x'],
    status: 'Rising',
    riskLevel: 'High',
    confidence: 87,
    summaryEn: 'Circulating fake circular claiming the examination is postponed by 3 weeks. Rapid cross-platform replication from private Telegram channels into YouTube explainers.',
    summaryHi: 'सोशल मीडिया पर एक फर्जी नोटिस प्रसारित हो रहा है जिसमें परीक्षा 3 हफ्ते आगे बढ़ने का दावा है। टेलीग्राम से यूट्यूब पर तेजी से फैलाव।',
    narrativeClaim: 'Claim: NTA has published an unreleased circular rescheduling the examination to next month.',
    officialFactCheckUrl: 'https://nta.ac.in',
  },
  {
    id: 'rajasthan-power-outage',
    name: 'Rajasthan power outage',
    nameHi: 'राजस्थान बिजली कटौती चर्चा',
    posts: 8320,
    growth: '+87%',
    growthValue: 87,
    velocity: 'Medium',
    dominantSentiment: 'negative',
    sentimentBreakdown: {
      positive: 9,
      neutral: 31,
      negative: 60,
    },
    dominantEmotion: 'Anger (44%)',
    platforms: ['reddit', 'facebook'],
    status: 'Rising',
    riskLevel: 'Medium',
    confidence: 78,
    summaryEn: 'Discussions around unscheduled grid cuts in suburban districts. Heavy frustration over heatwave impact and agricultural pump interruptions.',
    summaryHi: 'ग्रामीण व उपनगरीय इलाकों में अघोषित बिजली कटौती पर नाराजगी। सिंचाई और भीषण गर्मी को लेकर शिकायतें।',
    narrativeClaim: 'Claim: State power distribution company has enforced silent 6-hour daily rationing.',
  },
  {
    id: 'education-policy-2026',
    name: 'New education policy update',
    nameHi: 'नई शिक्षा नीति दिशानिर्देश',
    posts: 6210,
    growth: '+41%',
    growthValue: 41,
    velocity: 'Medium',
    dominantSentiment: 'mixed',
    sentimentBreakdown: {
      positive: 38,
      neutral: 35,
      negative: 27,
    },
    dominantEmotion: 'Support & Sarcasm',
    platforms: ['youtube', 'x'],
    status: 'Monitoring',
    riskLevel: 'Low',
    confidence: 91,
    summaryEn: 'Analysis of recent state curriculum harmonization committee recommendations. Positive reception for vocational modules, mixed on board exam format.',
    summaryHi: 'पाठ्यक्रम समन्वय समिति की सिफारिशों पर समीक्षा। वोकेशनल ट्रेनिंग की तारीफ, बोर्ड प्रारूप पर बहस।',
    narrativeClaim: 'Claim: Complete elimination of 10th standard board examinations from next session.',
  },
  {
    id: 'subsidy-update',
    name: 'Government subsidy update',
    nameHi: 'सरकारी डीबीटी सब्सिडी अपडेट',
    posts: 4890,
    growth: '+18%',
    growthValue: 18,
    velocity: 'Low',
    dominantSentiment: 'positive',
    sentimentBreakdown: {
      positive: 56,
      neutral: 32,
      negative: 12,
    },
    dominantEmotion: 'Support (52%)',
    platforms: ['facebook', 'youtube', 'telegram'],
    status: 'Stabilizing',
    riskLevel: 'Low',
    confidence: 94,
    summaryEn: 'Clarification videos on direct benefit transfer credit cycles for farmers and solar rooftop incentives.',
    summaryHi: 'किसानों के खाते में प्रत्यक्ष लाभ अंतरण एवं सोलर रूफटॉप सब्सिडी से जुड़े सूचनात्मक वीडियो और सकारात्मक प्रतिक्रिया।',
    narrativeClaim: 'Informative queries on registration portal verification guidelines.',
  },
  {
    id: 'exam-result-discussion',
    name: 'Exam result discussion',
    nameHi: 'प्रतियोगी परीक्षा परिणाम चर्चा',
    posts: 9150,
    growth: '+63%',
    growthValue: 63,
    velocity: 'High',
    dominantSentiment: 'mixed',
    sentimentBreakdown: {
      positive: 24,
      neutral: 36,
      negative: 40,
    },
    dominantEmotion: 'Anxiety (34%)',
    platforms: ['x', 'telegram', 'youtube'],
    status: 'Monitoring',
    riskLevel: 'Medium',
    confidence: 82,
    summaryEn: 'Anticipation and server timeout memes regarding regional recruitment and state commission tier-1 scorecards.',
    summaryHi: 'राज्य सेवा आयोग के परिणाम जारी होने की प्रतीक्षा, वेबसाइट सर्वर धीमी होने पर मीम्स और चर्चा।',
    narrativeClaim: 'Claim: Cut-off scores have doubled compared to prior years due to normalization formula.',
  },
];

export const sentimentTimeline24h: SentimentTimelinePoint[] = [
  { time: '00:00', positive: 28, neutral: 42, negative: 30, dominantEmotion: 'Neutral' },
  { time: '02:00', positive: 25, neutral: 45, negative: 30, dominantEmotion: 'Neutral' },
  { time: '04:00', positive: 26, neutral: 46, negative: 28, dominantEmotion: 'Calm' },
  { time: '06:00', positive: 31, neutral: 41, negative: 28, dominantEmotion: 'Curiosity' },
  { time: '08:00', positive: 29, neutral: 39, negative: 32, dominantEmotion: 'Curiosity' },
  { time: '10:00', positive: 27, neutral: 36, negative: 37, dominantEmotion: 'Anxiety' },
  { time: '12:00', positive: 24, neutral: 34, negative: 42, dominantEmotion: 'Anxiety' },
  { time: '14:00', positive: 23, neutral: 33, negative: 44, dominantEmotion: 'Anger' },
  { time: '16:00', positive: 21, neutral: 32, negative: 47, dominantEmotion: 'Anxiety' },
  { time: '18:00', positive: 19, neutral: 30, negative: 51, dominantEmotion: 'Anxiety' },
  { time: '20:00', positive: 18, neutral: 29, negative: 53, dominantEmotion: 'Anxiety' },
  { time: '22:00', positive: 22, neutral: 31, negative: 47, dominantEmotion: 'Anxiety' },
];

export const emotionMetrics: EmotionMetric[] = [
  { name: 'Anxiety', nameHi: 'चिंता (Anxiety)', percentage: 38, color: '#ef4444', multiplierText: '↑ 2.1× in last 3h', multiplierTextHi: '↑ 3 घंटे में 2.1 गुना' },
  { name: 'Anger', nameHi: 'क्रोध (Anger)', percentage: 27, color: '#f97316' },
  { name: 'Sarcasm', nameHi: 'व्यंग्य (Sarcasm)', percentage: 18, color: '#eab308' },
  { name: 'Support', nameHi: 'समर्थन (Support)', percentage: 12, color: '#22c55e' },
  { name: 'Excitement', nameHi: 'उत्साह (Excitement)', percentage: 5, color: '#0ea5e9' },
  { name: 'Fear', nameHi: 'भय (Fear)', percentage: 8, color: '#a855f7' },
];

export const platformDataSources = [
  {
    id: 'telegram' as Platform,
    name: 'Telegram',
    badge: 'Live / Near-live demo',
    badgeType: 'live',
    description: 'Monitors public channels, educational groups, and forward chains.',
    activeStreams: '1,420 channels',
    latency: '< 45s',
  },
  {
    id: 'youtube' as Platform,
    name: 'YouTube',
    badge: 'API-based comments',
    badgeType: 'api',
    description: 'Ingests public video transcripts, top comments, and view spikes.',
    activeStreams: '680 creators',
    latency: '3-5 min',
  },
  {
    id: 'reddit' as Platform,
    name: 'Reddit',
    badge: 'API-based posts/comments',
    badgeType: 'api',
    description: 'Tracks subreddits such as r/india, r/IndianStudents, r/JEENEETards.',
    activeStreams: '45 communities',
    latency: '2 min',
  },
  {
    id: 'facebook' as Platform,
    name: 'Facebook',
    badge: 'Limited public/page data',
    badgeType: 'limited',
    description: 'Aggregates verified public pages, regional civic groups, and news portals.',
    activeStreams: '320 pages',
    latency: '10 min',
  },
  {
    id: 'instagram' as Platform,
    name: 'Instagram',
    badge: 'Limited authorized account data',
    badgeType: 'limited',
    description: 'Samples public student reels, carousel infographics, and viral audio.',
    activeStreams: '190 accounts',
    latency: '15 min',
  },
  {
    id: 'x' as Platform,
    name: 'X (Twitter)',
    badge: 'Demo sample / static data',
    badgeType: 'static',
    description: 'Static demo sample for prototype benchmarking. Not connected to live enterprise streaming.',
    activeStreams: 'Demo archive',
    latency: 'Static',
    isStaticDisclaimer: true,
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: 'alt-01',
    type: 'rumor_risk',
    typeLabelEn: 'High Rumor Risk',
    typeLabelHi: 'उच्च अफ़वाह जोखिम',
    severity: 'high',
    topic: 'NEET exam date change narrative',
    topicHi: 'नीट परीक्षा तिथि बदलाव का दावा',
    timeAgo: '12 min ago',
    timeAgoHi: '12 मिनट पहले',
    platforms: ['telegram', 'youtube', 'reddit', 'x'],
    reasonEn: 'High anxiety + rapid growth + cross-platform presence. Forwards in student channels escalated 3.4x.',
    reasonHi: 'अत्यधिक चिंता + तीव्र प्रसार + मल्टी-प्लेटफ़ॉर्म उपस्थिति। छात्र समूहों में फॉरवर्डिंग 3.4 गुना बढ़ी।',
    reviewed: false,
    monitored: true,
  },
  {
    id: 'alt-02',
    type: 'trend_growth',
    typeLabelEn: 'Rapid Trend Growth',
    typeLabelHi: 'तीव्र ट्रेंड वृद्धि',
    severity: 'medium',
    topic: 'Rajasthan power outage discussions',
    topicHi: 'राजस्थान बिजली कटौती चर्चा',
    timeAgo: '35 min ago',
    timeAgoHi: '35 मिनट पहले',
    platforms: ['reddit', 'facebook'],
    reasonEn: 'Post volume increased by +87% in 1 hour across Jaipur and Jodhpur community boards.',
    reasonHi: 'जयपुर और जोधपुर के सामुदायिक ग्रुप्स में 1 घंटे के भीतर पोस्ट संख्या 87% बढ़ी।',
    reviewed: false,
    monitored: false,
  },
  {
    id: 'alt-03',
    type: 'sentiment_spike',
    typeLabelEn: 'Negative Sentiment Spike',
    typeLabelHi: 'नकारात्मक भावना स्पाइक',
    severity: 'high',
    topic: 'Exam result discussion timeout',
    topicHi: 'परीक्षा परिणाम सर्वर समस्या',
    timeAgo: '1 hour ago',
    timeAgoHi: '1 घंटा पहले',
    platforms: ['x', 'telegram'],
    reasonEn: 'Frustration sentiment spiked from 14% to 58% after portal gateway errors.',
    reasonHi: 'पोर्टल गेटवे एरर के बाद हताशा एवं असंतोष का स्तर 14% से उछलकर 58% तक पहुँचा।',
    reviewed: true,
    monitored: false,
  },
  {
    id: 'alt-04',
    type: 'cross_platform',
    typeLabelEn: 'Cross-platform Spread',
    typeLabelHi: 'क्रॉस-प्लेटफ़ॉर्म फैलाव',
    severity: 'medium',
    topic: 'New education policy rumors',
    topicHi: 'नई शिक्षा नीति संबंधी भ्रामक बातें',
    timeAgo: '2 hours ago',
    timeAgoHi: '2 घंटे पहले',
    platforms: ['youtube', 'x', 'facebook'],
    reasonEn: 'Identical misleading thumbnail circulating across 14 YouTube channels and copied to Facebook groups.',
    reasonHi: 'एक समान भ्रामक थंबनेल 14 यूट्यूब चैनलों पर दिखाई दिया और फेसबुक ग्रुप्स में साझा किया गया।',
    reviewed: true,
    monitored: true,
  },
];

export const networkGraphData: { nodes: NetworkNode[]; edges: NetworkEdge[] } = {
  nodes: [
    { id: 'n1', label: 'YouTube Unverified Video #841', category: 'origin', platform: 'youtube', reach: '180K views', connections: 24, x: 180, y: 220, size: 28 },
    { id: 'n2', label: 'Telegram Hub: All-India Pre-Med', category: 'amplifier', platform: 'telegram', reach: '95K members', connections: 42, x: 340, y: 150, size: 36 },
    { id: 'n3', label: 'Coaching Channel A (Faculty)', category: 'influencer', platform: 'youtube', reach: '1.8M subs', connections: 58, x: 520, y: 140, size: 44 },
    { id: 'n4', label: 'Reddit r/JEENEETards Megathread', category: 'community', platform: 'reddit', reach: '42K daily', connections: 31, x: 380, y: 290, size: 32 },
    { id: 'n5', label: 'Student Community D Discussion', category: 'community', platform: 'telegram', reach: '62K members', connections: 28, x: 260, y: 350, size: 30 },
    { id: 'n6', label: 'Education Creator B Tweet', category: 'influencer', platform: 'x', reach: '950K followers', connections: 49, x: 670, y: 210, size: 40 },
    { id: 'n7', label: 'Regional Channel E News Desk', category: 'influencer', platform: 'youtube', reach: '410K subs', connections: 22, x: 510, y: 340, size: 28 },
    { id: 'n8', label: 'Viral Reel / Short #442', category: 'amplifier', platform: 'instagram', reach: '520K views', connections: 19, x: 620, y: 360, size: 26 },
  ],
  edges: [
    { source: 'n1', target: 'n2', type: 'forwards', weight: 4 },
    { source: 'n2', target: 'n4', type: 'references', weight: 3 },
    { source: 'n2', target: 'n3', type: 'mentions', weight: 5 },
    { source: 'n4', target: 'n5', type: 'replies', weight: 3 },
    { source: 'n3', target: 'n6', type: 'references', weight: 4 },
    { source: 'n6', target: 'n7', type: 'comments', weight: 2 },
    { source: 'n5', target: 'n8', type: 'forwards', weight: 3 },
    { source: 'n3', target: 'n8', type: 'forwards', weight: 2 },
    { source: 'n6', target: 'n4', type: 'mentions', weight: 3 },
  ],
};

export const keyInfluencers: KeyInfluencer[] = [
  { id: 'inf-1', name: 'Coaching Channel A', category: 'EdTech Educator', connections: 340, reach: '1.8M', influenceScore: 94, engagement: '8.4%', platform: 'youtube' },
  { id: 'inf-2', name: 'Education Creator B', category: 'Independent Analyst', connections: 280, reach: '950K', influenceScore: 89, engagement: '7.1%', platform: 'x' },
  { id: 'inf-3', name: 'News Page C', category: 'Digital Regional Desk', connections: 520, reach: '2.4M', influenceScore: 88, engagement: '4.8%', platform: 'facebook' },
  { id: 'inf-4', name: 'Student Community D', category: 'Aspirants Coalition', connections: 190, reach: '620K', influenceScore: 81, engagement: '11.2%', platform: 'telegram' },
  { id: 'inf-5', name: 'Regional Channel E', category: 'State News Feed', connections: 145, reach: '410K', influenceScore: 76, engagement: '6.5%', platform: 'youtube' },
];

export const storyOfSpreadSteps: SpreadStep[] = [
  {
    time: '7:30 PM',
    platform: 'youtube',
    titleEn: 'Topic first appears on YouTube',
    titleHi: 'विषय पहली बार यूट्यूब पर सामने आया',
    descriptionEn: 'A 4-minute speculative video claimed an internal circular from the testing authority was leaked with a new exam date.',
    descriptionHi: 'एक 4 मिनट के वीडियो में दावा किया गया कि परीक्षा प्राधिकरण का आंतरिक नोटिस लीक हो गया है।',
    activeNodeIds: ['n1'],
    activeEdgeIndices: [],
  },
  {
    time: '8:15 PM',
    platform: 'telegram',
    titleEn: 'Telegram channels forward it',
    titleHi: 'टेलीग्राम चैनलों द्वारा तेजी से फॉरवर्ड',
    descriptionEn: 'Within 45 minutes, screenshots were forwarded across 18 public groups reaching over 95,000 aspirant students.',
    descriptionHi: '45 मिनट के भीतर 18 बड़े टेलीग्राम समूहों में स्क्रीनशॉट पहुंचाए गए जिससे 95 हजार छात्रों तक बात पहुंची।',
    activeNodeIds: ['n1', 'n2'],
    activeEdgeIndices: [0],
  },
  {
    time: '9:00 PM',
    platform: 'reddit',
    titleEn: 'Reddit discussions begin',
    titleHi: 'रेडिट पर बहस व चर्चा शुरू',
    descriptionEn: 'Students created verification megathreads questioning watermark authenticity and examining circular font mismatches.',
    descriptionHi: 'छात्रों ने नोटिस के फॉन्ट और वॉटरमार्क की सत्यता पर सवाल उठाते हुए थ्रेड शुरू किए।',
    activeNodeIds: ['n1', 'n2', 'n4', 'n5'],
    activeEdgeIndices: [0, 1, 3],
  },
  {
    time: '10:00 PM',
    platform: 'instagram',
    titleEn: 'Instagram/Facebook posts appear',
    titleHi: 'इंस्टाग्राम और फेसबुक पर रील्स व पोस्ट्स',
    descriptionEn: 'Study meme pages created emotional reels regarding postponement fear, multiplying emotional anxiety by 1.8x.',
    descriptionHi: 'मीम पेजों और परीक्षा तैयारी पेजों ने रील्स और ग्राफिक बनाकर शेयर करना शुरू किया।',
    activeNodeIds: ['n1', 'n2', 'n4', 'n5', 'n8'],
    activeEdgeIndices: [0, 1, 3, 6],
  },
  {
    time: '8:00 AM',
    platform: 'x',
    titleEn: 'X hashtag begins trending',
    titleHi: 'एक्स (ट्विटर) पर हैशटैग ट्रेंडिंग शुरू',
    descriptionEn: 'Early morning momentum pushed hashtag #NEETPostponed into top 5 national trends with over 4,200 mentions per hour.',
    descriptionHi: 'सुबह 8 बजे हैशटैग राष्ट्रीय ट्रेंड में आ गया और प्रति घंटे 4,200 से अधिक ट्वीट्स होने लगे।',
    activeNodeIds: ['n2', 'n3', 'n4', 'n6', 'n8'],
    activeEdgeIndices: [0, 1, 2, 4, 8],
  },
  {
    time: '12:00 PM',
    platform: 'youtube',
    titleEn: 'Influencers amplify the narrative',
    titleHi: 'प्रमुख इन्फ्लुएंसर्स और कोचिंग चैनलों ने बात उठाई',
    descriptionEn: 'Prominent educators and regional digital desks held live sessions demanding official Ministry clarification.',
    descriptionHi: 'प्रसिद्ध शिक्षकों और क्षेत्रीय चैनलों ने लाइव सेशन करके आधिकारिक स्पष्टीकरण की मांग की।',
    activeNodeIds: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'],
    activeEdgeIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  },
];

export const demographicsData = {
  languages: [
    { name: 'Hindi', nameHi: 'हिन्दी', percentage: 45, color: '#f97316' },
    { name: 'English', nameHi: 'अंग्रेजी', percentage: 35, color: '#3b82f6' },
    { name: 'Hinglish (Colloquial)', nameHi: 'हिंग्लिश (मिश्रित)', percentage: 20, color: '#10b981' },
  ],
  regions: [
    { name: 'Delhi / NCR', nameHi: 'दिल्ली / एनसीआर', percentage: 25, posts: '3,110 posts' },
    { name: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश', percentage: 20, posts: '2,490 posts' },
    { name: 'Rajasthan', nameHi: 'राजस्थान', percentage: 15, posts: '1,860 posts' },
    { name: 'Maharashtra', nameHi: 'महाराष्ट्र', percentage: 12, posts: '1,490 posts' },
    { name: 'Others (MP, Bihar, Karnataka, etc.)', nameHi: 'अन्य राज्य व यूटी', percentage: 28, posts: '3,480 posts' },
  ],
  interests: [
    { name: 'Education & Exams', nameHi: 'शिक्षा एवं प्रतियोगी परीक्षाएं', percentage: 40, color: '#2563eb' },
    { name: 'Politics & Civic Affairs', nameHi: 'नागरिक मुद्दे एवं नीति', percentage: 30, color: '#ea580c' },
    { name: 'Agriculture & Rural', nameHi: 'कृषि एवं ग्रामीण विकास', percentage: 15, color: '#16a34a' },
    { name: 'Technology & Startups', nameHi: 'प्रौद्योगिकी एवं डिजिटल भारत', percentage: 15, color: '#7c3aed' },
  ],
  audienceCategories: [
    {
      category: 'Student-like',
      categoryHi: 'छात्र / परीक्षार्थी वर्ग',
      share: '52%',
      description: 'High activity 9 PM - 1 AM, high mobile usage, Telegram/YouTube preference, anxiety markers high.',
      descriptionHi: 'रात 9 से 1 बजे सर्वाधिक सक्रिय, मोबाइल यूजर, टेलीग्राम/यूट्यूब पर अधिक निर्भर।',
    },
    {
      category: 'Young professional-like',
      categoryHi: 'युवा कामकाजी वर्ग',
      share: '24%',
      description: 'LinkedIn & Reddit discussions, policy implications, urban mobility focus.',
      descriptionHi: 'नीति और करियर प्रभाव पर केंद्रित, रेडिट व लिंक्डइन पर विचार विमर्श।',
    },
    {
      category: 'Teacher-related',
      categoryHi: 'शिक्षक एवं कोचिंग संकाय',
      share: '12%',
      description: 'Long-form commentary, circular verification efforts, student guidance advisories.',
      descriptionHi: 'विस्तृत वीडियो समीक्षा, नोटिस सत्यापन का प्रयास, छात्रों को सलाह।',
    },
    {
      category: 'Farmer-related',
      categoryHi: 'कृषक एवं ग्रामीण प्रतिनिधि',
      share: '7%',
      description: 'Regional language queries regarding fertilizer subsidy, power supply, mandi rates.',
      descriptionHi: 'स्थानीय भाषाओं में बिजली व सब्सिडी सम्बन्धी सवाल।',
    },
    {
      category: 'General public',
      categoryHi: 'आम नागरिक',
      share: '5%',
      description: 'Informal WhatsApp/FB sharing, general interest in public services and public holidays.',
      descriptionHi: 'सामान्य जिज्ञासा और सार्वजनिक घोषणाओं पर चर्चा।',
    },
  ],
};

/* ==========================================================================
   3. PLATFORMS & CONNECTORS: FREE & LOW-COST LIVE DATA SOURCES
   ========================================================================== */

export const telegramLiveFeed: TelegramLiveMessage[] = [
  {
    id: 'tg-msg-1',
    channel: 'All India Pre-Med Aspirants (Official Discussion)',
    subscribers: '142K',
    text: '🚨 BREAKING: Guys check this circular circulating! Says exam shifted from May to June. Is this real or edit?? @everyone confirm fast please!',
    textHi: '🚨 ध्यान दें: साथियों यह नोटिस वायरल हो रहा है जिसमें परीक्षा मई से जून होने की बात है। क्या यह असली है या एडिट किया हुआ?? जल्दी बताएं!',
    forwards: 3840,
    views: '54.2K',
    time: '3 mins ago',
    sentiment: 'negative',
    isAnomaly: true,
  },
  {
    id: 'tg-msg-2',
    channel: 'Kota Faculty Physics Updates',
    subscribers: '89K',
    text: 'Do not panic students. Many forwards are fabricated. Focus on revision mocks. Official website nta.ac.in does not show any notice yet.',
    textHi: 'छात्र कृपया घबराएं नहीं। कई मैसेज फर्जी हैं। अपने रिवीजन मॉक टेस्ट पर ध्यान दें। एनटीए की वेबसाइट पर अभी कोई नोटिस नहीं है।',
    forwards: 920,
    views: '28.1K',
    time: '8 mins ago',
    sentiment: 'neutral',
    isAnomaly: false,
  },
  {
    id: 'tg-msg-3',
    channel: 'Jaipur & Alwar Vidyut Alert',
    subscribers: '34K',
    text: 'Unscheduled load shedding in Sector 4 & 5 again today. Third consecutive day without prior SMS warning. Pumps not running.',
    textHi: 'सेक्टर 4 और 5 में आज फिर बिना सूचना बिजली कटौती। लगातार तीसरे दिन बिना एसएमएस अलर्ट के बिजली बंद। ट्यूबवेल बंद हैं।',
    forwards: 650,
    views: '12.4K',
    time: '14 mins ago',
    sentiment: 'negative',
    isAnomaly: false,
  },
  {
    id: 'tg-msg-4',
    channel: 'Target NEET 2026 Batch Discussions',
    subscribers: '67K',
    text: 'My coaching center teacher in Patna says postponement notification might come in evening press conference. Can someone verify??',
    textHi: 'पटना में हमारे कोचिंग टीचर का कहना है कि शाम की प्रेस कॉन्फ्रेंस में नोटिस आ सकता है। क्या कोई पुष्टि कर सकता है??',
    forwards: 2150,
    views: '36.8K',
    time: '19 mins ago',
    sentiment: 'negative',
    isAnomaly: true,
  },
  {
    id: 'tg-msg-5',
    channel: 'Govt Job & Exam Circular Tracker',
    subscribers: '210K',
    text: 'Notice format analysis: Font discrepancy found on line 4 of the viral memo. No official file reference number matching 2026 series.',
    textHi: 'नोटिस विश्लेषण: वायरल आदेश की चौथी पंक्ति में फ़ॉन्ट का अंतर है। 2026 सीरीज से मेल खाता कोई संदर्भ नंबर नहीं है।',
    forwards: 1420,
    views: '41.3K',
    time: '24 mins ago',
    sentiment: 'positive',
    isAnomaly: false,
  },
  {
    id: 'tg-msg-6',
    channel: 'Farmers Agri Helpdesk Rajasthan',
    subscribers: '48K',
    text: 'Power discom junior engineer informed that feeder maintenance will conclude by 6:00 PM today. Night agricultural supply will be normal.',
    textHi: 'बिजली डिस्कॉम कनिष्ठ अभियंता ने सूचित किया है कि फीडर रखरखाव आज शाम 6:00 बजे तक पूरा हो जाएगा। रात को कृषि आपूर्ति सामान्य रहेगी।',
    forwards: 430,
    views: '9.8K',
    time: '31 mins ago',
    sentiment: 'positive',
    isAnomaly: false,
  },
];

export const demoXTweets: DemoXTweet[] = [
  {
    id: 'x-post-1',
    handle: '@student_voice_ind',
    authorName: 'Aspirant Forum India',
    avatarSeed: 'AF',
    text: 'Seeing multiple Telegram groups sharing circular regarding #NEET2026 date change. If this is true @DG_NTA please release an official press release immediately! Millions of students are in extreme anxiety right now. #NEETPostponed',
    textHi: 'टेलीग्राम ग्रुप्स में नीट तिथि बदलाव का नोटिस वायरल हो रहा है। अगर यह सच है तो @DG_NTA तुरंत स्पष्टीकरण जारी करे!',
    retweets: 1840,
    likes: 6200,
    time: '42m ago',
    sentiment: 'negative',
    verified: true,
    topicId: 'neet-exam-2026',
  },
  {
    id: 'x-post-2',
    handle: '@kotaparents_assn',
    authorName: 'Kota Parents Coalition',
    avatarSeed: 'KP',
    text: 'Train tickets are already booked, hotel accommodations arranged in exam cities. Any arbitrary change will ruin travel plans for rural candidates. Request ministry intervention! #NEET2026',
    textHi: 'ट्रेन टिकट बुक हैं, होटल तय हैं। कोई भी बदलाव ग्रामीण छात्रों के लिए परेशानी बनेगा।',
    retweets: 980,
    likes: 3410,
    time: '1h ago',
    sentiment: 'negative',
    verified: false,
    topicId: 'neet-exam-2026',
  },
  {
    id: 'x-post-3',
    handle: '@jaipur_updates',
    authorName: 'Jaipur Urban Monitor',
    avatarSeed: 'JU',
    text: '42°C heatwave coupled with 5-hour grid cuts in outskirts. Citizen distress index rising across Mansarovar & Sanganer belts. #RajasthanPowerCut',
    textHi: '42 डिग्री गर्मी और बाहरी इलाकों में 5 घंटे बिजली गुल। मानसरोवर और सांगानेर में असंतोष। #RajasthanPowerCut',
    retweets: 430,
    likes: 1250,
    time: '2h ago',
    sentiment: 'negative',
    verified: true,
    topicId: 'rajasthan-power-outage',
  },
  {
    id: 'x-post-4',
    handle: '@FactCheckEdu_In',
    authorName: 'Edu Fact Checker',
    avatarSeed: 'EF',
    text: 'PSA: The circular claiming exam postponement bears a forged signature stamp from 2023 notification. Do NOT believe unverified forwards. Official website is quiet. #FactCheck',
    textHi: 'चेतावनी: परीक्षा टलने का नोटिस फर्जी है और 2023 के हस्ताक्षर चिपकाए गए हैं। अफवाहों पर ध्यान न दें।',
    retweets: 2450,
    likes: 8900,
    time: '3h ago',
    sentiment: 'positive',
    verified: true,
    topicId: 'neet-exam-2026',
  },
];

export const socialComments: SocialComment[] = [
  {
    id: 'yt-c1',
    platform: 'youtube',
    channelOrSubreddit: 'Physics Champion Live (2.1M Subs)',
    author: 'Aakash_2026_aspirant',
    text: 'Sir please confirm live! Everyone in my hostel room has stopped studying and scrolling Telegram since 8 PM. Is the exam postponed or fake??',
    textHi: 'सर प्लीज लाइव बताइए! हमारे हॉस्टल में 8 बजे से सबने पढ़ाई छोड़कर सिर्फ टेलीग्राम देखना शुरू कर दिया है। क्या यह सच है?',
    likes: 1420,
    sentiment: 'negative',
    emotion: 'Anxiety',
    timestamp: '25m ago',
    topicId: 'neet-exam-2026',
  },
  {
    id: 'yt-c2',
    platform: 'youtube',
    channelOrSubreddit: 'Target Medical Guidance',
    author: 'Dr_Sharma_Faculty',
    text: '99% this is a morphed PDF created to sell fake crash course packs. Notice the date alignment font. I have emailed NTA helpline for official statement.',
    textHi: '99% यह फर्जी पीडीएफ है जो क्रैश कोर्स बेचने के लिए बनाई गई है। मैंने आधिकारिक हेल्पलाइन पर मेल किया है।',
    likes: 890,
    sentiment: 'positive',
    emotion: 'Support',
    timestamp: '40m ago',
    topicId: 'neet-exam-2026',
  },
  {
    id: 'red-c1',
    platform: 'reddit',
    channelOrSubreddit: 'r/JEENEETards',
    author: 'u/anxious_dropper_07',
    text: '[Megathread] Metadata analysis of the viral circular PDF shows it was edited in Photoshop at 18:42 IST today. Do not fall for this trap guys, keep giving mocks.',
    textHi: '[मेगाथ्रेड] वायरल सर्कुलर का मेटाडेटा दिखाता है कि इसे आज शाम 6:42 पर फोटोशॉप में एडिट किया गया है। झांसे में न आएं।',
    likes: 640,
    sentiment: 'positive',
    emotion: 'Support',
    timestamp: '55m ago',
    topicId: 'neet-exam-2026',
  },
  {
    id: 'red-c2',
    platform: 'reddit',
    channelOrSubreddit: 'r/india',
    author: 'u/rajasthan_resident',
    text: 'Power outage in Kota & Jaipur outskirts during 43 degree heat is unbearable. Inverters dying after 3 hours. Discom says transformer tripping due to overload.',
    textHi: 'कोटा और जयपुर के बाहरी इलाकों में भीषण गर्मी में बिजली कटौती असहनीय है। इनवर्टर 3 घंटे में जवाब दे रहे हैं।',
    likes: 310,
    sentiment: 'negative',
    emotion: 'Anger',
    timestamp: '1h ago',
    topicId: 'rajasthan-power-outage',
  },
  {
    id: 'yt-c3',
    platform: 'youtube',
    channelOrSubreddit: 'Rajasthan News Today',
    author: 'mukesh_patel_kisan',
    text: 'Tubewell band hai, fasal suk rahi hai. Bijli vibhag kripya daytime me 4 ghante lagatar supply de to hum pump chala sake.',
    textHi: 'ट्यूबवेल बंद है, फसल सूख रही है। बिजली विभाग दिन में 4 घंटे लगातार बिजली दे ताकि पंप चल सके।',
    likes: 195,
    sentiment: 'negative',
    emotion: 'Anger',
    timestamp: '2h ago',
    topicId: 'rajasthan-power-outage',
  },
  {
    id: 'red-c3',
    platform: 'reddit',
    channelOrSubreddit: 'r/IndianStudents',
    author: 'u/neet_warrior_2026',
    text: 'Why does NTA take 24 hours to issue a single tweet denying rumors? If this dashboard existed at ministry level, they would clear the air in 10 minutes.',
    textHi: 'एनटीए को अफवाह खारिज करने में 24 घंटे क्यों लगते हैं? अगर ऐसा डैशबोर्ड मंत्रालय में हो तो 10 मिनट में स्पष्टीकरण आ जाए।',
    likes: 520,
    sentiment: 'negative',
    emotion: 'Sarcasm',
    timestamp: '2h ago',
    topicId: 'neet-exam-2026',
  },
];

/* ==========================================================================
   REAL-LIFE INDIAN STORY TO UNDERSTAND THE PROBLEM
   ========================================================================== */

export const realLifeIndianStory = {
  title: 'The 7:30 PM Kota & Patna Panic: Anatomy of an Indian Social Media Rumor',
  titleHi: 'शाम 7:30 बजे का कोटा और पटना संकट: एक सोशल मीडिया अफवाह की वास्तविक कहानी',
  protagonist: {
    name: 'Aman Sharma & Father Rajesh Sharma',
    location: 'Kota Coaching Hostel & Tier-3 Town (Sikar, Rajasthan)',
    context: 'NEET 2026 Pre-Medical Aspirant preparing for 2 years',
  },
  timelineSteps: [
    {
      time: '07:30 PM',
      stage: '1. The Spark (Private Telegram Forward)',
      stageHi: '1. शुरुआत (प्राइवेट टेलीग्राम फॉरवर्ड)',
      narrative:
        'A single photoshopped PDF memo with a forged national emblem was dropped into a small Telegram group with 450 members. The fake letter claimed: "NEET examination postponed by 3 weeks due to administrative rescheduling."',
      narrativeHi:
        '450 सदस्यों वाले एक छोटे टेलीग्राम ग्रुप में जाली राष्ट्रीय प्रतीक के साथ एक फोटोशॉप किया हुआ आदेश डाला गया जिसमें दावा था कि परीक्षा 3 सप्ताह टल गई है।',
      sentiment: 'Curiosity & Doubt',
      spreadCount: '450 users',
      platform: 'telegram' as Platform,
    },
    {
      time: '08:15 PM',
      stage: '2. The Viral Cascade (Cross-Platform Explosion)',
      stageHi: '2. अनियंत्रित फैलाव (मल्टी-प्लेटफ़ॉर्म विस्फोट)',
      narrative:
        'Within 45 minutes, the PDF was forwarded across 18 major Telegram channels reaching 95,000+ students. WhatsApp student groups ignited. Aman in his Kota hostel room stopped solving physics problem sets as phones began buzzing continuously.',
      narrativeHi:
        '45 मिनट के भीतर यह पीडीएफ 18 बड़े चैनलों में 95,000 से अधिक छात्रों तक पहुंच गई। अमन ने अपने हॉस्टल में रिवीजन छोड़कर मोबाइल देखना शुरू कर दिया।',
      sentiment: 'Severe Anxiety (Surged to 38%)',
      spreadCount: '95,000+ students',
      platform: 'telegram' as Platform,
    },
    {
      time: '09:00 PM - 10:30 PM',
      stage: '3. YouTube & Coaching Amplification',
      stageHi: '3. यूट्यूब और कोचिंग चैनलों द्वारा उछाल',
      narrative:
        'EdTech creators and coaching channels launched urgent live streams with clickbait titles ("NEET POSTPONED? Big Update!"). Over 400,000 students tuned in. Reddit r/JEENEETards saw 40+ posts per minute. Parents in distant villages started frantically calling their children.',
      narrativeHi:
        'कोचिंग चैनलों ने "क्या नीट परीक्षा टल गई?" थंबनेल के साथ लाइव शुरू किया। 4 लाख से ज्यादा छात्र लाइव जुड़े। घबराए माता-पिता के फोन आने लगे।',
      sentiment: 'Panic & Frustration',
      spreadCount: '420,000+ views',
      platform: 'youtube' as Platform,
    },
    {
      time: '08:00 AM (Next Day)',
      stage: '4. National Hashtag & Train Confusion',
      stageHi: '4. राष्ट्रीय हैशटैग और टिकट रद्दीकरण का नुकसान',
      narrative:
        'By morning, #NEETPostponed was trending in Top 5 on X (Twitter). Parents began contemplating cancelling non-refundable railway tickets and hotel bookings across exam center cities.',
      narrativeHi:
        'अगली सुबह एक्स पर #NEETPostponed टॉप ट्रेंड में आ गया। परिजनों ने परीक्षा केंद्र जाने वाली ट्रेनों के टिकट कैंसिल करने के बारे में सोचना शुरू कर दिया।',
      sentiment: 'Public Chaos & Anger',
      spreadCount: '1.8 Million impressions',
      platform: 'x' as Platform,
    },
    {
      time: '02:00 PM (18 Hours Later)',
      stage: '5. The Delayed Official Rebuttal',
      stageHi: '5. 18 घंटे बाद आधिकारिक खंडन',
      narrative:
        'The testing agency finally published a 2-line press note on their website confirming the notice was 100% fake. But the damage was done: 18 hours of lost revision, acute sleeplessness, student despair, and unnecessary travel chaos.',
      narrativeHi:
        'एजेंसी ने 18 घंटे बाद वेबसाइट पर खंडन जारी किया। लेकिन तब तक लाखों छात्रों की नींद, मानसिक शांति और रिवीजन का कीमती समय बर्बाद हो चुका था।',
      sentiment: 'Exhaustion & Cynicism',
      spreadCount: 'Late resolution',
      platform: 'youtube' as Platform,
    },
  ],
  solutionComparison: {
    traditionalWay: {
      detectionTime: '14 to 18 Hours (Post-facto media inquiry)',
      verificationMechanism: 'Manual phone calls & bureaucratic file routing',
      responseAction: 'Static PDF on low-traffic portal; missed viral channels',
      outcome: 'Irreversible anxiety spike, travel losses, diminished trust',
    },
    bharatInsightsWay: {
      detectionTime: '< 15 Minutes (Layer 1 Telegram Connector + Velocity Spike)',
      verificationMechanism: '1-Click Rumor Radar forensic score (Risk: 87/100)',
      responseAction: 'Instant bilingual Action Card (PIB Fact Check + Pinned Advisory ready to broadcast in 30 mins)',
      outcome: 'Panic extinguished before reaching YouTube influencers & trending on X',
    },
  },
};

/* ==========================================================================
   5-LAYER TECHNICAL ARCHITECTURE
   ========================================================================== */

export const architectureLayersData: ArchitectureLayer[] = [
  {
    number: 1,
    name: 'Data Collection (Connectors)',
    nameHi: 'लेयर 1: डेटा संग्रहण (कनेक्टर्स)',
    badge: 'Near-Zero Cost / Public APIs',
    summary:
      'High-throughput ingestion layer combining free MTProto Telegram clients, YouTube Data API comment scrapers, Reddit OAuth streams, and verified public Meta page feeds with static benchmarking.',
    summaryHi:
      'फ्री टेलीग्राम एमटीप्रोटो, यूट्यूब कमेंट एपीआई, रेडिट व पब्लिक फेसबुक पेज के माध्यम से न्यूनतम लागत पर लाइव डेटा संग्रहण।',
    technologies: ['Telethon / TDLib (Telegram)', 'YouTube Data API v3', 'PRAW Reddit OAuth', 'Meta Graph API (Public Pages)', 'Static Benchmarking Engine'],
    keyComponents: [
      {
        title: 'Telegram Connector (Our Strongest Free Source)',
        description: 'Utilizes MTProto client with Telethon/TDLib to subscribe to 1,400+ public education and civic channels. 0 cost, sub-45s latency, forward count extraction.',
        costProfile: '₹0 (Free / Open API)',
      },
      {
        title: 'YouTube Comments Engine',
        description: 'Queries commentThreads API for top 100 trending videos per query within the 10,000 daily free units quota.',
        costProfile: 'Free tier quota',
      },
      {
        title: 'Reddit Text Ingestion',
        description: 'Polls public subreddits (r/india, r/JEENEETards) at 60 req/min using registered script OAuth credentials.',
        costProfile: 'Free developer tier',
      },
      {
        title: 'X (Twitter) Static & Narrow Tier',
        description: 'Employs a static benchmarked sample in prototype mode; ready to connect to a filtered single-query stream on basic tier if funded.',
        costProfile: 'Static Sample (Demo)',
      },
    ],
    samplePayload: JSON.stringify(
      {
        stream_id: 'tg_stream_9918',
        source: 'telegram_public',
        channel: 'pre_med_aspirants_hub',
        message_id: 84920,
        text_raw: 'NEET postponed notice circulating in Kota hostels!',
        media_type: 'document/pdf',
        forwards_count: 3840,
        detected_timestamp: '2026-09-22T20:15:00Z',
      },
      null,
      2
    ),
  },
  {
    number: 2,
    name: 'Preprocessing (Cleaning & Enrichment)',
    nameHi: 'लेयर 2: प्रीप्रोसेसिंग (सफाई एवं संवर्धन)',
    badge: 'Indic NLP Pipeline',
    summary:
      'Cleans noise, filters commercial spam bots, de-duplicates forwards, normalizes Hinglish colloquialisms (e.g. "padhai", "postpone hua"), and extracts emoji affective markers.',
    summaryHi:
      'स्पैम बॉट फिल्टरिंग, हिंग्लिश सामान्यीकरण, इमोजी पहचान और डुप्लीकेट फॉरवर्ड हटाना।',
    technologies: ['IndicNLP Tokenizer', 'Hinglish Phonetic Normalizer', 'MinHash LSH De-duplication', 'Regex De-noiser'],
    keyComponents: [
      {
        title: 'Hinglish & Indic Script Normalizer',
        description: 'Maps Romanized Hindi ("kal exam hoga kya") to canonical semantic tokens to prevent vocabulary split.',
        costProfile: 'Local CPU (0 API cost)',
      },
      {
        title: 'Forward Chain De-duplication',
        description: 'Hashes incoming message bodies using 64-bit SimHash to group identical forwarded rumors into a single cascade cluster.',
        costProfile: 'Ultra-fast memory hashing',
      },
      {
        title: 'Spam & Coaching Bot Filter',
        description: 'Excludes repetitive promotional coupon codes and automated bot comments from narrative calculations.',
        costProfile: 'Rule-based heuristic',
      },
    ],
  },
  {
    number: 3,
    name: 'AI Inference (The “Brain”)',
    nameHi: 'लेयर 3: एआई इन्फेरेंस (सिस्टम का दिमाग)',
    badge: 'Multilingual Affective Models',
    summary:
      'Runs sentiment & emotion classification, aggregated demographic profiling (DPDP Act compliant), trend velocity acceleration, and simplified network influence PageRank.',
    summaryHi:
      'भावना और चिंता वर्गीकरण, गुमनाम जनसांख्यिकी प्रोफाइलिंग, ट्रेंड गति और इन्फ्लुएंसर स्कोर गणना।',
    technologies: ['IndicBERT / fine-tuned LLM', 'VADER Indic Lexicon', 'BERTopic Clustering', 'NetworkX Graph Engine'],
    keyComponents: [
      {
        title: '3.1 Sentiment & Emotion Inference',
        description: 'Classifies text into Positive, Neutral, Negative, plus multi-class emotions (Anxiety, Anger, Sarcasm, Support, Fear).',
        costProfile: 'Quantized ONNX runtime',
      },
      {
        title: '3.2 Demographic Profiling (Aggregate & Anonymous)',
        description: 'Infers socio-demographic cohort distributions using aggregate vocabulary markers with strictly k ≥ 100 anonymity.',
        costProfile: 'Zero PII collected',
      },
      {
        title: '3.3 Trend & Topic Detection',
        description: 'Sliding-window TF-IDF combined with cosine clustering to group related claims across disparate platforms.',
        costProfile: 'Real-time clustering',
      },
      {
        title: '3.4 Link & Network Influence Mapping',
        description: 'Constructs directed information flow graphs to isolate origin seeds, amplifiers, and high-degree broadcast hubs.',
        costProfile: 'Graph matrix multiplication',
      },
    ],
  },
  {
    number: 4,
    name: 'Analytics & Alerting',
    nameHi: 'लेयर 4: एनालिटिक्स एवं अलर्टिंग',
    badge: 'Real-Time Anomaly Engine',
    summary:
      'Monitors velocity thresholds, calculates the composite Rumor Risk Index (0-100), and auto-triggers prioritised Action Cards for public information officers.',
    summaryHi:
      'अफवाह जोखिम स्कोरिंग (0-100), तीव्र उछाल पहचान, और तुरंत एक्शन कार्ड जनरेशन।',
    technologies: ['Z-Score Anomaly Detector', 'Multi-Platform Risk Fusion', 'Rule-Based Action Dispatcher'],
    keyComponents: [
      {
        title: 'Rumor Risk Index Engine',
        description: 'Fuses Velocity (35%) + Negative Sentiment (25%) + Cross-Platform Spread (25%) + Source Credibility (15%).',
        costProfile: 'Real-time calculation',
      },
      {
        title: 'Action Card Generator',
        description: 'Instantly generates bilingual fact-checking press drafts, pinned Telegram advisories, and social media warnings.',
        costProfile: 'Pre-templated + LLM draft',
      },
    ],
  },
  {
    number: 5,
    name: 'Governance, Privacy & Compliance',
    nameHi: 'लेयर 5: सुशासन, गोपनीयता एवं अनुपालन',
    badge: 'DPDP Act 2023 Compliant',
    summary:
      'Guarantees zero personal data tracking, enforces k-anonymity (k ≥ 100), strictly consumes public social broadcasts, and auto-purges raw logs on rolling 7-day schedules.',
    summaryHi:
      'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP 2023) का पूर्ण पालन, शून्य निजी डेटा संग्रहण, 7-दिवसीय ऑटो-पर्ज।',
    technologies: ['DPDP Compliance Guardrails', 'Differential Privacy Filter', '7-Day Rolling Data Purge'],
    keyComponents: [
      {
        title: 'Zero PII Ingestion Policy',
        description: 'No usernames, IP addresses, mobile numbers, or phone contacts are stored or processed at any point.',
        costProfile: 'By design constraint',
      },
      {
        title: 'Aggregated Cohort Guarantees',
        description: 'All demographic and regional stats are strictly represented in minimum bins of 100+ interactions.',
        costProfile: 'Statistical privacy',
      },
    ],
  },
];

/* ==========================================================================
   5. ALGORITHMS & FORMULAS (IN SIMPLEST POSSIBLE WORDS)
   ========================================================================== */

export const algorithmExplainersData: AlgorithmExplainer[] = [
  {
    id: 'sentiment-formula',
    name: '5.1 Sentiment & Emotion Metric',
    nameHi: '5.1 भावना एवं मनोभाव स्कोर (Sentiment & Emotion)',
    simpleIdeaEn:
      'We count words of hope vs. words of despair in both Hindi and English. If anxiety markers jump past normal levels, the emotional alarm rings.',
    simpleIdeaHi:
      'हम संदेशों में सकारात्मक और निराशा/चिंता वाले शब्दों की गिनती करते हैं। चिंता सूचकांक सामान्य से दोगुना होते ही अलार्म सक्रिय होता है।',
    formula: 'Polarity Score (S) = (Positive_tokens - Negative_tokens) / (Positive_tokens + Negative_tokens + ε)',
    variables: [
      { name: 'Positive_tokens', meaning: 'Count of validated affirmative words (e.g., "official", "verified", "passed")' },
      { name: 'Negative_tokens', meaning: 'Count of distress words (e.g., "fake", "panic", "scam", "postpone", "dar")' },
      { name: 'ε (Epsilon)', meaning: 'Smoothing constant (1.0) to prevent division by zero in short posts' },
      { name: 'Anxiety Ratio', meaning: 'Anxiety_posts / Total_posts evaluated over sliding 3-hour window' },
    ],
    exampleCalculationEn:
      'For 5,800 negative tokens and 1,400 positive tokens in 1 hour: S = (1400 - 5800) / (1400 + 5800 + 1) = -4400 / 7201 = -0.61 (Strongly Negative). Anxiety ratio = 38% (2.1× baseline).',
    exampleCalculationHi:
      '1400 सकारात्मक और 5800 नकारात्मक शब्दों पर स्कोर -0.61 (गंभीर नकारात्मक) आता है और चिंता का स्तर 38% पर पहुंच जाता है।',
  },
  {
    id: 'demographic-formula',
    name: '5.2 Demographic Aggregation (DPDP k-Anonymity)',
    nameHi: '5.2 जनसांख्यिकी समूह एकत्रीकरण (k-Anonymity)',
    simpleIdeaEn:
      'We never look at individuals. We count linguistic patterns (like Devanagari script or regional city slang) in large groups of at least 100 people so nobody can be personally identified.',
    simpleIdeaHi:
      'हम किसी व्यक्ति को नहीं पहचानते। कम से कम 100 लोगों के समूह में भाषा शैली और क्षेत्रीय उल्लेखों का प्रतिशत निकालकर सांख्यिकीय अनुमान बनाते हैं।',
    formula: 'Cohort_Share(c) = (Σ Post_Tokens(c) / Total_Post_Tokens) * 100, where Cohort_Size(c) ≥ k (k = 100)',
    variables: [
      { name: 'c', meaning: 'Target cohort (e.g., Student-like, Farmer-related, Hindi-speaking)' },
      { name: 'k', meaning: 'Privacy parameter; any bucket with fewer than 100 samples is suppressed' },
      { name: 'Post_Tokens(c)', meaning: 'Co-occurrence of topical keywords with region or vocabulary markers' },
    ],
    exampleCalculationEn:
      'Out of 12,450 analyzed posts, 5,602 contained Devanagari characters and Hindi keywords. Language Share = (5,602 / 12,450) * 100 = 45.0% Hindi.',
    exampleCalculationHi:
      '12,450 पोस्ट्स में से 5,602 में देवनागरी और हिंदी शब्द पाए गए, जिससे 45% हिस्सेदारी दर्ज हुई।',
  },
  {
    id: 'velocity-formula',
    name: '5.3 Trend Velocity & Acceleration',
    nameHi: '5.3 ट्रेंड गति एवं प्रसार त्वरण (Trend Velocity)',
    simpleIdeaEn:
      'Speed is good, but acceleration is dangerous. If a topic grew by 20 posts yesterday but 2,000 posts in the last hour across 3 different platforms, its velocity is classified as Critical.',
    simpleIdeaHi:
      'सिर्फ रफ्तार नहीं, रफ्तार में अचानक बढ़ोतरी ज्यादा खतरनाक है। अगर 1 घंटे में 3 अलग-अलग प्लेटफॉर्म पर पोस्ट संख्या 2.4 गुना बढ़ी, तो गति "High" मानी जाती है।',
    formula: 'Velocity (V) = ((Volume_t - Volume_{t-1}) / Volume_{t-1}) * CrossPlatform_Multiplier (M)',
    variables: [
      { name: 'Volume_t', meaning: 'Current 1-hour post volume' },
      { name: 'Volume_{t-1}', meaning: 'Prior 1-hour baseline post volume' },
      { name: 'M (Multiplier)', meaning: '1.0 for 1 platform, 1.4 for 2 platforms, 1.8 for 3+ platforms' },
    ],
    exampleCalculationEn:
      'Baseline = 1,200 posts/hr. Current = 2,904 posts/hr (+142% raw surge) across Telegram, YouTube, Reddit (3 platforms => M = 1.8). Velocity Index = 1.42 * 1.8 = 2.55 (High Velocity Alert).',
    exampleCalculationHi:
      '142% की वृद्धि और 3 प्लेटफॉर्म पर फैलाव (1.8x) से गति सूचकांक 2.55 बनता है, जो तत्काल समीक्षा योग्य है।',
  },
  {
    id: 'pagerank-formula',
    name: '5.4 Influence Score (Simplified PageRank)',
    nameHi: '5.4 प्रभाव सूचकांक (सरलीकृत पेज-रैंक विचार)',
    simpleIdeaEn:
      'An influencer is not just someone with many followers. An influencer is someone whose posts are forwarded by other influential community admins.',
    simpleIdeaHi:
      'इन्फ्लुएंसर सिर्फ वह नहीं जिसके फॉलोअर्स ज्यादा हैं; असली इन्फ्लुएंसर वह है जिसकी बात को अन्य बड़े ग्रुप एडमिन आगे फॉरवर्ड करते हैं।',
    formula: 'I(u) = (1 - d) + d * Σ [ (I(v) / OutDegree(v)) * PlatformWeight(v) * EngagementRate(u) ]',
    variables: [
      { name: 'u, v', meaning: 'Network nodes (channels, creators, accounts)' },
      { name: 'd', meaning: 'Damping factor (standard 0.85 in graph algorithms)' },
      { name: 'OutDegree(v)', meaning: 'Number of channels that v frequently forwards or quotes' },
      { name: 'EngagementRate', meaning: 'Ratio of forwards/comments relative to raw view count' },
    ],
    exampleCalculationEn:
      'Coaching Channel A receives forwards from 42 Tier-1 Telegram channels with 8.4% engagement. Normalizing across graph yields an Influence Score of 94/100 (Top Key Influencer).',
    exampleCalculationHi:
      'कोचिंग चैनल A को 42 बड़े टेलीग्राम चैनलों द्वारा फॉरवर्ड किया गया, जिससे 94/100 का प्रभाव स्कोर प्राप्त हुआ।',
  },
];

/* ==========================================================================
   FORENSIC DATA: NEWS ORIGIN & CIRCULATION CASCADE PATH FOR ACTION CARDS
   ========================================================================== */

export const topicForensicMap: Record<string, TopicForensicSpread> = {
  'neet-exam-2026': {
    origin: {
      platform: 'telegram',
      time: '07:30 PM (Yesterday)',
      sourceName: 'Target NEET Aspirants (Private Group)',
      sourceNameHi: 'प्राइवेट मेडिकल छात्र समूह (टेलीग्राम)',
      sourceType: 'Private Telegram Group (450 members)',
      sourceTypeHi: '450 सदस्यों वाला छात्र समूह',
      rawSpark: 'A photoshopped PDF memo with a forged National Emblem claiming: "NEET examination postponed by 3 weeks due to administrative rescheduling."',
      rawSparkHi: 'जाली राष्ट्रीय प्रतीक के साथ फोटोशॉप किया गया आदेश पत्र जिसमें दावा था कि परीक्षा 3 सप्ताह के लिए स्थगित कर दी गई है।',
      forensicFlag: 'Font mismatch on line 4, forged signature stamp from 2023 notification, no valid gazette serial code.',
      forensicFlagHi: 'चौथी पंक्ति में फॉन्ट का अंतर, 2023 का पुराना डिजिटल हस्ताक्षर और कोई आधिकारिक संदर्भ संख्या नहीं।',
    },
    circulation: [
      {
        step: 1,
        platform: 'telegram',
        time: '07:30 PM',
        actionTitle: 'Initial Leak in Private Group',
        actionTitleHi: 'प्राइवेट ग्रुप में पहली पोस्ट',
        description: 'Morphed circular dropped into a 450-member pre-med group asking for verification.',
        descriptionHi: '450 सदस्यों वाले छोटे समूह में पीडीएफ डालकर पुष्टि मांगी गई।',
        reach: '450 users',
      },
      {
        step: 2,
        platform: 'telegram',
        time: '08:15 PM',
        actionTitle: 'Cross-Channel Forward Explosion',
        actionTitleHi: '18 चैनलों में फॉरवर्डिंग विस्फोट',
        description: 'Within 45 minutes, forwarded across 18 public coaching channels with forwarding velocity rising 3.4x.',
        descriptionHi: '45 मिनट के भीतर 18 बड़े चैनलों में 95,000 छात्रों तक फॉरवर्ड पहुंचा।',
        reach: '95,000+ students',
      },
      {
        step: 3,
        platform: 'reddit',
        time: '09:00 PM',
        actionTitle: 'Verification Megathreads',
        actionTitleHi: 'रेडिट पर डिबंकिंग बहस',
        description: 'Students on r/JEENEETards flagged font discrepancies and Photoshop artifacting.',
        descriptionHi: 'छात्रों ने नोटिस के वॉटरमार्क और फॉन्ट की फोरेंसिक जांच शुरू की।',
        reach: '40 posts/min',
      },
      {
        step: 4,
        platform: 'instagram',
        time: '10:00 PM',
        actionTitle: 'Panic Meme Reels Amplification',
        actionTitleHi: 'इंस्टाग्राम रील्स में पैनिक फैलाव',
        description: 'Study meme pages created emotional reels regarding postponement fear, multiplying anxiety.',
        descriptionHi: 'कोचिंग मीम पेजों ने रील्स बनाकर शेयर किया, जिससे छात्रों में डर बढ़ा।',
        reach: '350K+ views',
      },
      {
        step: 5,
        platform: 'x',
        time: '08:00 AM',
        actionTitle: 'National Hashtag Trending',
        actionTitleHi: 'एक्स (ट्विटर) पर राष्ट्रीय ट्रेंड',
        description: '#NEETPostponed entered Top 5 national trends with over 4,200 mentions per hour.',
        descriptionHi: 'हैशटैग राष्ट्रीय ट्रेंड में पहुंचा और प्रति घंटे 4,200 से अधिक ट्वीट्स हुए।',
        reach: '1.8M impressions',
      },
      {
        step: 6,
        platform: 'youtube',
        time: '12:00 PM',
        actionTitle: 'Educator Live Stream Spike',
        actionTitleHi: 'कोचिंग चैनलों के लाइव सेशन्स',
        description: 'Prominent faculties held live streams demanding official Ministry/NTA clarification.',
        descriptionHi: 'प्रसिद्ध शिक्षकों ने लाइव आकर आधिकारिक स्पष्टीकरण की मांग की।',
        reach: '420K+ live viewers',
      },
    ],
  },
  'rajasthan-power-outage': {
    origin: {
      platform: 'reddit',
      time: '02:00 PM (Yesterday)',
      sourceName: 'r/Jaipur Community Thread',
      sourceNameHi: 'r/Jaipur सामुदायिक चर्चा',
      sourceType: 'Local Subreddit Discussion',
      sourceTypeHi: 'स्थानीय रेडिट चर्चा',
      rawSpark: 'A resident reported sudden unscheduled 5-hour grid cuts in Sanganer sector amid 43°C heatwave.',
      rawSparkHi: '43 डिग्री तापमान में सांगानेर सेक्टर में 5 घंटे बिना सूचना बिजली गुल होने की शिकायत दर्ज की गई।',
      forensicFlag: 'Local 220kV transmission line thermal overload was misreported as silent state-wide 6-hour daily power rationing.',
      forensicFlagHi: '220kV ग्रिड में थर्मल ओवरलोड की तकनीकी खराबी को पूरे राज्य में अघोषित बिजली कटौती बता दिया गया।',
    },
    circulation: [
      {
        step: 1,
        platform: 'reddit',
        time: '02:00 PM',
        actionTitle: 'Outage Grievance Posted',
        actionTitleHi: 'रेडिट पर समस्या पोस्ट',
        description: 'Post detailing inverter failures and water pump stoppage across Jaipur suburbs.',
        descriptionHi: 'इनवर्टर बंद होने और पानी के पंप न चलने की शिकायत पोस्ट की गई।',
        reach: '1.2K views',
      },
      {
        step: 2,
        platform: 'facebook',
        time: '03:30 PM',
        actionTitle: 'Resident Welfare & Mandi Groups Outcry',
        actionTitleHi: 'फेसबुक ग्रुप्स पर आक्रोश',
        description: 'Regional civic groups and farmer mandi associations reported dying tubewell pumps.',
        descriptionHi: 'नागरिक व कृषि ग्रुप्स में ट्यूबवेल बंद होने से फसलों को नुकसान की बात फैली।',
        reach: '45K reach',
      },
      {
        step: 3,
        platform: 'telegram',
        time: '05:00 PM',
        actionTitle: 'Agri Helpdesk Channel Spike',
        actionTitleHi: 'टेलीग्राम किसान हेल्पडेस्क स्पाइक',
        description: 'Farmers shared unverified audio claims alleging power discom imposed 6-hour rationing.',
        descriptionHi: 'किसानों के ग्रुप्स में बिना सूचना कटौती का ऑडियो संदेश वायरल हुआ।',
        reach: '18K forwards',
      },
      {
        step: 4,
        platform: 'youtube',
        time: '07:00 PM',
        actionTitle: 'Regional News Portal Coverage',
        actionTitleHi: 'क्षेत्रीय डिजिटल चैनलों पर प्रसारण',
        description: 'Local digital reporters covered citizen protests outside feeder substation.',
        descriptionHi: 'स्थानीय पत्रकारों ने सब-स्टेशन के बाहर प्रदर्शन की वीडियो रिपोर्ट प्रसारित की।',
        reach: '85K views',
      },
    ],
  },
  'education-policy-2026': {
    origin: {
      platform: 'youtube',
      time: '11:00 AM (Yesterday)',
      sourceName: 'EduAlert Daily News (YouTube)',
      sourceNameHi: 'एजुअलर्ट डेली यूट्यूब चैनल',
      sourceType: 'Clickbait Video Upload',
      sourceTypeHi: 'क्लिकबेट वीडियो अपलोड',
      rawSpark: 'A video titled "Big Update: 10th Class Board Exams Abolished Permanently" misquoted curriculum draft flexibility recommendations.',
      rawSparkHi: '"बड़ा फैसला: 10वीं बोर्ड परीक्षा हमेशा के लिए खत्म" शीर्षक से भ्रामक वीडियो पोस्ट किया गया।',
      forensicFlag: 'Committee recommended dual-examination flexibility for students, not abolition of board exams.',
      forensicFlagHi: 'समिति ने वर्ष में 2 बार परीक्षा का विकल्प सुझाया था, परीक्षा समाप्ति नहीं।',
    },
    circulation: [
      {
        step: 1,
        platform: 'youtube',
        time: '11:00 AM',
        actionTitle: 'Sensational Video Uploaded',
        actionTitleHi: 'भ्रामक वीडियो अपलोड',
        description: 'Speculative commentary claiming no board examinations from the 2026 session.',
        descriptionHi: 'दावा किया गया कि 2026 से 10वीं की बोर्ड परीक्षा नहीं होगी।',
        reach: '120K views',
      },
      {
        step: 2,
        platform: 'x',
        time: '01:00 PM',
        actionTitle: 'Parent & Teacher Hashtag Debate',
        actionTitleHi: 'अभिभावकों व शिक्षकों में बहस',
        description: 'Associations began tweeting asking if admission criteria for secondary schools will alter.',
        descriptionHi: 'अभिभावकों ने ट्वीट कर पूछा कि क्या प्रवेश नियम बदलेंगे।',
        reach: '38K impressions',
      },
      {
        step: 3,
        platform: 'telegram',
        time: '03:30 PM',
        actionTitle: 'Teacher Staff Room Circular Forwards',
        actionTitleHi: 'शिक्षक ग्रुप्स में स्क्रीनशॉट फॉरवर्ड',
        description: 'Out-of-context screenshots from draft policy pages shared in school faculty groups.',
        descriptionHi: 'ड्राफ्ट के चुनिंदा पन्नों के स्क्रीनशॉट स्कूल स्टाफ ग्रुप्स में पहुंचे।',
        reach: '65K educators',
      },
    ],
  },
  'subsidy-update': {
    origin: {
      platform: 'facebook',
      time: '09:00 AM (Yesterday)',
      sourceName: 'Kisan Kalyan Samachar Page',
      sourceNameHi: 'किसान कल्याण समाचार पेज',
      sourceType: 'Public Community Post',
      sourceTypeHi: 'सार्वजनिक फेसबुक पोस्ट',
      rawSpark: 'Query regarding why direct benefit transfer (DBT) installment did not credit on the 1st of the month.',
      rawSparkHi: 'किसान द्वारा पूछा गया कि पहली तारीख को सोलर रूफटॉप व डीबीटी सब्सिडी खाते में क्यों नहीं आई।',
      forensicFlag: 'Routine bank IFSC verification clearing window misconstrued as subsidy cancellation.',
      forensicFlagHi: 'नियमित बैंक ई-केवाईसी सत्यापन को सब्सिडी बंद होना समझ लिया गया।',
    },
    circulation: [
      {
        step: 1,
        platform: 'facebook',
        time: '09:00 AM',
        actionTitle: 'Payment Delay Query Posted',
        actionTitleHi: 'सब्सिडी देरी का सवाल',
        description: 'Farmers raised questions over portal KYC status.',
        descriptionHi: 'किसानों ने पोर्टल स्टेटस को लेकर सवाल पूछे।',
        reach: '800 comments',
      },
      {
        step: 2,
        platform: 'telegram',
        time: '11:30 AM',
        actionTitle: 'Kisan Helpline Shared',
        actionTitleHi: 'हेल्पलाइन नोटिस शेयर',
        description: 'Agricultural extension officers shared guidance on bank seeding.',
        descriptionHi: 'कृषि अधिकारियों ने बैंक खाता सीडिंग की जानकारी दी।',
        reach: '34K farmers',
      },
      {
        step: 3,
        platform: 'youtube',
        time: '02:00 PM',
        actionTitle: 'Portal Tutorial Explainer',
        actionTitleHi: 'पोर्टल ट्यूटोरियल वीडियो',
        description: 'Step-by-step video on how to verify pending DBT status on government portal.',
        descriptionHi: 'पोर्टल पर स्टेटस चेक करने का सही तरीका समझाया गया।',
        reach: '95K views',
      },
    ],
  },
  'exam-result-discussion': {
    origin: {
      platform: 'x',
      time: '04:30 PM (Yesterday)',
      sourceName: '@GovtJobsAlerts_Unofficial',
      sourceNameHi: '@GovtJobsAlerts_Unofficial (एक्स)',
      sourceType: 'Unofficial Exam Alert Handle',
      sourceTypeHi: 'अनाधिकारिक सोशल अकाउंट',
      rawSpark: 'A screenshot claiming normalization formula doubled cutoff scores compared to prior years.',
      rawSparkHi: 'अपुष्ट स्क्रीनशॉट जिसमें दावा किया गया कि नॉर्मलाइजेशन से कट-ऑफ दोगुनी हो गई।',
      forensicFlag: 'Numbers were lifted from an old 2024 category-wise merit list table.',
      forensicFlagHi: '2024 की पुरानी मेरिट लिस्ट के अंकों में छेड़छाड़ करके नया बताया गया।',
    },
    circulation: [
      {
        step: 1,
        platform: 'x',
        time: '04:30 PM',
        actionTitle: 'Cutoff Screenshot Tweeted',
        actionTitleHi: 'कट-ऑफ स्क्रीनशॉट ट्वीट',
        description: 'Tweet alleging sudden disqualification of qualifying candidates.',
        descriptionHi: 'छात्रों के डिसक्वालिफाई होने का दावा करते हुए ट्वीट किया गया।',
        reach: '2,100 retweets',
      },
      {
        step: 2,
        platform: 'telegram',
        time: '05:15 PM',
        actionTitle: 'State PSC Groups Chain',
        actionTitleHi: 'प्रतियोगी ग्रुप्स में फॉरवर्ड',
        description: 'Circulated across 14 state examination discussion groups.',
        descriptionHi: '14 बड़े भर्ती परीक्षा समूहों में बात पहुंची।',
        reach: '88K candidates',
      },
      {
        step: 3,
        platform: 'youtube',
        time: '07:00 PM',
        actionTitle: 'Reaction Memes & Live Desks',
        actionTitleHi: 'लाइव रिएक्शन व मीम्स',
        description: 'Creators reacted to server timeout errors during result checking.',
        descriptionHi: 'वेबसाइट स्लो होने पर छात्रों और यूट्यूबर्स ने वीडियो बनाई।',
        reach: '140K views',
      },
    ],
  },
};

/* ==========================================================================
   USP 4: ACTION CARDS – NOT JUST INSIGHTS, BUT WHAT TO DO
   ========================================================================== */

export const actionCardsData: ActionCardItem[] = [
  {
    id: 'act-01',
    topicId: 'neet-exam-2026',
    title: 'Issue Bilingual PIB Fact-Check Press Advisory',
    titleHi: 'द्विभाषी पीआईबी फैक्ट-चेक आधिकारिक प्रेस विज्ञप्ति जारी करें',
    targetMedium: 'Official Press & News Wires (PIB, ANI, PTI, X)',
    priority: 'Immediate (15m)',
    targetAudience: 'National News Desks, Hindi/English dailies, Digital Portals',
    targetAudienceHi: 'राष्ट्रीय समाचार डेस्क, हिन्दी व अंग्रेजी दैनिक, डिजिटल पोर्टल',
    draftContentEn:
      'PIB FACT CHECK ALERT: A fake circular claiming rescheduling of the NEET 2026 Examination is circulating on social media. The National Testing Agency (NTA) clarifies that NO such decision has been taken. The exam remains scheduled on its original notified date. Candidates must only trust official updates on nta.ac.in.',
    draftContentHi:
      'पीआईबी फैक्ट चेक: सोशल मीडिया पर नीट (NEET 2026) परीक्षा स्थगित होने का एक फर्जी सर्कुलर प्रसारित हो रहा है। राष्ट्रीय परीक्षा एजेंसी (NTA) स्पष्ट करती है कि ऐसा कोई निर्णय नहीं लिया गया है। परीक्षा अपने पूर्व निर्धारित समय पर ही होगी। केवल nta.ac.in पर ही विश्वास करें।',
    channels: ['PIB Fact Check Twitter', 'Official NTA Portal Banner', 'ANI Wire Feed'],
    expectedImpactEn: 'Quells 75% of speculative news coverage within 1 hour.',
    expectedImpactHi: '1 घंटे के भीतर 75% भ्रामक चर्चाओं और खबरों पर विराम।',
    platforms: ['x', 'facebook'],
  },
  {
    id: 'act-02',
    topicId: 'neet-exam-2026',
    title: 'Broadcast Pinned Clarification to Top Telegram Hubs',
    titleHi: 'शीर्ष टेलीग्राम चैनलों में पिन किया जाने वाला आधिकारिक संदेश',
    targetMedium: 'Telegram Student Hubs & Coaching Broadcasts',
    priority: 'Immediate (15m)',
    targetAudience: '140K+ Aspirants across 18 major public channels',
    targetAudienceHi: '18 प्रमुख चैनलों में 1.4 लाख से अधिक छात्र',
    draftContentEn:
      '⚠️ IMPORTANT ADVISORY FOR ALL STUDENTS: The PDF circulating in groups regarding exam postponement is 100% FABRICATED. Notice the fake watermark and unverified reference number. Do not lose your revision focus. Stay calm and prepare for your scheduled date.',
    draftContentHi:
      '⚠️ सभी छात्रों के लिए आवश्यक सूचना: परीक्षा टलने के संबंध में ग्रुप्स में वायरल हो रही पीडीएफ पूरी तरह से फर्जी (Fake) है। भ्रामक दावों पर ध्यान न दें और अपनी पढ़ाई जारी रखें।',
    channels: ['All India Pre-Med Hub', 'Kota Faculty Channel', 'Target Batch Groups'],
    expectedImpactEn: 'Cuts forwarding momentum by 82% at the grassroots level.',
    expectedImpactHi: 'जमीनी स्तर पर फॉरवर्डिंग रफ्तार 82% तक कम होती है।',
    platforms: ['telegram'],
  },
  {
    id: 'act-03',
    topicId: 'rajasthan-power-outage',
    title: 'Discom SMS & Civic Board Advisory for Feeder Restoration',
    titleHi: 'बिजली डिस्कॉम व फेसबुक नागरिक पेजों पर स्पष्टीकरण',
    targetMedium: 'Regional Civic Portals, Facebook Pages & SMS Gateway',
    priority: 'High (1h)',
    targetAudience: 'Rural & suburban power consumers in Jaipur/Jodhpur belts',
    targetAudienceHi: 'जयपुर और जोधपुर ग्रामीण उपखंड के कृषि व घरेलू उपभोक्ता',
    draftContentEn:
      'PUBLIC NOTICE: Jaipur Vidyut Vitran Nigam clarifies that unscheduled cuts were caused by an unexpected 220kV grid transmission trip due to extreme heat. Maintenance is currently completing. Uninterrupted 6-hour agricultural pump supply will be guaranteed starting 6:00 PM today.',
    draftContentHi:
      'सार्वजनिक सूचना: जयपुर विद्युत वितरण निगम स्पष्ट करता है कि अत्यधिक लोड के कारण 220kV ग्रिड में आई तकनीकी खराबी को ठीक कर लिया गया है। आज शाम 6:00 बजे से कृषि फीडरों पर निर्बाध आपूर्ति बहाल रहेगी।',
    channels: ['Discom Official FB Page', 'Discom SMS Gateway', 'District Collectorate Page'],
    expectedImpactEn: 'Reduces citizen grievance helpline call congestion by 60%.',
    expectedImpactHi: 'शिकायत हेल्पलाइन पर फोन कॉल का दबाव 60% घटेगा।',
    platforms: ['facebook'],
  },
  {
    id: 'act-04',
    topicId: 'neet-exam-2026',
    title: 'Creator Outreach Notice for Top 5 YouTube Educators',
    titleHi: 'शीर्ष 5 यूट्यूब शिक्षकों एवं कोचिंग प्रमुखों को ब्रीफिंग नोट',
    targetMedium: 'Direct Educator Liaison & YouTube Community Tab',
    priority: 'High (1h)',
    targetAudience: 'Top 5 EdTech Creators with combined 6.5M subscriber reach',
    targetAudienceHi: 'शीर्ष 5 यूट्यूब शिक्षक जिनकी 65 लाख छात्रों तक पहुंच है',
    draftContentEn:
      'CONFIDENTIAL BRIEFING FOR EDUCATORS: Please urge your student communities during live streams not to share unverified circulars. NTA confirmation: No date change. Verified clarification graphics attached for your video community posts.',
    draftContentHi:
      'शिक्षकों हेतु विशेष अपील: कृपया अपनी लाइव कक्षाओं में छात्रों से अपील करें कि वे असत्यापित नोटिस फॉरवर्ड न करें। परीक्षा समय पर होगी। आधिकारिक स्पष्टीकरण ग्राफिक संलग्न है।',
    channels: ['Educator WhatsApp Desk', 'YouTube Community Tab Direct Push'],
    expectedImpactEn: 'Converts speculative live sessions into constructive debunking sessions.',
    expectedImpactHi: 'लाइव वीडियो में अटकलों के बजाय सही जानकारी का प्रसार होगा।',
    platforms: ['youtube'],
  },
  {
    id: 'act-05',
    topicId: 'neet-exam-2026',
    title: 'Reddit Moderator Notice & Pinned Debunk Megathread',
    titleHi: 'रेडिट मॉडरेटर नोटिस एवं पिन किया गया डिबंकिंग मेगाथ्रेड',
    targetMedium: 'r/JEENEETards & r/IndianStudents Moderator Modmail',
    priority: 'Immediate (15m)',
    targetAudience: '180K+ active members on student subreddits',
    targetAudienceHi: 'छात्र सबरेडिट्स पर 1.8 लाख से अधिक सक्रिय सदस्य',
    draftContentEn:
      '[OFFICIAL CLARIFICATION] Sticky megathread for r/JEENEETards & r/IndianStudents: Forensic inspection of the viral postponement order confirms Photoshop artifacting around reference number #NTA-2026/04. NTA has made no announcement. Rule 4 enforcement active: remove duplicate reposts.',
    draftContentHi:
      '[आधिकारिक स्पष्टीकरण] r/JEENEETards एवं r/IndianStudents के लिए मेगाथ्रेड: वायरल नोटिस की फोरेंसिक जांच में फोटोशॉप की पुष्टि हुई है। एनटीए द्वारा कोई तारीख नहीं बदली गई है। नियम 4 के तहत फर्जी पोस्ट हटाएं।',
    channels: ['r/JEENEETards Modmail', 'r/IndianStudents Sticky Banner'],
    expectedImpactEn: 'Stops panic upvoting spiral and de-amplifies speculative threads by 90%.',
    expectedImpactHi: 'रेडिट पर पैनिक अपवोटिंग का सिलसिला थमता है और 90% अटकलें रुकती हैं।',
    platforms: ['reddit'],
  },
  {
    id: 'act-06',
    topicId: 'neet-exam-2026',
    title: 'Visual Fact-Check Infographic for Instagram Study Pages',
    titleHi: 'इंस्टाग्राम स्टडी पेजों हेतु विजुअल फैक्ट-चेक इन्फोग्राफिक',
    targetMedium: 'Instagram Carousel & Story Assets for Student Creators',
    priority: 'High (1h)',
    targetAudience: '350K+ daily active aspirants viewing study reels',
    targetAudienceHi: 'स्टडी रील्स और इन्फोग्राफिक्स देखने वाले 3.5 लाख छात्र',
    draftContentEn:
      'FACT OR FAKE? The red-stamped circular claiming NEET postponement is 100% FALSE. Swipe left to see the 3 visual red flags: forged signature font, mismatched date format, and absent barcode watermark. Share this post to protect your classmates from exam stress.',
    draftContentHi:
      'सच या झूठ? नीट परीक्षा टलने का वायरल दावा पूरी तरह फर्जी है। 3 गलतियां देखने के लिए स्वाइप करें: गलत फॉन्ट, बिना बारकोड वाला वॉटरमार्क और फर्जी हस्ताक्षर। अपने दोस्तों को शेयर करके पैनिक से बचाएं।',
    channels: ['Verified Edu Instagram Creators', 'State Higher Education Story Feed'],
    expectedImpactEn: 'Neutralizes viral reel panic among visual-first mobile audiences.',
    expectedImpactHi: 'मोबाइल यूजर्स और रील्स देखने वाले छात्रों में तुरंत विश्वास बहाल होता है।',
    platforms: ['instagram'],
  },
  {
    id: 'act-07',
    topicId: 'education-policy-2026',
    title: 'Ministry Press Clarification on Curriculum & Board Framework',
    titleHi: 'शिक्षा मंत्रालय प्रेस स्पष्टीकरण: बोर्ड परीक्षा एवं पाठ्यक्रम प्रारूप',
    targetMedium: 'Press Information Bureau (PIB) & Education Portals',
    priority: 'High (1h)',
    targetAudience: 'School administrators, parents, and secondary students',
    targetAudienceHi: 'स्कूल प्रबंधन, अभिभावक एवं माध्यमिक स्तर के विद्यार्थी',
    draftContentEn:
      'CLARIFICATION NOTE: Reports stating that 10th standard board exams are being abolished are inaccurate. The new framework introduces dual-assessment flexibility rather than complete elimination. Detailed operational syllabus circulars will be issued via cbse.gov.in.',
    draftContentHi:
      'स्पष्टीकरण विज्ञप्ति: 10वीं बोर्ड परीक्षा समाप्त किए जाने से जुड़ी खबरें भ्रामक हैं। नई रूपरेखा में वर्ष में दो बार परीक्षा का विकल्प दिया गया है। पूर्ण आधिकारिक विवरण केवल cbse.gov.in पर देखें।',
    channels: ['Ministry of Education Handle', 'CBSE Official Circular Feed', 'State Board Wires'],
    expectedImpactEn: 'Resolves 85% of parental anxiety and misinformed social debates.',
    expectedImpactHi: 'अभिभावकों की 85% असमंजस स्थिति दूर और सकारात्मक संवाद बहाली।',
    platforms: ['x', 'youtube'],
  },
  {
    id: 'act-08',
    topicId: 'subsidy-update',
    title: 'Public DBT Beneficiary Advisory & CSC Helpdesk Broadcast',
    titleHi: 'डीबीटी लाभार्थी सार्वजनिक सूचना एवं जनसेवा केंद्र एडवाइजरी',
    targetMedium: 'Regional Gram Panchayat Portals, CSC Broadcast & WhatsApp',
    priority: 'Standard',
    targetAudience: 'Rural farming households, PM-Kisan and Solar Subsidy applicants',
    targetAudienceHi: 'ग्रामीण किसान परिवार एवं सोलर रूफटॉप लाभार्थी',
    draftContentEn:
      'ADVISORY ON SUBSIDY TRANSFERS: Beneficiary installments are being credited directly to Aadhaar-seeded accounts in scheduled batches. No third-party agent or APK app download is required. Check official status only at pfms.nic.in or visit your authorized CSC center.',
    draftContentHi:
      'सब्सिडी भुगतान सूचना: डीबीटी की राशि सीधे आधार-लिंक्ड बैंक खातों में भेजी जा रही है। किसी भी अनधिकृत लिंक या एजेंट के झांसे में न आएं। सही जानकारी के लिए pfms.nic.in पर लॉग इन करें या सीएससी केंद्र जाएं।',
    channels: ['Gram Panchayat Broadcast', 'CSC Digital Seva Portal', 'Direct SMS Gateway'],
    expectedImpactEn: 'Mitigates financial phishing attacks and fake registration links by 95%.',
    expectedImpactHi: 'फर्जी पंजीकरण लिंक और वित्तीय धोखाधड़ी के प्रयासों पर 95% रोकथाम।',
    platforms: ['facebook', 'youtube', 'telegram'],
  },
  {
    id: 'act-09',
    topicId: 'exam-result-discussion',
    title: 'Commission Server Status Bulletin & Scorecard Advisory',
    titleHi: 'आयोग सर्वर स्थिति बुलेटिन एवं स्कोरकार्ड तकनीकी सूचना',
    targetMedium: 'State Staff Selection Portal & Official Social Handles',
    priority: 'Immediate (15m)',
    targetAudience: '220K+ Aspirants awaiting competitive exam scorecards',
    targetAudienceHi: '2.2 लाख से अधिक परीक्षार्थी जो परिणाम का इंतजार कर रहे हैं',
    draftContentEn:
      'SERVER LOAD NOTICE: Due to heavy concurrent traffic (>300K hits/min), alternate mirror server links (Mirror 1 & Mirror 2) have been activated for scorecard downloads. Cut-off criteria follow the notified standard deviation normalization formula. Do not rely on unauthorized speculative PDFs.',
    draftContentHi:
      'सर्वर लोड सूचना: अत्यधिक ट्रैफिक के कारण दो अतिरिक्त मिरर लिंक सक्रिय किए गए हैं। कट-ऑफ पूर्व निर्धारित सामान्यीकरण फार्मूले के तहत तैयार की गई है। सोशल मीडिया पर वायरल फर्जी कट-ऑफ लिस्ट पर भरोसा न करें।',
    channels: ['Official Commission X Handle', 'Recruitment Portal Alert Bar', 'Telegram Pre-Exam Bot'],
    expectedImpactEn: 'Alleviates server congestion and curtails speculative cut-off rumors within 20 mins.',
    expectedImpactHi: '20 मिनट में सर्वर लोड सामान्य और फर्जी कट-ऑफ अफवाहों पर तत्काल रोक।',
    platforms: ['x', 'telegram'],
  },
];

/* ==========================================================================
   10. ONE-PARAGRAPH “LIMITATIONS & SCOPE” (FOR HACKATHON SUBMISSION)
   ========================================================================== */

export const limitationsAndScopeParagraph =
  'Bharat Social Insights is designed as an operational public-interest prototype focused on early-warning narrative intelligence and panic mitigation across Indian digital spaces. The current release is strictly scoped to passive ingestion of public, unauthenticated social streams (such as open Telegram broadcast channels, YouTube comment feeds, and public Reddit threads), operating without any access to private chats, encrypted personal messages, or individual user metadata. In compliance with the Digital Personal Data Protection (DPDP) Act 2023, demographic profiles and regional clusters are inferred solely as statistical, k-anonymized aggregate cohorts (k ≥ 100) with zero personally identifiable information (PII) collection. Due to enterprise tier constraints in 2026, X (Twitter) integration is benchmarked via a curated static demo dataset rather than full-firehose live streaming. The prototype does not perform judicial fact adjudications; rather, it provides probabilistic risk indicators (Rumor Risk Index) and immediate, actionable communication drafts (Action Cards) for public authorities to avert real-world distress.';

/* ==========================================================================
   150+ DENSE NETWORK NODES & EDGES FOR HACKATHON PROTOTYPE
   ========================================================================== */

const generateDenseGraph = () => {
  const nodes: NetworkNode[] = [...networkGraphData.nodes];
  const edges: NetworkEdge[] = [...networkGraphData.edges];

  const categories: ('origin' | 'amplifier' | 'influencer' | 'community')[] = [
    'amplifier',
    'community',
    'community',
    'amplifier',
    'influencer',
  ];
  const platforms: Platform[] = ['telegram', 'youtube', 'reddit', 'facebook', 'instagram', 'x'];

  // Seed 140 additional realistic micro-nodes around the 8 core hubs
  for (let i = 9; i <= 150; i++) {
    const parentId = `n${((i % 8) + 1)}`;
    const category = categories[i % categories.length];
    const platform = platforms[i % platforms.length];
    
    // Position clustering around parent hubs
    const angle = ((i * 137.5) * Math.PI) / 180; // Golden ratio spiral
    const radius = 60 + (i % 5) * 45;
    const parent = networkGraphData.nodes[(i % 8)];
    const x = Math.max(50, Math.min(850, parent.x + Math.cos(angle) * radius));
    const y = Math.max(50, Math.min(480, parent.y + Math.sin(angle) * radius));

    nodes.push({
      id: `n${i}`,
      label: `${platform.toUpperCase()} Cluster Node #${i}`,
      category,
      platform,
      reach: `${Math.floor(12 + (i * 2.3))}K`,
      connections: Math.floor(4 + (i % 18)),
      x,
      y,
      size: category === 'influencer' ? 24 : category === 'amplifier' ? 18 : 12,
    });

    // Connect to parent
    edges.push({
      source: parentId,
      target: `n${i}`,
      type: i % 2 === 0 ? 'forwards' : 'replies',
      weight: (i % 3) + 1,
    });

    // Occasional cross-connection
    if (i % 4 === 0 && i > 12) {
      edges.push({
        source: `n${i - 3}`,
        target: `n${i}`,
        type: 'mentions',
        weight: 1,
      });
    }
  }

  return { nodes, edges };
};

export const denseNetworkGraph = generateDenseGraph();

