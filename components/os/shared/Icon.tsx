import { LucideIcon } from "lucide-react"

type Props = {
  icon: LucideIcon
  className?: string
}

export default function Icon({
  icon: Icon,
  className = "",
}: Props) {
  return <Icon className={className} />
}
