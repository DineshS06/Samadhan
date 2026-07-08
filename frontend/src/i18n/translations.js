/** Full UI translations — English & Hindi */

export const CATEGORY_IDS = [
  'roads', 'water', 'health', 'education', 'power', 'housing',
  'agri', 'employment', 'safety', 'environment', 'transport', 'other',
]

export const CHANNEL_IDS = ['web', 'whatsapp', 'phone', 'twitter', 'meeting', 'letter']

export const STATE_LANGUAGES = {
  'Andhra Pradesh': ['English', 'Hindi', 'Telugu'],
  'Telangana': ['English', 'Hindi', 'Telugu'],
  'Tamil Nadu': ['English', 'Hindi', 'Tamil'],
  'Karnataka': ['English', 'Hindi', 'Kannada'],
  'Kerala': ['English', 'Hindi', 'Malayalam'],
  'Maharashtra': ['English', 'Hindi', 'Marathi'],
  'Gujarat': ['English', 'Hindi', 'Gujarati'],
  'West Bengal': ['English', 'Hindi', 'Bengali'],
  'Odisha': ['English', 'Hindi', 'Odia'],
  'Punjab': ['English', 'Hindi', 'Punjabi'],
  'Rajasthan': ['English', 'Hindi', 'Hindi'],
  'Bihar': ['English', 'Hindi', 'Hindi'],
  'Uttar Pradesh': ['English', 'Hindi', 'Hindi'],
  'Delhi': ['English', 'Hindi'],
  'Jammu and Kashmir': ['English', 'Hindi', 'Urdu'],
}

export const UI = {
  en: {
    appTitle: 'Samadhan: Constituency Development Engine',
    citizenSubtitle: 'Citizen Grievance Portal',
    mpSubtitle: 'MP Executive Dashboard — MPLADS Prioritization',
    reportIssue: 'Report a Constituency Issue',
    reportDesc: 'Register your grievance with verified contact details. Your identity is kept confidential from the public dashboard.',
    yourDetails: 'Your Details',
    issueCategory: 'Issue Category',
    location: 'Location & Constituency',
    describeIssue: 'Describe the Issue',
    evidence: 'Supporting Evidence',
    state: 'State',
    selectState: 'Select your state',
    district: 'District',
    districtPh: 'e.g. Visakhapatnam',
    constituency: 'Parliamentary Constituency (Lok Sabha)',
    constituencyPh: 'e.g. Visakhapatnam',
    constituencyHint: 'Required to route your grievance to the concerned MP office',
    language: 'Language of your grievance',
    languageHint: 'Available languages for selected state',
    name: 'Full Name',
    namePh: 'As on Aadhaar / voter ID',
    phone: 'Mobile Number',
    phonePh: '+91 98765 43210',
    phoneHint: 'For verification and follow-up only — never shown on MP dashboard',
    privacyNotice: 'Your name and mobile number are stored securely and are NOT visible to MPs or bureaucrats on the public dashboard.',
    village: 'Village / Town / Locality',
    villagePh: 'e.g. Anandapuram',
    ward: 'Ward / Block / Panchayat',
    wardPh: 'e.g. Ward 4',
    pincode: 'PIN Code',
    useGps: 'Use My Current Location (GPS)',
    gpsLoading: 'Detecting location…',
    gpsCaptured: 'GPS location captured',
    gpsFail: 'Could not get GPS. Enter address manually.',
    geoUnsupported: 'Geolocation is not supported by your browser.',
    describe: 'Describe your problem',
    describeHint: 'Write in your selected language — include how long the issue has existed and who is affected',
    describePhEn: 'Describe your issue in detail…',
    describePhHi: 'Hamare gaon mein sadak bahut kharab hai…',
    describePhTe: 'Ma oorlo pani problem undi…',
    severity: 'Severity of the issue',
    attachments: 'Attach photo, video, or document (optional)',
    attachmentsHint: 'Accepted: JPG, PNG, PDF, MP4 — max 5 MB. Photos of roads, water issues, documents as proof.',
    attachmentSelected: 'File attached',
    submit: 'Submit Grievance',
    submitting: 'Submitting…',
    success: 'Grievance registered successfully',
    refId: 'Reference ID',
    saveRef: 'Save this ID to track your grievance status',
    submitAnother: 'Submit Another Grievance',
    staffLogin: 'Staff / MP Access',
    backToCitizen: '← Citizen Portal',
    footerTagline: 'Government of India — Civic Grievance Redressal',
    category: 'Category',
    locationLabel: 'Location',
    severityLabel: 'Severity',
    priorityLabel: 'Priority Score',
    summaryLabel: 'AI Summary',
    valState: 'Please select your state.',
    valLanguage: 'Please select a language.',
    valCategory: 'Please select a category.',
    valDistrict: 'Please select or enter your district.',
    valConstituency: 'Please enter your parliamentary constituency.',
    valVillage: 'Please enter village/town or use GPS.',
    locationLockedHint: 'Select state, district, and parliamentary constituency first — required to route your grievance to the concerned MP.',
    valName: 'Full name is required for verification.',
    valPhone: 'Mobile number is required for follow-up.',
    valPhoneFormat: 'Enter a valid 10-digit Indian mobile number.',
    valPincode: 'PIN Code must be a 6‑digit number.',
    valText: 'Please describe your problem.',
    valFileSize: 'File must be under 5 MB.',
    loading: 'Loading dashboard…',
    loadFail: 'Failed to load dashboard data.',
    metricGrievances: 'Total Ingested Grievances',
    metricProjects: 'AI-Prioritized Infrastructure Projects',
    metricMplads: 'Active MPLADS Fund',
    metricAllocated: 'Allocated / Sanctioned Funds',
    tableTitle: 'Priority Project Leaderboard',
    tableSub: 'Ranked by AI demand index + open-data gap score',
    colRank: 'Rank',
    colProject: 'Project Name',
    colLocation: 'Location',
    colDemand: 'Public Demand Index',
    colGap: 'Infrastructure Gap Score',
    colAction: 'Action',
    reviewBtn: 'Review & Sanction',
    mapTitle: 'Constituency Map',
    mapSub: 'Citizen grievances mapped by GPS / locality within your Lok Sabha seat',
    mapConstituencyScope: 'Lok Sabha constituency',
    mapIssuesMapped: 'issues on map',
    mapGpsCount: 'GPS pins',
    mapLocalityCount: 'locality pins',
    mapGpsPin: 'Plotted from citizen GPS coordinates',
    mapLocalityPin: 'Plotted from village/locality in complaint',
    mapLow: 'Low',
    mapMedium: 'Medium',
    mapHigh: 'High',
    lastUpdated: 'Last updated',
    poweredBy: 'Powered by Gemini AI',
    modalTitle: 'Draft Administrative Sanction to District Collector under MPLADS',
    modalClose: 'Close',
    modalForward: 'Forward to District Administration',
    modalLoading: 'Loading official format…',
    modalFrom: 'From',
    modalTo: 'To',
    modalSubject: 'Subject',
    modalScope: 'Project Scope',
    modalBudget: 'Estimated Budget Allocation',
    modalGuidelines: 'Department Accountability Guidelines',
    modalFullText: 'View full letter text',
    toastForward: 'Sanction note queued for District Collector review.',
    mpLoginTitle: 'MP / Staff Login',
    mpLoginSubtitle: 'Secure access for elected representatives',
    mpLoginDesc: 'Sign in to view your constituency dashboard, citizen grievance map, and MPLADS prioritization.',
    mpUsername: 'MP Office Username',
    mpPassword: 'Password',
    mpLoginBtn: 'Sign In to Dashboard',
    mpLoginLoading: 'Signing in…',
    mpDemoAccounts: 'Demo MP accounts',
    mpDemoPassword: 'Demo password',
    mpLoggedInAs: 'Logged in as',
    mpLogout: 'Sign Out',
    trackYourGrievance: 'Track your grievance',
    refIdPlaceholder: 'Enter Reference ID',
    tracking: 'Checking…',
    trackingResult: 'Tracking Result',
    trackAnother: 'Track Another',
    status: 'Status',
    categories: {
      roads: { label: 'Roads & Connectivity', desc: 'Potholes, broken roads, bridges, street lights' },
      water: { label: 'Water & Sanitation', desc: 'Drinking water, drainage, toilets, sewage' },
      health: { label: 'Health & Medical', desc: 'Hospitals, PHC, ambulance, medicines' },
      education: { label: 'Education & Schools', desc: 'Schools, colleges, scholarships, buses' },
      power: { label: 'Electricity & Power', desc: 'Power cuts, transformers, street lighting' },
      housing: { label: 'Housing & Slums', desc: 'Housing schemes, slum rehabilitation' },
      agri: { label: 'Agriculture & Irrigation', desc: 'Canals, crops, MSP, farmer support' },
      employment: { label: 'Employment & Livelihood', desc: 'Jobs, skill training, NREGA' },
      safety: { label: 'Law & Order / Safety', desc: 'Crime, harassment, police response' },
      environment: { label: 'Environment & Pollution', desc: 'Air/water pollution, waste dumping' },
      transport: { label: 'Public Transport', desc: 'Bus service, railway connectivity' },
      other: { label: 'Other', desc: 'Any other constituency development issue' },
    },
    severityLevels: {
      1: 'Low',
      2: 'Moderate',
      3: 'Significant',
      4: 'Serious',
      5: 'Critical',
    },
  },
  hi: {
    appTitle: 'समाधान: निर्वाचन क्षेत्र विकास इंजन',
    citizenSubtitle: 'नागरिक शिकायत पोर्टल',
    mpSubtitle: 'सांसद कार्यकारी डैशबोर्ड — MPLADS प्राथमिकता',
    reportIssue: 'निर्वाचन क्षेत्र की समस्या दर्ज करें',
    reportDesc: 'सत्यापित संपर्क विवरण के साथ शिकायत दर्ज करें। आपकी पहचान सार्वजनिक डैशबोर्ड से गोपनीय रखी जाती है।',
    yourDetails: 'आपका विवरण',
    issueCategory: 'समस्या की श्रेणी',
    location: 'स्थान और निर्वाचन क्षेत्र',
    describeIssue: 'समस्या का वर्णन',
    evidence: 'सहायक प्रमाण',
    state: 'राज्य',
    selectState: 'अपना राज्य चुनें',
    district: 'ज़िला',
    districtPh: 'जैसे: विशाखापट्टनम',
    constituency: 'संसदीय निर्वाचन क्षेत्र (लोकसभा)',
    constituencyPh: 'जैसे: विशाखापट्टनम',
    constituencyHint: 'शिकायत को संबंधित सांसद कार्यालय तक पहुँचाने के लिए आवश्यक',
    language: 'शिकायत की भाषा',
    languageHint: 'चयनित राज्य के लिए उपलब्ध भाषाएँ',
    name: 'पूरा नाम',
    namePh: 'आधार / मतदाता ID के अनुसार',
    phone: 'मोबाइल नंबर',
    phonePh: '+91 98765 43210',
    phoneHint: 'केवल सत्यापन और फॉलो-अप के लिए — MP डैशबोर्ड पर नहीं दिखाया जाता',
    privacyNotice: 'आपका नाम और मोबाइल सुरक्षित रखा जाता है और सार्वजनिक MP डैशबोर्ड पर नहीं दिखाया जाता।',
    village: 'गाँव / शहर / इलाका',
    villagePh: 'जैसे: आनंदपुरम',
    ward: 'वार्ड / ब्लॉक / पंचायत',
    wardPh: 'जैसे: वार्ड 4',
    pincode: 'पिन कोड',
    useGps: 'मेरा वर्तमान स्थान (GPS) उपयोग करें',
    gpsLoading: 'स्थान खोजा जा रहा है…',
    gpsCaptured: 'GPS स्थान दर्ज हो गया',
    gpsFail: 'GPS प्राप्त नहीं हुआ। पता मैन्युअल दर्ज करें।',
    geoUnsupported: 'आपका ब्राउज़र जियोलोकेशन सपोर्ट नहीं करता।',
    describe: 'अपनी समस्या बताएं',
    describeHint: 'अपनी चुनी भाषा में लिखें — समस्या कब से है और किसे प्रभावित करती है',
    describePhEn: 'विस्तार से समस्या बताएं…',
    describePhHi: 'Hamare gaon mein sadak bahut kharab hai…',
    describePhTe: 'Ma oorlo pani problem undi…',
    severity: 'समस्या की गंभीरता',
    attachments: 'फोटो, वीडियो या दस्तावेज़ संलग्न करें (वैकल्पिक)',
    attachmentsHint: 'स्वीकृत: JPG, PNG, PDF, MP4 — अधिकतम 5 MB',
    attachmentSelected: 'फ़ाइल संलग्न',
    submit: 'शिकायत दर्ज करें',
    submitting: 'जमा हो रहा है…',
    success: 'शिकायत सफलतापूर्वक दर्ज हो गई',
    refId: 'संदर्भ ID',
    saveRef: 'स्थिति जानने के लिए यह ID सहेजें',
    submitAnother: 'एक और शिकायत दर्ज करें',
    staffLogin: 'कर्मचारी / MP प्रवेश',
    backToCitizen: '← नागरिक पोर्टल',
    footerTagline: 'भारत सरकार — नागरिक शिकायत निवारण',
    category: 'श्रेणी',
    locationLabel: 'स्थान',
    severityLabel: 'गंभीरता',
    priorityLabel: 'प्राथमिकता स्कोर',
    summaryLabel: 'AI सारांश',
    valState: 'कृपया राज्य चुनें।',
    valLanguage: 'कृपया भाषा चुनें।',
    valCategory: 'कृपया श्रेणी चुनें।',
    valDistrict: 'कृपया ज़िला चुनें या दर्ज करें।',
    valConstituency: 'कृपया संसदीय निर्वाचन क्षेत्र दर्ज करें।',
    valVillage: 'कृपया गाँव/शहर दर्ज करें या GPS उपयोग करें।',
    locationLockedHint: 'पहले राज्य, ज़िला और संसदीय निर्वाचन क्षेत्र चुनें — शिकायत संबंधित सांसद तक पहुँचाने के लिए आवश्यक।',
    valName: 'सत्यापन के लिए पूरा नाम आवश्यक है।',
    valPhone: 'फॉलो-अप के लिए मोबाइल नंबर आवश्यक है।',
    valPhoneFormat: 'मान्य 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
    valPincode: 'पिन कोड 6 अंकों की संख्या होनी चाहिए।',
    valText: 'कृपया समस्या का वर्णन करें।',
    valFileSize: 'फ़ाइल 5 MB से छोटी होनी चाहिए।',
    loading: 'डैशबोर्ड लोड हो रहा है…',
    loadFail: 'डैशबोर्ड डेटा लोड नहीं हुआ।',
    metricGrievances: 'कुल दर्ज शिकायतें',
    metricProjects: 'AI-प्राथमिकता परियोजनाएँ',
    metricMplads: 'सक्रिय MPLADS निधि',
    metricAllocated: 'आवंटित / स्वीकृत निधि',
    tableTitle: 'प्राथमिकता परियोजना सूची',
    tableSub: 'AI मांग सूचकांक + खुले डेटा गैप स्कोर द्वारा क्रम',
    colRank: 'क्रम',
    colProject: 'परियोजना नाम',
    colLocation: 'स्थान',
    colDemand: 'जन मांग सूचकांक',
    colGap: 'अवसंरचना गैप स्कोर',
    colAction: 'कार्रवाई',
    reviewBtn: 'समीक्षा और स्वीकृति',
    mapTitle: 'निर्वाचन क्षेत्र मानचित्र',
    mapSub: 'GPS / इलाके के अनुसार नागरिक शिकायतें आपके लोकसभा क्षेत्र में',
    mapConstituencyScope: 'लोकसभा निर्वाचन क्षेत्र',
    mapIssuesMapped: 'मानचित्र पर समस्याएँ',
    mapGpsCount: 'GPS पिन',
    mapLocalityCount: 'इलाका पिन',
    mapGpsPin: 'नागरिक GPS निर्देशांक से अंकित',
    mapLocalityPin: 'शिकायत में दिए गाँव/इलाके से अंकित',
    mapLow: 'कम',
    mapMedium: 'मध्यम',
    mapHigh: 'उच्च',
    lastUpdated: 'अंतिम अपडेट',
    poweredBy: 'Gemini AI द्वारा संचालित',
    modalTitle: 'जिला कलेक्टर को MPLADS के तहत प्रशासनिक स्वीकृति का मसौदा',
    modalClose: 'बंद करें',
    modalForward: 'जिला विधि प्रशासन को अग्रेषित करें',
    modalLoading: 'आधिकारिक प्रारूप लोड हो रहा है…',
    modalFrom: 'प्रेषक',
    modalTo: 'प्राप्तकर्ता',
    modalSubject: 'विषय',
    modalScope: 'परियोजना का दायरा',
    modalBudget: 'अनुमानित बजट आवंटन',
    modalGuidelines: 'विभागीय जवाबदेही दिशानिर्देश',
    modalFullText: 'पूरा पत्र देखें',
    toastForward: 'स्वीकृति नोट जिला कलेक्टर समीक्षा के लिए भेजा गया।',
    mpLoginTitle: 'MP / कर्मचारी लॉगिन',
    mpLoginSubtitle: 'निर्वाचित प्रतिनिधियों के लिए सुरक्षित प्रवेश',
    mpLoginDesc: 'अपने निर्वाचन क्षेत्र डैशबोर्ड, नागरिक शिकायत मानचित्र और MPLADS प्राथमिकता देखने के लिए साइन इन करें।',
    mpUsername: 'MP कार्यालय उपयोगकर्ता नाम',
    mpPassword: 'पासवर्ड',
    mpLoginBtn: 'डैशबोर्ड में साइन इन',
    mpLoginLoading: 'साइन इन हो रहा है…',
    mpDemoAccounts: 'डेमो MP खाते',
    mpDemoPassword: 'डेमो पासवर्ड',
    mpLoggedInAs: 'लॉग इन',
    mpLogout: 'साइन आउ트',
    trackYourGrievance: 'अपनी शिकायत की ट्रैकिंग करें',
    refIdPlaceholder: 'संदर्भ ID दर्ज करें',
    tracking: 'जांच हो रही है…',
    trackingResult: 'ट्रैकिंग परिणाम',
    trackAnother: 'दूसरी ट्रैकिंग करें',
    status: 'स्थिति',
    categories: {
      roads: { label: 'सड़क और कनेक्टिविटी', desc: 'गड्ढे, टूटी सड़कें, पुल, स्ट्रीट लाइट' },
      water: { label: 'जल और स्वच्छता', desc: 'पेयजल, नाली, शौचालय, सीवेज' },
      health: { label: 'स्वास्थ्य और चिकित्सा', desc: 'अस्पताल, PHC, एम्बुलेंस, दवाएँ' },
      education: { label: 'शिक्षा और स्कूल', desc: 'स्कूल, कॉलेज, छात्रवृत्ति,バス' },
      power: { label: 'बिजली और ऊर्जा', desc: 'बिजली कटौती, ट्रांसफॉर्मर, स्ट्रीट लाइट' },
      housing: { label: 'आवास और झुग्गी', desc: 'आवास योजना, पुनर्वास' },
      agri: { label: 'कृषि और सिंचाई', desc: 'नहर, फसल, MSP, किसान सहायता' },
      employment: { label: 'रोजगार और आजीविका', desc: 'नौकरी, कौशल प्रशिक्षण, NREGA' },
      safety: { label: 'कानून और सुरक्षा', desc: 'अपराध, उत्पीड़न, पुलिस प्रतिक्रिया' },
      environment: { label: 'पर्यावरण और प्रदूषण', desc: 'वायु/जल प्रदूषण, कचरा' },
      transport: { label: 'सार्वजनिक परिवहन', desc: 'बस सेवा, रेल संपर्क' },
      other: { label: 'अन्य', desc: 'कोई अन्य विकास समस्या' },
    },
    severityLevels: {
      1: 'कम',
      2: 'मध्यम',
      3: 'महत्वपूर्ण',
      4: 'गंभीर',
      5: 'अत्यावश्यक',
    },
  },
}

/* ---------- Andhra Pradesh ---------- */
export const AP_DISTRICTS = [
  'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla', 'Chittoor', 'East Godavari',
  'Eluru', 'Guntur', 'Kakinada', 'Konaseema', 'Krishna', 'Kurnool', 'Nandyal',
  'NTR', 'Palnadu', 'Parvathipuram Manyam', 'Prakasam', 'Sri Potti Sriramulu Nellore',
  'Sri Sathya Sai', 'Srikakulam', 'Tirupati', 'Visakhapatnam', 'Vizianagaram',
  'YSR Kadapa',
]

export const AP_CONSTITUENCIES = [
  'Araku', 'Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'Anakapalli',
  'Kakinada', 'Amalapuram', 'Rajahmundry', 'Narasapur', 'Eluru',
  'Machilipatnam', 'Vijayawada', 'Guntur', 'Narasaraopet', 'Bapatla',
  'Ongole', 'Nandyal', 'Kurnool', 'Anantapur', 'Hindupur',
  'Kadapa', 'Nellore', 'Tirupati', 'Chittoor', 'Rajampet',
]

/* ---------- Telangana ---------- */
export const TS_DISTRICTS = ['Hyderabad', 'Rangareddy', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam']
export const TS_CONSTITUENCIES = ['Chevella', 'Hyderabad', 'Secunderabad', 'Malkajgiri', 'Zachariah']

/* ---------- Tamil Nadu ---------- */
export const TN_DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem']
export const TN_CONSTITUENCIES = ['Chennai South', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem']

/* ---------- Karnataka ---------- */
export const KA_DISTRICTS = ['Bangalore Urban', 'Mysore', 'Belgaum', 'Gulbarga', 'Dharwad']
export const KA_CONSTITUENCIES = ['Bangalore South', 'Mysore', 'Belgaum', 'Gulbarga', 'Dharwad']

/* ---------- Kerala ---------- */
export const KL_DISTRICTS = ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam']
export const KL_CONSTITUENCIES = ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam']

/* ---------- Maharashtra ---------- */
export const MH_DISTRICTS = ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane']
export const MH_CONSTITUENCIES = ['Mumbai South', 'Pune', 'Nagpur', 'Nashik', 'Thane']

/* ---------- Gujarat ---------- */
export const GJ_DISTRICTS = ['Ahmedabad', 'Vadod', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar']
export const GJ_CONSTITUENCIES = ['Ahmedabad West', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar']

/* ---------- West Bengal ---------- */
export const WB_DISTRICTS = ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly']
export const WB_CONSTITUENCIES = ['Kolkata North', 'Kolkata South', 'Howrah', 'Hooghly', 'Burdwan']

/* ---------- Odisha ---------- */
export const OD_DISTRICTS = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Rourkela', 'Balasore']
export const OD_CONSTITUENCIES = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Rourkela', 'Balasore']

/* ---------- Punjab ---------- */
export const PB_DISTRICTS = ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda']
export const PB_CONSTITUENCIES = ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda']

/* ---------- Rajasthan ---------- */
export const RJ_DISTRICTS = ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner', 'Ajmer']
export const RJ_CONSTITUENCIES = ['Jaipur', 'Jodhpur', 'Udaipur', 'Bikaner', 'Ajmer']

/* ---------- Bihar ---------- */
export const BH_DISTRICTS = ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga']
export const BH_CONSTITUENCIES = ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga']

/* ---------- Uttar Pradesh ---------- */
export const UP_DISTRICTS = ['Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Meerut']
export const UP_CONSTITUENCIES = ['Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj', 'Meerut']

/* ---------- Delhi ---------- */
export const DL_DISTRICTS = ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi']
export const DL_CONSTITUENCIES = ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi']

/* ---------- Jammu and Kashmir ---------- */
export const JK_DISTRICTS = ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur']
export const JK_CONSTITUENCIES = ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur']

/* Helper functions */
export function getLanguagesForState(state) {
  return STATE_LANGUAGES[state] || ['English', 'Hindi']
}

export function getDistrictsForState(state) {
  switch (state) {
    case 'Andhra Pradesh': return AP_DISTRICTS
    case 'Telangana': return TS_DISTRICTS
    case 'Tamil Nadu': return TN_DISTRICTS
    case 'Karnataka': return KA_DISTRICTS
    case 'Kerala': return KL_DISTRICTS
    case 'Maharashtra': return MH_DISTRICTS
    case 'Gujarat': return GJ_DISTRICTS
    case 'West Bengal': return WB_DISTRICTS
    case 'Odisha': return OD_DISTRICTS
    case 'Punjab': return PB_DISTRICTS
    case 'Rajasthan': return RJ_DISTRICTS
    case 'Bihar': return BH_DISTRICTS
    case 'Uttar Pradesh': return UP_DISTRICTS
    case 'Delhi': return DL_DISTRICTS
    case 'Jammu and Kashmir': return JK_DISTRICTS
    default: return null
  }
}

export function getConstituenciesForState(state) {
  switch (state) {
    case 'Andhra Pradesh': return AP_CONSTITUENCIES
    case 'Telangana': return TS_CONSTITUENCIES
    case 'Tamil Nadu': return TN_CONSTITUENCIES
    case 'Karnataka': return KA_CONSTITUENCIES
    case 'Kerala': return KL_CONSTITUENCIES
    case 'Maharashtra': return MH_CONSTITUENCIES
    case 'Gujarat': return GJ_CONSTITUENCIES
    case 'West Bengal': return WB_CONSTITUENCIES
    case 'Odisha': return OD_CONSTITUENCIES
    case 'Punjab': return PB_CONSTITUENCIES
    case 'Rajasthan': return RJ_CONSTITUENCIES
    case 'Bihar': return BH_CONSTITUENCIES
    case 'Uttar Pradesh': return UP_CONSTITUENCIES
    case 'Delhi': return DL_CONSTITUENCIES
    case 'Jammu and Kashmir': return JK_CONSTITUENCIES
    default: return null
  }
}