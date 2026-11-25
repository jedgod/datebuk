'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { EnterpriseSidebar } from '@/components/dashboard/EnterpriseSidebar'
import { MobileEnterpriseDrawer } from '@/components/dashboard/MobileEnterpriseDrawer'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth'

export default function ProfilePage() {
  const { isAuthenticated } = useRequireAuth('/dashboard/profile')
  const { accessToken, refresh } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    ;(async () => {
      try {
        const token = accessToken ?? (await refresh())
        if (!token) return
        const me = await api.get<any>('/api/users/me', token)
        setProfile(me ?? null)
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
    })()
  }, [isAuthenticated, accessToken, refresh])

  async function save() {
    setBusy(true)
    setSaved(false)
    try {
      const token = accessToken ?? (await refresh())
      if (!token) return
      const updated = await api.patch<any>('/api/profiles/me', profile, token)
      setProfile(updated)
      setSaved(true)
    } catch (e) {
      console.error('Failed to save profile:', e)
    } finally {
      setBusy(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 text-white">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: 'You' }} />
        <EnterpriseSidebar user={{ name: 'You' }} />

        <main className="flex-1 p-6 lg:p-12">
          <div className="min-h-screen bg-gradient-to-br from-[#1b102c] via-[#12091f] to-black p-8">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-semibold text-pink-400 mb-4">My Profile</h1>
                <p className="text-white/60">Update your profile to attract better matches</p>
              </div>

              <div className="rounded-[28px] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-8">
                {!profile ? (
                  <p className="text-white/70 text-center">Loading profile…</p>
                ) : (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Display name</label>
                      <input
                        className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        value={profile.displayName ?? ''}
                        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Age</label>
                      <input
                        type="number"
                        className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        value={String(profile.age ?? 18)}
                        onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Bio</label>
                      <textarea
                        className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400 min-h-[100px]"
                        value={profile.bio ?? ''}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={save}
                        disabled={busy}
                        className="rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-60 px-6 py-2.5 font-semibold text-white transition-colors"
                      >
                        {busy ? 'Saving…' : 'Save changes'}
                      </button>
                      {saved && <span className="text-sm text-green-400">Saved</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
