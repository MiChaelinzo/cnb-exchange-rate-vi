import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Circle } from '@phosphor-icons/react'
import type { WatchlistMember } from '@/hooks/use-shared-watchlists'

interface ActiveViewersBadgeProps {
  members: WatchlistMember[]
  currentUserId: string
  className?: string
}

export function ActiveViewersBadge({ members, currentUserId, className = '' }: ActiveViewersBadgeProps) {
  const [activeCount, setActiveCount] = useState(0)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ACTIVE_THRESHOLD = 2 * 60 * 1000
    
    const count = members.filter(member => {
      if (member.id === currentUserId) return false
      if (!member.lastActive) return false
      
      const lastActiveTime = new Date(member.lastActive).getTime()
      const timeSinceActive = now - lastActiveTime
      
      return timeSinceActive < ACTIVE_THRESHOLD
    }).length
    
    setActiveCount(count)
  }, [members, currentUserId, now])

  if (activeCount === 0) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1.5 bg-accent/10 text-accent-foreground border-accent/30 ${className}`}
    >
      <Circle size={10} weight="fill" className="text-accent animate-pulse" />
      <span className="font-medium">{activeCount} viewing</span>
    </Badge>
  )
}
