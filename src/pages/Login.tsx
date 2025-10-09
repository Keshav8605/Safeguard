import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'
import PhoneAuth from '@/components/auth/PhoneAuth'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-xl bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{t('auth.login')}</h1>
        <LoginForm onSuccess={() => navigate('/dashboard')} />
        <div className="mt-8">
          <PhoneAuth onVerified={() => navigate('/dashboard')} />
        </div>
      </div>
    </div>
  )
}

