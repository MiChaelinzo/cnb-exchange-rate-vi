import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Sparkle, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useSharedWatchlists } from '@/hooks/use-shared-watchlists'

interface SimulateActivityProps {
  watchlistId: string
}

export function SimulateActivity({ watchlistId }: SimulateActivityProps) {
  const { watchlists, updateLastActive } = useSharedWatchlists()
  const [isSimulating, setIsSimulating] = useState(false)
  
  const watchlist = watchlists.find(w => w.id === watchlistId)
  
  if (!watchlist) return null

  const handleSimulate = async () => {
    setIsSimulating(true)
    
    const user = await window.spark.user()
    if (!user) {
      toast.error('Must be logged in to simulate activity')
      setIsSimulating(false)
      return
    }

    const otherMembers = watchlist.members.filter(m => m.id !== String(user.id))
    
    if (otherMembers.length === 0) {
      toast.info('No other members to simulate activity for')
      setIsSimulating(false)
      return
    }

    toast.success(`Simulating activity for ${otherMembers.length} team member${otherMembers.length !== 1 ? 's' : ''}`)
    
    setTimeout(() => {
      setIsSimulating(false)
    }, 2000)
  }

  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Sparkle size={20} weight="duotone" className="text-primary" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold mb-1">Demo Feature</p>
            <p className="text-sm text-muted-foreground">
              In a real application, active viewers would update automatically as team members open this watchlist. 
              The indicators refresh every 10 seconds and show who's currently viewing (last 2 minutes) or recently active (last 30 minutes).
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSimulate}
            disabled={isSimulating}
            className="shrink-0"
          >
            <Users size={16} className="mr-2" />
            {isSimulating ? 'Simulating...' : 'Test Activity'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
