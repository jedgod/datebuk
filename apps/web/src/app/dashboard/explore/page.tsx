'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import Link from 'next/link'
import { LogOut, Home as HomeIcon, Heart, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { EnterpriseSidebar } from '@/components/dashboard/EnterpriseSidebar'
import { MobileEnterpriseDrawer } from '@/components/dashboard/MobileEnterpriseDrawer'
import { api, ApiError } from '@/lib/api'

// Explore re-confirms identity with a password once per browser session, not on every
// visit to the page — without this, navigating away and back (or a re-render) would
// re-prompt every single time, which is what was actually happening before this flag
// existed (isVerified was component-local state with nothing backing it).
const EXPLORE_VERIFIED_KEY = 'datepage.explore.verified.v1'

type Candidate = {
  id: string
  displayName: string
  age: number | null
  bio: string | null
  photo: string | null
  location: { city?: string } | null
}

export default function ExplorePage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useRequireAuth('/dashboard/explore')
  // Read synchronously at mount time (not in a useEffect) so an already-verified visit
  // never paints the password gate at all, even for a flash — a client-side navigation
  // within the app (clicking the Explore link) mounts this component directly in the
  // browser, where sessionStorage is available immediately, so this runs before the
  // first paint rather than after it.
  const [isVerified, setIsVerified] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(EXPLORE_VERIFIED_KEY) === '1'
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState<Candidate[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isVerified || !accessToken) return
    (async () => {
      try {
        const data = await api.get<Candidate[]>('/swipes/recommendations?limit=60', accessToken)
        setProfiles(data)
      } catch (err) {
        console.error('Failed to load profiles:', err)
      } finally {
        setProfilesLoading(false)
      }
    })()
  }, [isVerified, accessToken])

  const handlePasswordVerification = async () => {
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    if (!accessToken) {
      setError('Session expired. Please sign in again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/auth/verify-password', { password }, accessToken)
      setIsVerified(true)
      setPassword('')
      sessionStorage.setItem(EXPLORE_VERIFIED_KEY, '1')
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401 || err.status === 403)) {
        setError('Invalid password. Please try again.')
      } else {
        setError('Verification service is temporarily unavailable. Please try again shortly.')
      }
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem(EXPLORE_VERIFIED_KEY)
    router.push('/logout')
  }

  const toggleLike = async (candidate: Candidate) => {
    if (!accessToken || likedIds.has(candidate.id)) return
    setLikedIds((prev) => new Set(prev).add(candidate.id))
    try {
      await api.post('/swipes', { toId: candidate.id, action: 'like' }, accessToken)
    } catch (err) {
      console.error('Failed to like profile:', err)
      setLikedIds((prev) => {
        const next = new Set(prev)
        next.delete(candidate.id)
        return next
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: 'You' }} />
        <EnterpriseSidebar user={{ name: 'You' }} />

        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-pink-200 bg-white/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <HomeIcon className="h-6 w-6 text-pink-600" />
                <span className="text-xl font-extrabold text-gray-900">DateBuk</span>
              </Link>

              <div className="flex items-center gap-3">
                <Button onClick={handleLogout} variant="outline" className="hidden md:flex items-center gap-2 text-gray-900">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Password Verification Modal */}
          <AnimatePresence>
            {!isVerified && (
              <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          >
              <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border-2 border-pink-200 p-8"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-pink-600/10 p-4 rounded-full">
                  <Lock className="h-8 w-8 text-pink-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Verify Identity
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Please enter your password to explore profiles
              </p>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
                className="w-full px-4 py-3 rounded-lg border-2 border-pink-300 text-gray-900 text-base focus:outline-none focus:border-pink-600 mb-4"
                disabled={loading}
              />

              {error && (
                <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
              )}

              <Button
                onClick={handlePasswordVerification}
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-semibold"
              >
                {loading ? 'Verifying...' : 'Unlock Gallery'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                This ensures only verified members can access our profiles
              </p>
              </motion.div>
            </motion.div>
            )}
          </AnimatePresence>

          {/* Gallery Content */}
          {isVerified && (
            <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Profiles</h1>
            <p className="text-gray-600">
              {profilesLoading ? 'Loading…' : `Browse ${profiles.length} profile${profiles.length === 1 ? '' : 's'} from our community`}
            </p>
          </div>

          {!profilesLoading && profiles.length === 0 && (
            <div className="rounded-2xl border-2 border-pink-200 bg-white p-12 text-center">
              <p className="text-gray-600">No new profiles to show right now — check back soon.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {profiles.map((profile, idx) => (
              <motion.div
                key={profile.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="group relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 aspect-square shadow-md hover:shadow-xl transition-all hover:scale-105"
              >
                {profile.photo ? (
                  <Image
                    src={profile.photo}
                    alt={profile.displayName}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500 text-sm">No photo</div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <button
                    title={likedIds.has(profile.id) ? 'Unlike profile' : 'Like profile'}
                    onClick={() => toggleLike(profile)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <div className={`p-3 rounded-full ${
                      likedIds.has(profile.id)
                        ? 'bg-pink-600 text-white'
                        : 'bg-white/90 text-pink-600'
                    } hover:scale-110 transition-transform`}>
                      <Heart
                        size={20}
                        fill={likedIds.has(profile.id) ? 'currentColor' : 'none'}
                      />
                    </div>
                  </button>
                </div>

                {/* Name label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-semibold truncate">
                    {profile.displayName}{profile.age ? `, ${profile.age}` : ''}
                  </p>
                </div>

                {/* Like indicator */}
                {likedIds.has(profile.id) && (
                  <div className="absolute top-2 left-2 bg-pink-600 rounded-full p-1">
                    <Heart size={16} fill="white" className="text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Stats Footer */}
          <div className="mt-12 py-6 bg-white rounded-2xl border-2 border-pink-200 text-center">
            <p className="text-gray-900 font-semibold">
              You've liked <span className="text-pink-600 font-bold text-lg">{likedIds.size}</span> profiles
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Keep exploring to find your perfect match!
            </p>
          </div>
            </main>
          )}
        </div>
      </div>
    </div>
  )
}
