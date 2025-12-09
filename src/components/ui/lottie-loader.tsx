'use client'

import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

type LottieLoaderProps = {
  size?: number
  className?: string
}

export function LottieLoader({ size = 32, className = '' }: LottieLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Paper loading animation
    const animation = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'https://lottie.host/4db68bbd-31f6-4cd8-b6e5-2a34cbb3091e/RPKhcCb1r7.json' // Paper animation
    })

    return () => {
      animation.destroy()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}
