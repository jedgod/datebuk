'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiEndpoint } from '@/lib/config';

type SetupData = { secret: string; qrCode: string; backupCodes: string[]; manualEntry?: string };

export default function SetupMfaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useAuth();
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tempToken = searchParams?.get('tempToken') ?? '';
  const nextPath = searchParams?.get('next') || '/staff';

  useEffect(() => {
    if (!tempToken) {
      setError('Missing or expired login session. Please sign in again.');
      return;
    }
    fetch(apiEndpoint('/auth/mfa/setup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Temp-Token': tempToken },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).message || 'Could not start MFA setup');
        return res.json();
      })
      .then(setSetupData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not start MFA setup'));
  }, [tempToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint('/auth/mfa/setup/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Temp-Token': tempToken },
        body: JSON.stringify({ secret: setupData.secret, otpToken: otp, backupCodes: setupData.backupCodes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid code');
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken, data.userId);
      router.push(data.mustChangePassword ? '/auth/change-password' : nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Multi-Factor Authentication</h1>
          <p className="text-gray-600">
            Staff and admin accounts require an authenticator app before you can sign in.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {!setupData ? (
          <p className="text-center text-gray-500">Preparing setup…</p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setupData.qrCode} alt="Authenticator QR code" className="w-48 h-48 border rounded-lg" />
              <p className="text-xs text-gray-500 text-center break-all">
                Can't scan it? Enter this manually: <span className="font-mono">{setupData.secret}</span>
              </p>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Save these backup codes — each works once if you lose your device:
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-900 mb-3">
                {setupData.backupCodes.map((code) => (
                  <span key={code}>{code}</span>
                ))}
              </div>
              <label className="flex items-center gap-2 text-xs text-amber-900">
                <input
                  type="checkbox"
                  checked={codesAcknowledged}
                  onChange={(e) => setCodesAcknowledged(e.target.checked)}
                />
                I've saved these backup codes somewhere safe
              </label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Enter the 6-digit code from your app to confirm</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || !codesAcknowledged}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? 'Confirming…' : 'Confirm and Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
