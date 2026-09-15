import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContext = React.createContext<{
  value: string
  onValueChange?: (value: string) => void
} | null>(null)

function Tabs({ defaultValue, value, onValueChange, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const currentValue = value ?? internalValue
  const handleChange = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn("flex flex-col gap-4", className)} {...props} />
    </TabsContext.Provider>
  )
}

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div className={cn("inline-flex items-center rounded-lg bg-muted p-1", className)} {...props} />
  )
}

function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs")
  const active = ctx.value === value
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={() => ctx.onValueChange?.(value)}
      {...props}
    />
  )
}

function TabsContent({ value, className, ...props }: TabsContentProps) {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("TabsContent must be used within Tabs")
  if (ctx.value !== value) return null
  return <div className={cn("mt-1", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }