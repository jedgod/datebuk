/**
 * Security Challenge Component
 * Displays when risk assessment requires additional verification
 */

'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/hooks/SecurityContext';

interface SecurityChallengeProps {
  onChallengeResolved: () => void;
  onChallengeFailed: () => void;
}

export function SecurityChallenge({
  onChallengeResolved,
  onChallengeFailed,
}: SecurityChallengeProps) {
  const { verifySms, smsVerifying, smsError } = useSecurity();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic phone validation
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      const sent = await verifySms(phone, 'send');
      if (sent) {
        setStage('code');
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length < 4) {
      setError('Please enter a valid code');
      return;
    }

    try {
      const verified = await verifySms(phone, code);
      if (verified) {
        onChallengeResolved();
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Security Verification</h2>
        <p className="text-gray-600 mb-6">
          We detected unusual activity. Please verify your identity.
        </p>

        {stage === 'phone' ? (
          <form onSubmit={handleSendCode}>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={smsVerifying}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {smsError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {smsError}
              </div>
            )}

            <button
              type="submit"
              disabled={smsVerifying}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {smsVerifying ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Enter the code sent to {phone}
              </p>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                disabled={smsVerifying}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {smsError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {smsError}
              </div>
            )}

            <button
              type="submit"
              disabled={smsVerifying}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {smsVerifying ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStage('phone');
                setCode('');
                setError(null);
              }}
              className="w-full mt-2 text-blue-500 hover:text-blue-600 font-medium py-2"
            >
              Change Number
            </button>
          </form>
        )}

        <button
          onClick={onChallengeFailed}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 font-medium py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
