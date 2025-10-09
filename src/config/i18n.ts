import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    common: {
      appName: 'SafeGuard',
      chooseLanguage: 'Choose your language',
      continue: 'Continue',
    },
    auth: {
      login: 'Login',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      or: 'or',
      phoneLogin: 'Login with phone',
    }
  }},
  hi: { translation: { common: { appName: 'सेफगार्ड', chooseLanguage: 'अपनी भाषा चुनें', continue: 'जारी रखें' }, auth: { login: 'लॉगिन', email: 'ईमेल', password: 'पासवर्ड', signIn: 'साइन इन', or: 'या', phoneLogin: 'फोन से लॉगिन' } } },
  bn: { translation: { common: { appName: 'সেইফগার্ড', chooseLanguage: 'আপনার ভাষা নির্বাচন করুন', continue: 'চালিয়ে যান' }, auth: { login: 'লগইন', email: 'ইমেইল', password: 'পাসওয়ার্ড', signIn: 'সাইন ইন', or: 'অথবা', phoneLogin: 'ফোন দিয়ে লগইন' } } },
  te: { translation: { common: { appName: 'సేఫ్ గార్డ్', chooseLanguage: 'మీ భాషను ఎంచుకోండి', continue: 'కొనసాగించండి' }, auth: { login: 'లాగిన్', email: 'ఈమెయిల్', password: 'పాస్‌వర్డ్', signIn: 'సైన్ ఇన్', or: 'లేదా', phoneLogin: 'ఫోన్‌తో లాగిన్' } } },
  ta: { translation: { common: { appName: 'சேஃப்கார்ட்', chooseLanguage: 'உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்', continue: 'தொடரவும்' }, auth: { login: 'உள்நுழை', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', signIn: 'உள்நுழைக', or: 'அல்லது', phoneLogin: 'பேசியின் மூலம் உள்நுழை' } } },
  mr: { translation: { common: { appName: 'सेफगार्ड', chooseLanguage: 'तुमची भाषा निवडा', continue: 'पुढे चला' }, auth: { login: 'लॉगिन', email: 'ईमेल', password: 'पासवर्ड', signIn: 'साइन इन', or: 'किंवा', phoneLogin: 'फोनने लॉगिन' } } },
}

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('sg_lang') : null

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: stored || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
export type SupportedLang = keyof typeof resources
export const supportedLangs: { code: SupportedLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'mr', label: 'मराठी' },
]

