import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, Circle } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import type { WatchlistMember } from '@/hooks/use-shared-watchlists'

interface ActiveViewersIndicatorProps {
  members: WatchlistMember[]
  currentUserId: string
  className?: string
}

export function ActiveViewersIndicator({ members, currentUserId, className = '' }: ActiveViewersIndicatorProps) {
  const [activeMembers, setActiveMembers] = useState<WatchlistMember[]>([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ACTIVE_THRESHOLD = 2 * 60 * 1000
    
    const active = members.filter(member => {
      if (member.id === currentUserId) return false
      if (!member.lastActive) return false
      
      const lastActiveTime = new Date(member.lastActive).getTime()
      const timeSinceActive = now - lastActiveTime
      
      return timeSinceActive < ACTIVE_THRESHOLD
    })
    
    setActiveMembers(active)
  }, [members, currentUserId, now])

  if (activeMembers.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <Eye size={18} weight="duotone" className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            {activeMembers.length} viewing
          </span>
        </div>
        
        <div className="flex -space-x-2">
          {activeMembers.slice(0, 5).map((member) => (
            <Tooltip key={member.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-background ring-2 ring-accent/30 cursor-pointer hover:z-10 transition-transform hover:scale-110">
                    <AvatarImage src={member.avatar} alt={member.login} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {member.login.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Circle 
                    size={12} 
                    weight="fill" 
                    className="absolute -bottom-0.5 -right-0.5 text-accent drop-shadow-lg animate-pulse"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="flex flex-col gap-1">
                <div className="font-semibold">@{member.login}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {member.role}
                  </Badge>
                  {member.lastActive && (
                    <span>
                      Active {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {activeMembers.length > 5 && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center cursor-pointer hover:bg-accent/20 transition-colors">
                  <span className="text-xs font-semibold text-muted-foreground">
                    +{activeMembers.length - 5}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {activeMembers.slice(5).map((member) => (
                    <div key={member.id} className="flex items-center gap-2 py-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.avatar} alt={member.login} />
                        <AvatarFallback className="text-xs">
                          {member.login.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">@{member.login}</span>
                        {member.lastActive && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  )
}
