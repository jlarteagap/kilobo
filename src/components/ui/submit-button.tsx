import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function SubmitButton({
  children,
  isPending,
  disabled,
  pendingText = "Guardando…",
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  isPending: boolean
  pendingText?: string
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      className={cn(
        "w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white gap-2 shadow-sm hover:shadow-md transition-all duration-200",
        className
      )}
      {...props}
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> {pendingText}</>
      ) : (
        children
      )}
    </Button>
  )
}

export { SubmitButton }
