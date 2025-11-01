'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth-state'
import { FirebaseAuthService } from '@/lib/firebase-auth'
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function PhoneLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('+91 ')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [errors, setErrors] = useState<{ phone?: string; otp?: string; general?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const recaptchaRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const { setAuthenticated } = useAuth()

  // Initialize reCAPTCHA
  useEffect(() => {
    if (auth && recaptchaRef.current && step === 'phone') {
      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA verified')
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired')
          }
        })
        setRecaptchaVerifier(verifier)
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error)
      }
    }

    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [auth, step])

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone number validation (international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone.replace(/\s+/g, ''))
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Validation
    if (!phoneNumber) {
      setErrors({ phone: 'Phone number is required' })
      setIsLoading(false)
      return
    }

    // Phone number already has +91 prefix - remove spaces for Firebase
    const normalizedPhone = phoneNumber.replace(/\s+/g, '').trim()

    if (!validatePhoneNumber(normalizedPhone)) {
      setErrors({ phone: 'Please enter a valid 10-digit phone number' })
      setIsLoading(false)
      return
    }

    try {
      if (!recaptchaVerifier) {
        throw new Error('reCAPTCHA not initialized')
      }

      const confirmation = await FirebaseAuthService.sendPhoneOTP(normalizedPhone, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Validation
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' })
      setIsLoading(false)
      return
    }

    if (!confirmationResult) {
      setErrors({ general: 'OTP session expired. Please request a new OTP' })
      setIsLoading(false)
      setStep('phone')
      return
    }

    try {
      const profile = await FirebaseAuthService.verifyPhoneOTP(confirmationResult, otp)
      setAuthenticated(true, profile)
      router.push('/dashboard')
    } catch (error) {
      setErrors({ 
        otp: error instanceof Error ? error.message : 'Invalid OTP. Please try again.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setConfirmationResult(null)
    setErrors({})
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'phone' ? 'Sign in with Phone' : 'Verify OTP'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'phone' 
              ? 'Enter your phone number to receive OTP' 
              : 'Enter the 6-digit OTP sent to your phone'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Phone Number Input */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Ensure +91 is always present
                      let value = e.target.value
                      if (!value.startsWith('+91')) {
                        value = '+91 ' + value.replace(/^\+?\d{0,2}\s*/, '')
                      }
                      setPhoneNumber(value)
                    }}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                  />
                </div>
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-red-600">
                    {errors.phone}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit phone number (country code already added)
                </p>
              </div>

              {/* reCAPTCHA */}
              <div ref={recaptchaRef} id="recaptcha-container"></div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center text-2xl tracking-widest ${
                    errors.otp ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  aria-describedby={errors.otp ? 'otp-error' : undefined}
                />
                {errors.otp && (
                  <p id="otp-error" className="mt-1 text-sm text-red-600">
                    {errors.otp}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>

              {/* Back to Phone */}
              <button
                type="button"
                onClick={handleBackToPhone}
                className="w-full text-amber-600 hover:text-amber-700 py-2 text-sm font-medium"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>

        {/* Back to Email/Password Login */}
        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-gray-600 hover:text-amber-600"
          >
            Sign in with email and password instead
          </a>
        </div>
      </div>
    </div>
  )
}
