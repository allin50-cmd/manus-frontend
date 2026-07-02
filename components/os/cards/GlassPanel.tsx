import { ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
}

export default function GlassPanel({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "rounded-2xl",
        "border",
        "border-slate-700/40",
        "bg-slate-900/60",
        "backdrop-blur-xl",
        "shadow-2xl",
        "p-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  )
}
