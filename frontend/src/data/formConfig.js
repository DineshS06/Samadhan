/** 22 Scheduled + English + 10 additional = 33 Indian languages */
export const INDIAN_LANGUAGES = [
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ks', name: 'Kashmiri', native: 'कॉशुर' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी' },
  { code: 'raj', name: 'Rajasthani', native: 'राजस्थानी' },
  { code: 'hry', name: 'Haryanvi', native: 'हरियाणवी' },
  { code: 'tcy', name: 'Tulu', native: 'ತುಳು' },
  { code: 'mni2', name: 'Mizo', native: 'Mizo ṭawng' },
  { code: 'kha', name: 'Khasi', native: 'Ka Ktien Khasi' },
  { code: 'kokb', name: 'Kokborok', native: 'Kokborok' },
  { code: 'mag', name: 'Magahi', native: 'मगही' },
  { code: 'other', name: 'Other Indian Language', native: 'अन्य भाषा' },
]

export const CATEGORIES = [
  { id: 'roads', label: 'Roads & Connectivity', icon: '🛣️', desc: 'Potholes, broken roads, bridges, street lights' },
  { id: 'water', label: 'Water & Sanitation', icon: '💧', desc: 'Drinking water, drainage, toilets, sewage' },
  { id: 'health', label: 'Health & Medical', icon: '🏥', desc: 'Hospitals, PHC, ambulance, medicines' },
  { id: 'education', label: 'Education & Schools', icon: '📚', desc: 'Schools, colleges, scholarships, buses' },
  { id: 'power', label: 'Electricity & Power', icon: '⚡', desc: 'Power cuts, transformers, street lighting' },
  { id: 'housing', label: 'Housing & Slums', icon: '🏠', desc: 'Housing schemes, slum rehabilitation' },
  { id: 'agri', label: 'Agriculture & Irrigation', icon: '🌾', desc: 'Canals, crops, MSP, farmer support' },
  { id: 'employment', label: 'Employment & Livelihood', icon: '💼', desc: 'Jobs, skill training, NREGA' },
  { id: 'safety', label: 'Law & Order / Safety', icon: '🛡️', desc: 'Crime, harassment, police response' },
  { id: 'environment', label: 'Environment & Pollution', icon: '🌿', desc: 'Air/water pollution, waste dumping' },
  { id: 'transport', label: 'Public Transport', icon: '🚌', desc: 'Bus service, railway connectivity' },
  { id: 'other', label: 'Other', icon: '📋', desc: 'Any other constituency development issue' },
]

export const CHANNELS = [
  { id: 'web', label: 'Direct Web Portal', icon: '🌐' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'phone', label: 'Phone / IVR', icon: '📞' },
  { id: 'twitter', label: 'Social Media (X)', icon: '📱' },
  { id: 'meeting', label: 'Public Meeting / Gram Sabha', icon: '🏛️' },
  { id: 'letter', label: 'Written Letter / Petition', icon: '✉️' },
]

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
]

export const SEVERITY_OPTIONS = [
  { value: 1, label: 'Low', desc: 'Minor inconvenience' },
  { value: 2, label: 'Moderate', desc: 'Occasional difficulty' },
  { value: 3, label: 'Significant', desc: 'Recurring hardship' },
  { value: 4, label: 'Serious', desc: 'Major community impact' },
  { value: 5, label: 'Critical', desc: 'Life/safety emergency' },
]

export const STEPS = [
  { id: 1, title: 'Your Details', desc: 'Language & contact' },
  { id: 2, title: 'Issue Category', desc: 'Type of problem' },
  { id: 3, title: 'Location', desc: 'Where it happened' },
  { id: 4, title: 'Describe Issue', desc: 'Tell us more' },
]

export const SAMPLE_BY_LANGUAGE = {
  Hindi: 'Hamare gaon mein sadak bahut kharab hai, barish mein gaadi nahi chal paati.',
  Telugu: 'Ma oorlo drinking water problem undi, roju 2 km walk cheyalsi vastundi.',
  Tamil: 'எங்கள் ஊரில் மருத்துவமனை இல்லை, அவசர சிகிச்சைக்கு 20 km செல்ல வேண்டும்.',
  Bengali: 'আমাদের ওয়ার্ডে স্কুল নেই, শিশুরা 5 কিমি হেঁটে যায়।',
  English: 'No ambulance at our PHC — emergency patients travel 18 km to district hospital.',
}
