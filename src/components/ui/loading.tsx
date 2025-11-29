import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
}

export function Loading({ size = "md", text, className }: LoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  const dotSizes = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
    xl: "h-5 w-5",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={cn(
            "animate-spin rounded-full border-4 border-primary/20",
            sizeClasses[size]
          )}
          style={{
            borderTopColor: "rgb(219, 39, 119)",
            borderRightColor: "rgb(219, 39, 119)",
          }}
        />

        {/* Inner pulsing dot */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary to-pink-500 animate-pulse",
            dotSizes[size]
          )}
        />
      </div>

      {text && (
        <p className="text-sm text-muted-foreground animate-pulse font-medium">
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("inline-block", className)}>
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="h-2 w-2 rounded-full bg-primary animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  )
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="rounded-lg bg-card p-8 shadow-xl border-2 border-primary/20">
        <Loading size="lg" text={text} />
      </div>
    </div>
  )
}
