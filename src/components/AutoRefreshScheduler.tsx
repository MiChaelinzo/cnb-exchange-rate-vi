import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowsClockwise, CheckCircle, PlayCircle, StopCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AutoRefreshSchedulerProps {
  onRefresh: () => Promise<void>
  isLoading?: boolean
}

type RefreshInterval = '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | 'manual'

const intervalOptions: { value: RefreshInterval; label: string; ms: number }[] = [
  { value: '30s', label: '30 seconds', ms: 30 * 1000 },
  { value: '1m', label: '1 minute', ms: 60 * 1000 },
  { value: '5m', label: '5 minutes', ms: 5 * 60 * 1000 },
  { value: '15m', label: '15 minutes', ms: 15 * 60 * 1000 },
  { value: '30m', label: '30 minutes', ms: 30 * 60 * 1000 },
  { value: '1h', label: '1 hour', ms: 60 * 60 * 1000 },
  { value: 'manual', label: 'Manual only', ms: 0 },
]

export function AutoRefreshScheduler({ onRefresh }: AutoRefreshSchedulerProps) {
  const [isEnabled, setIsEnabled] = useKV('auto-refresh-enabled', 'false')
  const [interval, setInterval] = useKV<RefreshInterval>('auto-refresh-interval', '5m')
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now())
  const [nextRefreshTime, setNextRefreshTime] = useState<number | null>(null)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<string>('')
  const [refreshCount, setRefreshCount] = useState(0)

  const enabled = isEnabled === 'true'

  const performRefresh = useCallback(async () => {
    try {
      await onRefresh()
      const now = Date.now()
      setLastRefreshTime(now)
      setRefreshCount(prev => prev + 1)
      toast.success('Data refreshed automatically')
    } catch (error) {
      toast.error('Auto-refresh failed')
    }
  }, [onRefresh])

  useEffect(() => {
    if (!enabled || interval === 'manual') {
      setNextRefreshTime(null)
      return
    }

    const option = intervalOptions.find(opt => opt.value === interval)
    if (!option) return

    const id = window.setInterval(() => {
      performRefresh()
    }, option.ms)

    const next = Date.now() + option.ms
    setNextRefreshTime(next)

    return () => window.clearInterval(id)
  }, [enabled, interval, performRefresh])

  useEffect(() => {
    if (!nextRefreshTime) {
      setTimeUntilRefresh('')
      return
    }

    const updateTimer = () => {
      const remaining = nextRefreshTime - Date.now()
      if (remaining <= 0) {
        setTimeUntilRefresh('Refreshing...')
        return
      }

      const seconds = Math.floor(remaining / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) {
        setTimeUntilRefresh(`${hours}h ${minutes % 60}m`)
      } else if (minutes > 0) {
        setTimeUntilRefresh(`${minutes}m ${seconds % 60}s`)
      } else {
        setTimeUntilRefresh(`${seconds}s`)
      }
    }

    updateTimer()
    const id = window.setInterval(updateTimer, 1000)

    return () => window.clearInterval(id)
  }, [nextRefreshTime])

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked ? 'true' : 'false')
    if (checked && interval !== 'manual') {
      toast.success('Auto-refresh enabled')
      const now = Date.now()
      setLastRefreshTime(now)
    } else {
      toast.info('Auto-refresh disabled')
      setNextRefreshTime(null)
    }
  }

  const handleIntervalChange = (value: RefreshInterval) => {
    setInterval(value)
    if (value === 'manual') {
      setIsEnabled('false')
      setNextRefreshTime(null)
      toast.info('Auto-refresh set to manual')
    } else {
      const option = intervalOptions.find(opt => opt.value === value)
      if (option && enabled) {
        const next = Date.now() + option.ms
        setNextRefreshTime(next)
        toast.success(`Auto-refresh interval set to ${option.label}`)
      }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock size={24} weight="duotone" />
              Auto-Refresh Scheduler
            </CardTitle>
            <CardDescription className="mt-1">
              Automatically refresh data at regular intervals
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {enabled && interval !== 'manual' && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Badge variant="secondary" className="gap-1">
                  <PlayCircle size={14} weight="fill" />
                  Active
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh" className="text-base font-semibold">
                Enable Auto-Refresh
              </Label>
              <Switch
                id="auto-refresh"
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={interval === 'manual'}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Automatically fetch the latest exchange rates
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="refresh-interval" className="text-base font-semibold">
              Refresh Interval
            </Label>
            <Select value={interval} onValueChange={handleIntervalChange}>
              <SelectTrigger id="refresh-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {enabled && interval !== 'manual' && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Last Refresh</div>
                <div className="font-mono font-semibold">{formatTimestamp(lastRefreshTime)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Next Refresh</div>
                <div className="font-mono font-semibold text-primary">
                  {timeUntilRefresh || 'Calculating...'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Refresh Count</div>
                <div className="font-mono font-semibold flex items-center justify-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-green-500" />
                  {refreshCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {!enabled && (
          <div className="text-center py-6 text-muted-foreground">
            <StopCircle size={32} weight="duotone" className="mx-auto mb-2" />
            <p className="text-sm">Auto-refresh is currently disabled</p>
          </div>
        )}

        {interval === 'manual' && (
          <div className="text-center py-6 text-muted-foreground">
            <ArrowsClockwise size={32} weight="duotone" className="mx-auto mb-2" />
            <p className="text-sm">Set to manual refresh only</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
