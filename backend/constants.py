"""Shared constants for Samadhan."""

SCHEDULED_LANGUAGES = [
    "Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi",
    "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri",
    "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi",
    "Tamil", "Telugu", "Urdu",
]

ADDITIONAL_LANGUAGES = [
    "Bhojpuri", "Garhwali", "Haryanvi", "Khasi", "Kokborok", "Kumaoni",
    "Magahi", "Mizo", "Nagamese", "Rajasthani", "Tulu", "Other",
]

ALL_LANGUAGES = SCHEDULED_LANGUAGES + ADDITIONAL_LANGUAGES

CATEGORIES = [
    "Roads & Connectivity",
    "Water & Sanitation",
    "Health & Medical",
    "Education & Schools",
    "Electricity & Power",
    "Housing & Slums",
    "Agriculture & Irrigation",
    "Employment & Livelihood",
    "Law & Order / Safety",
    "Environment & Pollution",
    "Public Transport",
    "Other",
]

CHANNELS = ["whatsapp", "twitter", "meeting", "phone", "letter", "web"]

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

SEVERITY_LABELS = {
    1: "Low — minor inconvenience",
    2: "Moderate — affects daily life occasionally",
    3: "Significant — recurring hardship",
    4: "Serious — major impact on community",
    5: "Critical — life/safety risk or emergency",
}
