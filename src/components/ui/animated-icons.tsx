'use client'

import { LordIcon, LordIcons, type LordIconProps } from './lordicon'

type IconProps = Omit<Partial<LordIconProps>, 'src'> & {
  className?: string
}

// Default colors for dark backgrounds (white icons)
const defaultColors = {
  primary: '#ffffff',
  secondary: '#e0e0e0'
}

// Helper to create icon component
const createIcon = (src: string, defaultSize: number = 24, trigger: any = 'loop-on-hover') => {
  return (props: IconProps) => (
    <LordIcon
      src={src}
      trigger={trigger}
      colors={props.colors || defaultColors}
      size={props.size || defaultSize}
      {...props}
    />
  )
}

// Navigation Icons
export const LayoutDashboard = createIcon(LordIcons.home, 24)
export const Users = createIcon(LordIcons.users, 24)
export const FileText = createIcon(LordIcons.fileText, 24)
export const Settings = createIcon(LordIcons.settings, 24)
export const LogOut = createIcon('https://cdn.lordicon.com/gwvmctbb.json', 24, 'hover')
export const CreditCard = createIcon(LordIcons.creditCard, 24)
export const Building2 = createIcon('https://cdn.lordicon.com/fhtaantg.json', 24)
export const Shield = createIcon(LordIcons.shield, 24)
export const Package = createIcon(LordIcons.package, 24)
export const Calculator = createIcon('https://cdn.lordicon.com/utqytqrt.json', 24)
export const Receipt = createIcon(LordIcons.receipt, 24)
export const ShoppingCart = createIcon(LordIcons.shoppingCart, 24)
export const ShoppingBag = createIcon('https://cdn.lordicon.com/pbrgppbb.json', 24)
export const Wallet = createIcon('https://cdn.lordicon.com/fzbalqiq.json', 24)
export const BarChart3 = createIcon('https://cdn.lordicon.com/qhviklyi.json', 24)

// Chevron Icons
export const ChevronDown = createIcon(LordIcons.chevronDown, 20, 'hover')
export const ChevronRight = createIcon('https://cdn.lordicon.com/wmlleaaf.json', 20, 'hover')
export const ChevronLeft = createIcon(LordIcons.arrowLeft, 20, 'hover')
export const ChevronUp = createIcon(LordIcons.chevronUp, 20, 'hover')

// Loading & Status Icons - PAPER ANIMATION
export const Loader2 = createIcon('https://cdn.lordicon.com/xjovhxra.json', 32, 'loop')
export const Check = createIcon(LordIcons.check, 24, 'hover')
export const CheckCircle = createIcon(LordIcons.checkCircle, 24, 'hover')
export const XCircle = createIcon('https://cdn.lordicon.com/nqtddedc.json', 24, 'hover')
export const AlertCircle = createIcon(LordIcons.alert, 24, 'loop-on-hover')
export const Info = createIcon(LordIcons.info, 24, 'hover')
export const X = createIcon(LordIcons.close, 24, 'hover')

// Action Icons
export const Plus = createIcon(LordIcons.plus, 24, 'hover')
export const Edit = createIcon(LordIcons.edit, 24, 'hover')
export const Trash = createIcon(LordIcons.trash, 24, 'hover')
export const Download = createIcon(LordIcons.download, 24, 'hover')
export const Upload = createIcon(LordIcons.upload, 24, 'hover')
export const Save = createIcon(LordIcons.save, 24, 'hover')
export const Copy = createIcon(LordIcons.copy, 24, 'hover')
export const Search = createIcon(LordIcons.search, 24, 'hover')
export const Filter = createIcon(LordIcons.filter, 24, 'hover')
export const Refresh = createIcon(LordIcons.refresh, 24, 'hover')

// Communication Icons
export const MessageCircle = createIcon(LordIcons.whatsapp, 24, 'loop-on-hover')
export const Mail = createIcon(LordIcons.mail, 24, 'hover')
export const Phone = createIcon(LordIcons.phone, 24, 'loop-on-hover')

// Navigation & UI Icons
export const Menu = createIcon(LordIcons.menu, 24, 'hover')
export const ArrowLeft = createIcon(LordIcons.arrowLeft, 24, 'hover')
export const ArrowRight = createIcon(LordIcons.arrowRight, 24, 'hover')
export const ExternalLink = createIcon(LordIcons.external, 24, 'hover')
export const Link2 = createIcon(LordIcons.link, 24, 'hover')

// View Icons
export const Eye = createIcon(LordIcons.eye, 24, 'hover')
export const EyeOff = createIcon(LordIcons.eyeOff, 24, 'hover')

// Time Icons
export const Calendar = createIcon(LordIcons.calendar, 24, 'hover')
export const Clock = createIcon(LordIcons.clock, 24, 'loop-on-hover')

// Notification Icons
export const Bell = createIcon(LordIcons.bell, 24, 'loop-on-hover')

// Favorite Icons
export const Star = createIcon(LordIcons.star, 24, 'hover')
export const Heart = createIcon(LordIcons.heart, 24, 'hover')

// Security Icons
export const Lock = createIcon(LordIcons.lock, 24, 'hover')
export const Unlock = createIcon(LordIcons.unlock, 24, 'hover')

// Other Icons
export const QrCode = createIcon(LordIcons.qrcode, 24, 'hover')
export const Tag = createIcon(LordIcons.tag, 24, 'hover')
export const Sliders = createIcon(LordIcons.sliders, 24, 'hover')
export const Image = createIcon(LordIcons.image, 24, 'hover')
export const Folder = createIcon(LordIcons.folder, 24, 'hover')
export const File = createIcon(LordIcons.file, 24, 'hover')
export const User = createIcon(LordIcons.user, 24, 'hover')
export const UserPlus = createIcon(LordIcons.userPlus, 24, 'hover')
export const TrendingUp = createIcon(LordIcons.trendingUp, 24, 'loop-on-hover')
export const TrendingDown = createIcon(LordIcons.trendingDown, 24, 'loop-on-hover')
export const DollarSign = createIcon(LordIcons.dollar, 24, 'loop-on-hover')
