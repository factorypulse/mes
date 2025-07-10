import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        active:
          "border-transparent bg-green-500 dark:bg-green-600 text-white shadow hover:bg-green-600 dark:hover:bg-green-700",
        pending:
          "border-transparent bg-blue-500 dark:bg-blue-600 text-white shadow hover:bg-blue-600 dark:hover:bg-blue-700",
        paused:
          "border-transparent bg-yellow-500 dark:bg-yellow-600 text-black dark:text-white shadow hover:bg-yellow-600 dark:hover:bg-yellow-700",
        completed:
          "border-transparent bg-gray-500 dark:bg-gray-600 text-white shadow hover:bg-gray-600 dark:hover:bg-gray-700",
        error:
          "border-transparent bg-red-500 dark:bg-red-600 text-white shadow hover:bg-red-600 dark:hover:bg-red-700",
        warning:
          "border-transparent bg-orange-500 dark:bg-orange-600 text-white shadow hover:bg-orange-600 dark:hover:bg-orange-700",
        waiting:
          "border-transparent bg-slate-500 dark:bg-slate-600 text-white shadow hover:bg-slate-600 dark:hover:bg-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
