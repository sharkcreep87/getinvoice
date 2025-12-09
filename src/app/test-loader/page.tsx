'use client'

import { Loader2 } from "@/components/ui/animated-icons"

export default function TestLoaderPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-8">
        <h1 className="text-2xl font-bold text-white">Loading Icon Test</h1>

        <div className="p-8 bg-slate-800 rounded-lg">
          <p className="text-white mb-4">Paper Loader Animation:</p>
          <Loader2 size={64} />
        </div>

        <div className="text-white text-sm">
          <p>If you see a white paper flipping, it works!</p>
          <p className="mt-2 text-gray-400">If you see a spinning circle, cache is stale.</p>
        </div>
      </div>
    </div>
  )
}
