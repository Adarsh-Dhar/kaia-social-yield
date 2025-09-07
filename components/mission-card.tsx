"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MissionCardProps {
  icon: LucideIcon
  title: string
  description: string
  buttonText?: string
  onButtonClick?: () => void
  completed?: boolean
  className?: string
}

export function MissionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  completed = false,
  className,
}: MissionCardProps) {
  return (
    <Card className={cn("p-4 transition-all duration-200", completed && "opacity-60 bg-muted/50", className)}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            completed ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("font-medium text-sm", completed ? "text-muted-foreground" : "text-foreground")}>
            {title}
          </h3>
          <p className={cn("text-xs mt-1", completed ? "text-muted-foreground" : "text-muted-foreground")}>
            {description}
          </p>
        </div>

        {buttonText && !completed && (
          <Button size="sm" onClick={onButtonClick} className="flex-shrink-0 text-xs px-3 py-1 h-8">
            {buttonText}
          </Button>
        )}
      </div>
    </Card>
  )
}
