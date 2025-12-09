'use client'

import * as LucideIcons from 'lucide-react'
import { PaperLoader } from './paper-loader'

type IconProps = {
  className?: string
  size?: number
}

// Helper to create animated icon component
const createIcon = (Icon: any, animation: string = 'hover:scale-110') => {
  return ({ className = '', size = 24 }: IconProps) => (
    <Icon
      className={`transition-all duration-200 ${animation} ${className}`}
      size={size}
    />
  )
}

// Navigation Icons
export const LayoutDashboard = createIcon(LucideIcons.LayoutDashboard)
export const Users = createIcon(LucideIcons.Users)
export const FileText = createIcon(LucideIcons.FileText)
export const Settings = createIcon(LucideIcons.Settings, 'hover:rotate-90')
export const LogOut = createIcon(LucideIcons.LogOut)
export const CreditCard = createIcon(LucideIcons.CreditCard)
export const Building2 = createIcon(LucideIcons.Building2)
export const Shield = createIcon(LucideIcons.Shield, 'hover:scale-110 hover:text-primary')
export const Package = createIcon(LucideIcons.Package)
export const Calculator = createIcon(LucideIcons.Calculator)
export const Receipt = createIcon(LucideIcons.Receipt)
export const ShoppingCart = createIcon(LucideIcons.ShoppingCart, 'hover:scale-110 hover:-translate-y-1')
export const ShoppingBag = createIcon(LucideIcons.ShoppingBag, 'hover:scale-110 hover:-translate-y-1')
export const Wallet = createIcon(LucideIcons.Wallet)
export const BarChart3 = createIcon(LucideIcons.BarChart3, 'hover:scale-110 hover:text-primary')

// Chevron Icons
export const ChevronDown = createIcon(LucideIcons.ChevronDown, 'transition-transform duration-200')
export const ChevronRight = createIcon(LucideIcons.ChevronRight, 'transition-transform duration-200')
export const ChevronLeft = createIcon(LucideIcons.ChevronLeft, 'transition-transform duration-200')
export const ChevronUp = createIcon(LucideIcons.ChevronUp, 'transition-transform duration-200')

// Loading & Status Icons - PAPER ANIMATION using CSS
export const Loader2 = (props: IconProps) => <PaperLoader size={props.size || 32} className={props.className} />
export const Check = createIcon(LucideIcons.Check, 'hover:scale-125 hover:text-green-500')
export const CheckCircle = createIcon(LucideIcons.CheckCircle, 'hover:scale-110 hover:text-green-500')
export const XCircle = createIcon(LucideIcons.XCircle, 'hover:scale-110 hover:text-red-500')
export const AlertCircle = createIcon(LucideIcons.AlertCircle, 'hover:scale-110 hover:text-yellow-500 animate-pulse')
export const Info = createIcon(LucideIcons.Info, 'hover:scale-110 hover:text-blue-500')
export const X = createIcon(LucideIcons.X, 'hover:scale-110 hover:rotate-90')

// Action Icons
export const Plus = createIcon(LucideIcons.Plus, 'hover:scale-110 hover:rotate-90')
export const Edit = createIcon(LucideIcons.Edit, 'hover:scale-110 hover:-rotate-12')
export const Trash = createIcon(LucideIcons.Trash, 'hover:scale-110 hover:text-red-500')
export const Download = createIcon(LucideIcons.Download, 'hover:scale-110 hover:translate-y-1')
export const Upload = createIcon(LucideIcons.Upload, 'hover:scale-110 hover:-translate-y-1')
export const Save = createIcon(LucideIcons.Save, 'hover:scale-110')
export const Copy = createIcon(LucideIcons.Copy, 'hover:scale-110')
export const Search = createIcon(LucideIcons.Search, 'hover:scale-110')
export const Filter = createIcon(LucideIcons.Filter)
export const Refresh = createIcon(LucideIcons.RefreshCw, 'hover:rotate-180')

// Communication Icons
export const MessageCircle = createIcon(LucideIcons.MessageCircle, 'hover:scale-110 hover:-rotate-12')
export const MessageSquare = createIcon(LucideIcons.MessageSquare, 'hover:scale-110')
export const Mail = createIcon(LucideIcons.Mail, 'hover:scale-110 hover:-rotate-12')
export const Phone = createIcon(LucideIcons.Phone, 'hover:scale-110 hover:rotate-12')

// Navigation & UI Icons
export const Menu = createIcon(LucideIcons.Menu)
export const ArrowLeft = createIcon(LucideIcons.ArrowLeft, 'hover:-translate-x-1')
export const ArrowRight = createIcon(LucideIcons.ArrowRight, 'hover:translate-x-1')
export const ExternalLink = createIcon(LucideIcons.ExternalLink, 'hover:scale-110 hover:-translate-y-1')
export const Link2 = createIcon(LucideIcons.Link2)

// View Icons
export const Eye = createIcon(LucideIcons.Eye, 'hover:scale-110')
export const EyeOff = createIcon(LucideIcons.EyeOff, 'hover:scale-110')

// Time Icons
export const Calendar = createIcon(LucideIcons.Calendar, 'hover:scale-110')
export const Clock = createIcon(LucideIcons.Clock)

// Notification Icons
export const Bell = createIcon(LucideIcons.Bell, 'hover:scale-110 hover:rotate-12 animate-pulse')

// Favorite Icons
export const Star = createIcon(LucideIcons.Star, 'hover:scale-110 hover:rotate-12 hover:text-yellow-500')
export const Heart = createIcon(LucideIcons.Heart, 'hover:scale-110 hover:text-red-500')

// Security Icons
export const Lock = createIcon(LucideIcons.Lock, 'hover:scale-110')
export const Unlock = createIcon(LucideIcons.Unlock, 'hover:scale-110')

// Other Icons
export const QrCode = createIcon(LucideIcons.QrCode, 'hover:scale-110')
export const Tag = createIcon(LucideIcons.Tag)
export const Sliders = createIcon(LucideIcons.Sliders, 'hover:scale-110')
export const Image = createIcon(LucideIcons.Image)
export const Folder = createIcon(LucideIcons.Folder)
export const File = createIcon(LucideIcons.File)
export const User = createIcon(LucideIcons.User, 'hover:scale-110')
export const UserPlus = createIcon(LucideIcons.UserPlus, 'hover:scale-110')
export const TrendingUp = createIcon(LucideIcons.TrendingUp, 'hover:scale-110 hover:-translate-y-1 hover:text-green-500')
export const TrendingDown = createIcon(LucideIcons.TrendingDown, 'hover:scale-110 hover:translate-y-1 hover:text-red-500')
export const DollarSign = createIcon(LucideIcons.DollarSign, 'hover:scale-110 hover:text-green-500')
export const Zap = createIcon(LucideIcons.Zap, 'hover:scale-110 hover:text-yellow-500 animate-pulse')
export const Power = createIcon(LucideIcons.Power, 'hover:scale-110 hover:text-green-500')
export const PowerOff = createIcon(LucideIcons.PowerOff, 'hover:scale-110 hover:text-red-500')
export const RefreshCw = createIcon(LucideIcons.RefreshCw, 'hover:rotate-180')
