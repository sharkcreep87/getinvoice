'use client'

import { LordIcon, LordIcons, type LordIconProps } from './lordicon'

type IconProps = Omit<Partial<LordIconProps>, 'src'> & {
  className?: string
}

// Create reusable icon components
export const LayoutDashboard = (props: IconProps) => (
  <LordIcon
    src={LordIcons.home}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Users = (props: IconProps) => (
  <LordIcon
    src={LordIcons.users}
    trigger="loop-on-hover"
    {...props}
  />
)

export const FileText = (props: IconProps) => (
  <LordIcon
    src={LordIcons.fileText}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Settings = (props: IconProps) => (
  <LordIcon
    src={LordIcons.settings}
    trigger="loop-on-hover"
    {...props}
  />
)

export const LogOut = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/gwvmctbb.json"
    trigger="hover"
    {...props}
  />
)

export const CreditCard = (props: IconProps) => (
  <LordIcon
    src={LordIcons.creditCard}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Building2 = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/fhtaantg.json"
    trigger="loop-on-hover"
    {...props}
  />
)

export const Shield = (props: IconProps) => (
  <LordIcon
    src={LordIcons.shield}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Package = (props: IconProps) => (
  <LordIcon
    src={LordIcons.package}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Calculator = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/utqytqrt.json"
    trigger="loop-on-hover"
    {...props}
  />
)

export const Receipt = (props: IconProps) => (
  <LordIcon
    src={LordIcons.receipt}
    trigger="loop-on-hover"
    {...props}
  />
)

export const ShoppingCart = (props: IconProps) => (
  <LordIcon
    src={LordIcons.shoppingCart}
    trigger="loop-on-hover"
    {...props}
  />
)

export const ChevronDown = (props: IconProps) => (
  <LordIcon
    src={LordIcons.chevronDown}
    trigger="hover"
    {...props}
  />
)

export const ChevronRight = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/wmlleaaf.json"
    trigger="hover"
    {...props}
  />
)

export const ShoppingBag = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/pbrgppbb.json"
    trigger="loop-on-hover"
    {...props}
  />
)

export const Wallet = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/fzbalqiq.json"
    trigger="loop-on-hover"
    {...props}
  />
)

export const BarChart3 = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/qhviklyi.json"
    trigger="loop-on-hover"
    {...props}
  />
)

export const Loader2 = (props: IconProps) => (
  <LordIcon
    src={LordIcons.loading}
    trigger="loop"
    {...props}
  />
)

export const Check = (props: IconProps) => (
  <LordIcon
    src={LordIcons.check}
    trigger="hover"
    {...props}
  />
)

export const Plus = (props: IconProps) => (
  <LordIcon
    src={LordIcons.plus}
    trigger="hover"
    {...props}
  />
)

export const Edit = (props: IconProps) => (
  <LordIcon
    src={LordIcons.edit}
    trigger="hover"
    {...props}
  />
)

export const Trash = (props: IconProps) => (
  <LordIcon
    src={LordIcons.trash}
    trigger="hover"
    {...props}
  />
)

export const Download = (props: IconProps) => (
  <LordIcon
    src={LordIcons.download}
    trigger="hover"
    {...props}
  />
)

export const Upload = (props: IconProps) => (
  <LordIcon
    src={LordIcons.upload}
    trigger="hover"
    {...props}
  />
)

export const Save = (props: IconProps) => (
  <LordIcon
    src={LordIcons.save}
    trigger="hover"
    {...props}
  />
)

export const Copy = (props: IconProps) => (
  <LordIcon
    src={LordIcons.copy}
    trigger="hover"
    {...props}
  />
)

export const ExternalLink = (props: IconProps) => (
  <LordIcon
    src={LordIcons.external}
    trigger="hover"
    {...props}
  />
)

export const MessageCircle = (props: IconProps) => (
  <LordIcon
    src={LordIcons.whatsapp}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Mail = (props: IconProps) => (
  <LordIcon
    src={LordIcons.mail}
    trigger="hover"
    {...props}
  />
)

export const Phone = (props: IconProps) => (
  <LordIcon
    src={LordIcons.phone}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Search = (props: IconProps) => (
  <LordIcon
    src={LordIcons.search}
    trigger="hover"
    {...props}
  />
)

export const Filter = (props: IconProps) => (
  <LordIcon
    src={LordIcons.filter}
    trigger="hover"
    {...props}
  />
)

export const Eye = (props: IconProps) => (
  <LordIcon
    src={LordIcons.eye}
    trigger="hover"
    {...props}
  />
)

export const EyeOff = (props: IconProps) => (
  <LordIcon
    src={LordIcons.eyeOff}
    trigger="hover"
    {...props}
  />
)

export const Calendar = (props: IconProps) => (
  <LordIcon
    src={LordIcons.calendar}
    trigger="hover"
    {...props}
  />
)

export const Clock = (props: IconProps) => (
  <LordIcon
    src={LordIcons.clock}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Bell = (props: IconProps) => (
  <LordIcon
    src={LordIcons.bell}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Star = (props: IconProps) => (
  <LordIcon
    src={LordIcons.star}
    trigger="hover"
    {...props}
  />
)

export const Heart = (props: IconProps) => (
  <LordIcon
    src={LordIcons.heart}
    trigger="hover"
    {...props}
  />
)

export const Lock = (props: IconProps) => (
  <LordIcon
    src={LordIcons.lock}
    trigger="hover"
    {...props}
  />
)

export const Unlock = (props: IconProps) => (
  <LordIcon
    src={LordIcons.unlock}
    trigger="hover"
    {...props}
  />
)

export const Refresh = (props: IconProps) => (
  <LordIcon
    src={LordIcons.refresh}
    trigger="hover"
    {...props}
  />
)

export const QrCode = (props: IconProps) => (
  <LordIcon
    src={LordIcons.qrcode}
    trigger="hover"
    {...props}
  />
)

export const AlertCircle = (props: IconProps) => (
  <LordIcon
    src={LordIcons.alert}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Info = (props: IconProps) => (
  <LordIcon
    src={LordIcons.info}
    trigger="hover"
    {...props}
  />
)

export const X = (props: IconProps) => (
  <LordIcon
    src={LordIcons.close}
    trigger="hover"
    {...props}
  />
)

export const Menu = (props: IconProps) => (
  <LordIcon
    src={LordIcons.menu}
    trigger="hover"
    {...props}
  />
)

export const ArrowLeft = (props: IconProps) => (
  <LordIcon
    src={LordIcons.arrowLeft}
    trigger="hover"
    {...props}
  />
)

export const ArrowRight = (props: IconProps) => (
  <LordIcon
    src={LordIcons.arrowRight}
    trigger="hover"
    {...props}
  />
)

export const TrendingUp = (props: IconProps) => (
  <LordIcon
    src={LordIcons.trendingUp}
    trigger="loop-on-hover"
    {...props}
  />
)

export const TrendingDown = (props: IconProps) => (
  <LordIcon
    src={LordIcons.trendingDown}
    trigger="loop-on-hover"
    {...props}
  />
)

export const DollarSign = (props: IconProps) => (
  <LordIcon
    src={LordIcons.dollar}
    trigger="loop-on-hover"
    {...props}
  />
)

export const Image = (props: IconProps) => (
  <LordIcon
    src={LordIcons.image}
    trigger="hover"
    {...props}
  />
)

export const Folder = (props: IconProps) => (
  <LordIcon
    src={LordIcons.folder}
    trigger="hover"
    {...props}
  />
)

export const File = (props: IconProps) => (
  <LordIcon
    src={LordIcons.file}
    trigger="hover"
    {...props}
  />
)

export const User = (props: IconProps) => (
  <LordIcon
    src={LordIcons.user}
    trigger="hover"
    {...props}
  />
)

export const UserPlus = (props: IconProps) => (
  <LordIcon
    src={LordIcons.userPlus}
    trigger="hover"
    {...props}
  />
)

export const Link2 = (props: IconProps) => (
  <LordIcon
    src={LordIcons.link}
    trigger="hover"
    {...props}
  />
)

export const Tag = (props: IconProps) => (
  <LordIcon
    src={LordIcons.tag}
    trigger="hover"
    {...props}
  />
)

export const Sliders = (props: IconProps) => (
  <LordIcon
    src={LordIcons.sliders}
    trigger="hover"
    {...props}
  />
)

export const CheckCircle = (props: IconProps) => (
  <LordIcon
    src={LordIcons.checkCircle}
    trigger="hover"
    {...props}
  />
)

export const XCircle = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/nqtddedc.json"
    trigger="hover"
    {...props}
  />
)

export const ChevronLeft = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/zmkotitn.json"
    trigger="hover"
    {...props}
  />
)

export const ChevronUp = (props: IconProps) => (
  <LordIcon
    src="https://cdn.lordicon.com/pndvjfqy.json"
    trigger="hover"
    {...props}
  />
)
