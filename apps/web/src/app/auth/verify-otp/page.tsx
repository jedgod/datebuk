'use client';

import { useState } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiEndpoint } from '@/lib/config';

export default function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const [otp, setOtp] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = searchParams?.get('userId') ?? '';
  const tempToken = searchParams?.get('tempToken') ?? '';
  const nextPath = searchParams?.get('next') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = useBackupCode
        ? apiEndpoint('/auth/verify-backup-code')
        : apiEndpoint('/auth/verify-otp');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId || '',
          'X-Temp-Token': tempToken || '',
        },
        body: JSON.stringify({
          code: otp,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Invalid code');
      }

      const data = await res.json();

      // Set auth token and redirect
      setTokens(data.accessToken, data.refreshToken, data.userId || userId);

      // Check if password needs to be changed
      if (data.mustChangePassword) {
        router.push('/auth/change-password');
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Identity</h1>
          <p className="text-gray-600">
            {useBackupCode
              ? 'Enter a backup code'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 999 : 6))}
              placeholder={useBackupCode ? '00000000' : '000000'}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < (useBackupCode ? 6 : 6)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Backup Code Toggle */}
        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setOtp('');
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
          <p>Can't verify your identity? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
