import React from 'react'
import { useTranslation } from 'react-i18next'
import { supportedLangs, SupportedLang } from '@/config/i18n'

export default function LanguageGate({ onContinue }: { onContinue: () => void }) {
  const { i18n, t } = useTranslation()

  function choose(code: SupportedLang) {
    i18n.changeLanguage(code)
    try { localStorage.setItem('sg_lang', code) } catch {}
  }

  const current = i18n.language as SupportedLang

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-center mb-6">{t('common.chooseLanguage')}</h1>
        <div className="grid grid-cols-2 gap-4">
          {supportedLangs.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`h-16 rounded-xl border shadow-sm font-semibold ${current.startsWith(l.code) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button onClick={onContinue} className="mt-6 w-full h-11 rounded-md bg-black text-white">{t('common.continue')}</button>
      </div>
    </div>
  )
}


