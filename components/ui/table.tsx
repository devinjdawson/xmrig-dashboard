import * as React from "react"
import { cn } from "@/lib/utils"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

function Table({ className, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props} />
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn("border-b transition-colors hover:bg-accent/50 data-[state=selected]:bg-accent", className)}
      {...props}
    />
  )
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  )
}

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }