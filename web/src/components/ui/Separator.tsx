import * as React from "react"

type SeparatorProps = React.HTMLAttributes<HTMLHRElement>

export function Separator({ className, ...props }: SeparatorProps) {
  return <hr className={`my-4 border-t border-gray-200 ${className}`} {...props} />
}
