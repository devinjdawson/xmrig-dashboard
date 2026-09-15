import * as React from "react"
import { cn } from "@/lib/utils"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  viewportClassName?: string
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, viewportClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative overflow-hidden", className)} ref={ref} {...props}>
        <div className={cn("h-full w-full rounded-[inherit] overflow-auto", viewportClassName)}>
          {children}
        </div>
      </div>
    )
  },
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }