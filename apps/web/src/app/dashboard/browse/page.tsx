'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useRevenueCatEntitlements } from '@/hooks/useRevenueCatEntitlements'
import Link from 'next/link'
import { LogOut, Home as HomeIcon, Heart, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { EnterpriseSidebar } from '@/components/dashboard/EnterpriseSidebar'
import { MobileEnterpriseDrawer } from '@/components/dashboard/MobileEnterpriseDrawer'
import { api } from '@/lib/api'

type Candidate = {
  id: string
  displayName: string
  age: number | null
  bio: string | null
  photo: string | null
  location: { city?: string } | null
}

export default function BrowsePage() {
  const router = useRouter()
  const { accessToken, isHydrated, isAuthenticated } = useRequireAuth('/dashboard/browse')
  const { getCurrentTier } = useRevenueCatEntitlements()
  const [profiles, setProfiles] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [matchToast, setMatchToast] = useState<string | null>(null)
  const tier = getCurrentTier()

  useEffect(() => {
    if (!isHydrated || !accessToken) return
    (async () => {
      try {
        const data = await api.get<Candidate[]>('/swipes/recommendations?limit=40', accessToken)
        setProfiles(data)
      } catch (error) {
        console.error('Failed to load recommendations:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [isHydrated, accessToken])

  const handleLogout = () => {
    router.push('/logout')
  }

  const handleLike = async (candidate: Candidate) => {
    if (!accessToken || likedIds.has(candidate.id)) return
    setLikedIds((prev) => new Set(prev).add(candidate.id))
    try {
      const res = await api.post<{ ok: boolean; matched: boolean }>(
        '/swipes',
        { toId: candidate.id, action: 'like' },
        accessToken
      )
      if (res.matched) {
        setMatchToast(`It's a match with ${candidate.displayName}! 🎉`)
        setTimeout(() => setMatchToast(null), 4000)
      }
    } catch (error) {
      console.error('Failed to like profile:', error)
      setLikedIds((prev) => {
        const next = new Set(prev)
        next.delete(candidate.id)
        return next
      })
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 text-gray-900">
      <div className="flex min-h-screen">
        <MobileEnterpriseDrawer user={{ name: 'You' }} />
        <EnterpriseSidebar user={{ name: 'You' }} />

        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-pink-200 bg-white/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <HomeIcon className="h-6 w-6 text-pink-600" />
                <span className="text-xl font-extrabold">DateBuk</span>
              </Link>

              <div className="flex items-center gap-3">
                <Button onClick={handleLogout} variant="outline" className="hidden md:flex items-center gap-2 text-gray-900">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8">
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2 text-gray-900">
                <Sparkles size={28} className="text-pink-600" /> Discover
              </h2>
              <p className="text-gray-600 mb-6">
                {loading ? 'Finding people near you…' : `${profiles.length} profile${profiles.length === 1 ? '' : 's'} to discover`}
              </p>
              <p className="text-xs text-gray-500">Plan: {tier.toUpperCase()}</p>
            </section>

            {!loading && profiles.length === 0 && (
              <div className="rounded-2xl border-2 border-pink-200 bg-white p-12 text-center">
                <p className="text-gray-600">No new profiles to show right now — check back soon.</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {profiles.map((profile, idx) => (
                <motion.div
                  key={profile.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group relative rounded-xl overflow-hidden bg-white border-2 border-pink-200 hover:border-pink-500 shadow-md hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                    {profile.photo ? (
                      <Image
                        src={profile.photo}
                        alt={profile.displayName}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400 text-sm">No photo</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {profile.displayName}{profile.age ? `, ${profile.age}` : ''}
                    </p>
                    {profile.location?.city && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                        <MapPin size={12} /> {profile.location.city}
                      </p>
                    )}
                    {profile.bio && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>}
                  </div>
                  <div className="flex gap-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      disabled={likedIds.has(profile.id)}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs py-1 disabled:opacity-60"
                      onClick={() => handleLike(profile)}
                    >
                      <Heart size={12} fill={likedIds.has(profile.id) ? 'currentColor' : 'none'} />
                      {likedIds.has(profile.id) ? 'Liked' : 'Like'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </main>

          <AnimatePresence>
            {matchToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 right-6 z-50 rounded-xl bg-pink-600 px-6 py-4 text-white shadow-2xl font-semibold"
              >
                {matchToast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
