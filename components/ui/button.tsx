import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/session/utils"

const buttonVariants = cva(
    // Base styles: includes flex setup for icon + text, transitions, focus rings etc.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
         // --- MODIFIED OUTLINE VARIANT TO CHANGE COLOR ON HOVER ---
          outline:
          "border border-input bg-background text-gray-600 " + "hover:bg-orange-500 hover:text-black" + "[&_svg]:text-current",
          
          secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      
        // --- ADDED SIDEBAR ACTIVE VARIANT ---
        // Example active state for sidebar links (adjust colors as needed)
        sidebarActive:
          "bg-red-100 text-red-700 [&_svg]:text-red-600",

        // --- ADDED SIDEBAR INACTIVE VARIANT ---
        // Normal state for sidebar links (use this instead of outline/ghost)
        sidebarInactive:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 [&_svg]:text-gray-400 hover:[&_svg]:text-gray-700",
      
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
