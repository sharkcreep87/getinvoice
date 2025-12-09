'use client'

import { useRef, useEffect, useState } from 'react'

export type LordIconTrigger = 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang'
export type LordIconColors = {
  primary?: string
  secondary?: string
}

export type LordIconProps = {
  src: string
  trigger?: LordIconTrigger
  colors?: LordIconColors
  size?: number
  delay?: number
  className?: string
}

export function LordIcon({
  src,
  trigger = 'hover',
  colors,
  size = 32,
  delay,
  className = '',
}: LordIconProps) {
  const iconRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Check if lordicon is loaded
    const checkLordIconLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).lottie) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    // Try immediately
    if (checkLordIconLoaded()) {
      return
    }

    // Poll for lordicon to load (max 5 seconds)
    let attempts = 0
    const maxAttempts = 50 // 50 * 100ms = 5 seconds
    const interval = setInterval(() => {
      attempts++
      if (checkLordIconLoaded()) {
        clearInterval(interval)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        setHasError(true)
        console.warn('LordIcon library failed to load after 5 seconds')
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const colorString = colors
    ? `primary:${colors.primary || '#121331'},secondary:${colors.secondary || '#121331'}`
    : 'primary:#ffffff,secondary:#e0e0e0'

  // Don't render until loaded or if there's an error
  if (!isLoaded || hasError) {
    return <div style={{ width: `${size}px`, height: `${size}px` }} className={className} />
  }

  // Safely render the icon
  try {
    return (
      <lord-icon
        ref={iconRef}
        src={src}
        trigger={trigger}
        colors={colorString}
        style={{ width: `${size}px`, height: `${size}px` }}
        delay={delay}
        className={className}
      />
    )
  } catch (error) {
    console.error('Failed to render LordIcon:', error)
    return <div style={{ width: `${size}px`, height: `${size}px` }} className={className} />
  }
}

// Common Lordicon sources from their library
export const LordIcons = {
  // Loading & Status
  loading: 'https://cdn.lordicon.com/xjovhxra.json', // Paper loading animation
  spinner: 'https://cdn.lordicon.com/xjovhxra.json',
  check: 'https://cdn.lordicon.com/oqdmuxru.json',
  checkCircle: 'https://cdn.lordicon.com/lomfljuq.json',
  error: 'https://cdn.lordicon.com/ygvjgdmk.json',
  alert: 'https://cdn.lordicon.com/keaiyjcx.json',
  info: 'https://cdn.lordicon.com/dxjqoygy.json',

  // Navigation
  home: 'https://cdn.lordicon.com/cnbtmyrt.json',
  menu: 'https://cdn.lordicon.com/eouimtlu.json',
  close: 'https://cdn.lordicon.com/nqtddedc.json',
  arrowLeft: 'https://cdn.lordicon.com/zmkotitn.json',
  arrowRight: 'https://cdn.lordicon.com/xzksbhzh.json',
  chevronDown: 'https://cdn.lordicon.com/rxufjlal.json',
  chevronUp: 'https://cdn.lordicon.com/pndvjfqy.json',

  // Actions
  search: 'https://cdn.lordicon.com/kkvxgpti.json',
  plus: 'https://cdn.lordicon.com/jgnvfzqg.json',
  edit: 'https://cdn.lordicon.com/wuvorxbv.json',
  trash: 'https://cdn.lordicon.com/skkahier.json',
  download: 'https://cdn.lordicon.com/qhgmphtg.json',
  upload: 'https://cdn.lordicon.com/smwmetfi.json',
  save: 'https://cdn.lordicon.com/dangivhk.json',
  copy: 'https://cdn.lordicon.com/iykoybtf.json',
  link: 'https://cdn.lordicon.com/nocovwne.json',
  external: 'https://cdn.lordicon.com/zxvuvcnc.json',

  // Business & Finance
  invoice: 'https://cdn.lordicon.com/zfmypahu.json',
  receipt: 'https://cdn.lordicon.com/slkvcfos.json',
  dollar: 'https://cdn.lordicon.com/qhviklyi.json',
  creditCard: 'https://cdn.lordicon.com/qhviklyi.json',
  chart: 'https://cdn.lordicon.com/qhgmphtg.json',
  trendingUp: 'https://cdn.lordicon.com/yxyampao.json',
  trendingDown: 'https://cdn.lordicon.com/spbwqzeh.json',

  // Communication
  mail: 'https://cdn.lordicon.com/rhvddzym.json',
  message: 'https://cdn.lordicon.com/zpxybbhl.json',
  whatsapp: 'https://cdn.lordicon.com/shhcyvng.json',
  phone: 'https://cdn.lordicon.com/srsgifqc.json',

  // E-commerce
  shoppingCart: 'https://cdn.lordicon.com/mqdkoaef.json',
  package: 'https://cdn.lordicon.com/ayhtotha.json',
  tag: 'https://cdn.lordicon.com/dqunxasp.json',

  // Users
  user: 'https://cdn.lordicon.com/bhfjfgqf.json',
  users: 'https://cdn.lordicon.com/dxjqoygy.json',
  userPlus: 'https://cdn.lordicon.com/dqunxasp.json',

  // Files & Documents
  file: 'https://cdn.lordicon.com/whrxobsb.json',
  folder: 'https://cdn.lordicon.com/dwoxxgps.json',
  fileText: 'https://cdn.lordicon.com/ajkxzzfb.json',
  image: 'https://cdn.lordicon.com/egiwmiit.json',

  // Settings & Controls
  settings: 'https://cdn.lordicon.com/hwuyodym.json',
  filter: 'https://cdn.lordicon.com/bzzqgwlz.json',
  sliders: 'https://cdn.lordicon.com/lecprnjb.json',
  eye: 'https://cdn.lordicon.com/dicvhxpz.json',
  eyeOff: 'https://cdn.lordicon.com/fmjvulyw.json',

  // Time & Calendar
  clock: 'https://cdn.lordicon.com/kbtmbyzy.json',
  calendar: 'https://cdn.lordicon.com/wmwqvixz.json',

  // Misc
  bell: 'https://cdn.lordicon.com/lznlxwtc.json',
  star: 'https://cdn.lordicon.com/zyzoecaw.json',
  heart: 'https://cdn.lordicon.com/ulnswmkk.json',
  lock: 'https://cdn.lordicon.com/kzygaohd.json',
  unlock: 'https://cdn.lordicon.com/wmlleaaf.json',
  shield: 'https://cdn.lordicon.com/fihkmkwt.json',
  refresh: 'https://cdn.lordicon.com/tmqaflqo.json',
  qrcode: 'https://cdn.lordicon.com/wloilxuq.json',
}

// Declare lordicon web component for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': any
    }
  }
}
