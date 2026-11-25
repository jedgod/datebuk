'use client';

import { useState } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';

export default function ChangePassword() {
  const router = useRouter();
  const { userId, accessToken } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;
    setStrength(score);
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, newPassword: value });
    calculateStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (strength < 3) {
      setError('Password is not strong enough');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiEndpoint(`/admin/staff/${userId}/change-password-first-login`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newPassword: formData.newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to change password');
      }

      alert('Password changed successfully!');
      router.push('/staff-dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">First Login</h1>
          <p className="text-gray-600">Please change your temporary password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Temporary Password
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={e => handlePasswordChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* Password Strength Indicator */}
            <div className="mt-3 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition ${
                      i <= strength ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600">
                {strength < 2 && 'Weak'}
                {strength >= 2 && strength < 4 && 'Fair'}
                {strength >= 4 && 'Strong'}
              </p>
            </div>

            {/* Requirements */}
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li className={formData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                ✓ At least 8 characters
              </li>
              <li className={/[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                ✓ Mix of upper and lowercase
              </li>
              <li className={/\d/.test(formData.newPassword) ? 'text-green-600' : ''}>
                ✓ At least one number
              </li>
              <li className={/[!@#$%^&*]/.test(formData.newPassword) ? 'text-green-600' : ''}>
                ✓ At least one special character
              </li>
            </ul>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {formData.newPassword !== formData.confirmPassword && formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || strength < 3 || formData.newPassword !== formData.confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Changing Password...' : 'Change Password & Continue'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
          <p>Need help? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
