'use client'

import { LandingHeader } from '@/features/landing/components/LandingHeader'
import { Hero } from '@/features/landing/components/Hero'
import { BentoGrid } from '@/features/landing/components/BentoGrid'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2FBE0]">
        <div className="w-8 h-8 border-4 border-[#4F6A35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F2FBE0] selection:bg-[#C8D9A9] selection:text-[#3C5230]">
      <LandingHeader />
      
      <main className="flex-1">
        <Hero />
        <BentoGrid />

        {/* The Final Call CTA */}
        <section className="bg-[#F2FBE0] py-24 sm:py-32">
          <div className="container mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Empieza a construir tu tranquilidad financiera hoy.
            </h2>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/login"
                className="rounded-xl bg-[#4F6A35] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3C5230] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F6A35] transition-all font-medium"
              >
                Crear tu cuenta
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
