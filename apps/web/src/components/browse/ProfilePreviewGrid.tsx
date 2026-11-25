"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { PreviewProfile } from "@/lib/data/profiles";

type ProfilePreviewGridProps = {
  profiles: PreviewProfile[];
  intent?: string | null;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

export function ProfilePreviewGrid({ profiles, intent }: ProfilePreviewGridProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          People you might like
        </h2>
        {intent ? (
          <p className="mt-3 text-lg text-muted-foreground">
            Filtered for {intent.toLowerCase()} connections
          </p>
        ) : null}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            variants={item}
            whileHover={{ scale: 1.04, transition: { duration: 0.3 } }}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-lg cursor-pointer"
            onClick={() => router.push("/signup")}
          >
            <Image
              src={profile.photo}
              alt={`${profile.name || "User"} profile`}
              fill
              className="object-cover transition-all duration-700"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <p className="font-semibold text-lg drop-shadow-md">
                {profile.name || "User"}, {profile.age || "?"}
              </p>
              {profile.location ? (
                <p className="text-sm text-gray-200 drop-shadow">
                  {profile.location}
                </p>
              ) : null}
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 shadow-lg shadow-purple-500/30 px-8 py-6 text-lg"
              >
                Join to view
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="text-center mt-12">
        <Button
          size="lg"
          className="text-lg px-10 py-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 shadow-xl shadow-purple-500/30"
          onClick={() => router.push("/signup")}
        >
          Join Free to See More
        </Button>
      </div>
    </div>
  );
}
