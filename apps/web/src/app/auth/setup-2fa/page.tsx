'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { apiEndpoint } from '@/lib/config';

export default function Setup2FA() {
  const router = useRouter();
  const { userId, accessToken } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<'setup' | 'verify' | 'done'>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSetup();
  }, []);

  const generateSetup = async () => {
    try {
      const res = await fetch(apiEndpoint(`/admin/staff/${userId}/2fa/setup`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error('Failed to generate 2FA setup');

      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating setup');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint(`/admin/staff/${userId}/2fa/enable`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          secret,
          otpToken,
          backupCodes,
        }),
      });

      if (!res.ok) throw new Error('Invalid OTP token');

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Enable Two-Factor Authentication
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 border-2 border-gray-300 rounded" />
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Can't scan? Enter this code manually:</p>
              <p className="text-lg font-mono font-bold text-center text-gray-900 break-all">{secret}</p>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg transition font-medium"
            >
              Next: Verify Code
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                value={otpToken}
                onChange={e => setOtpToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpToken.length !== 6}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl text-green-500 mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">2FA Enabled!</h2>
              <p className="text-gray-600">Your account is now more secure</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-yellow-900 mb-3">Save Your Backup Codes</p>
              <p className="text-xs text-yellow-700 mb-3">
                Save these codes in a safe place. You can use them if you lose access to your authenticator.
              </p>
              <div className="space-y-1 font-mono text-sm text-gray-900 bg-white p-3 rounded">
                {backupCodes.map(code => (
                  <p key={code}>{code}</p>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = backupCodes.join('\n');
                  navigator.clipboard.writeText(text);
                  alert('Backup codes copied!');
                }}
                className="mt-3 w-full text-sm text-yellow-700 hover:text-yellow-900 font-medium"
              >
                Copy All Codes
              </button>
            </div>

            <button
              onClick={() => router.push('/staff-dashboard')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg transition font-medium"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
