import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Fire, Snowflake, Minus, TrendUp, TrendDown } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ExchangeRate {
  country: string
  currency: string
  amount: number
  currencyCode: string
  rate: number
}

interface CurrencyHeatmapProps {
  rates: ExchangeRate[]
}

type SortBy = 'rate' | 'strength' | 'alphabetical'

export function CurrencyHeatmap({ rates }: CurrencyHeatmapProps) {
  const [sortBy, setSortBy] = useState<SortBy>('strength')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const sortedRates = useMemo(() => {
    const sorted = [...rates]
    
    switch (sortBy) {
      case 'rate':
        return sorted.sort((a, b) => b.rate - a.rate)
      case 'strength':
        return sorted.sort((a, b) => {
          const strengthA = a.rate / a.amount
          const strengthB = b.rate / b.amount
          return strengthB - strengthA
        })
      case 'alphabetical':
        return sorted.sort((a, b) => a.currencyCode.localeCompare(b.currencyCode))
      default:
        return sorted
    }
  }, [rates, sortBy])

  const { min, max, median } = useMemo(() => {
    const strengths = rates.map(r => r.rate / r.amount)
    return {
      min: Math.min(...strengths),
      max: Math.max(...strengths),
      median: strengths.sort((a, b) => a - b)[Math.floor(strengths.length / 2)]
    }
  }, [rates])

  const getHeatColor = (rate: ExchangeRate) => {
    const strength = rate.rate / rate.amount
    const percentage = (strength - min) / (max - min)
    
    if (percentage > 0.75) return 'bg-red-500/20 border-red-500/50 text-red-900 hover:bg-red-500/30'
    if (percentage > 0.6) return 'bg-orange-500/20 border-orange-500/50 text-orange-900 hover:bg-orange-500/30'
    if (percentage > 0.4) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-900 hover:bg-yellow-500/30'
    if (percentage > 0.25) return 'bg-green-500/20 border-green-500/50 text-green-900 hover:bg-green-500/30'
    return 'bg-blue-500/20 border-blue-500/50 text-blue-900 hover:bg-blue-500/30'
  }

  const getStrengthBadge = (rate: ExchangeRate) => {
    const strength = rate.rate / rate.amount
    
    if (strength > median * 1.2) {
      return { label: 'Very Strong', icon: <Fire size={14} weight="fill" />, variant: 'default' as const }
    } else if (strength > median) {
      return { label: 'Strong', icon: <TrendUp size={14} weight="bold" />, variant: 'default' as const }
    } else if (strength > median * 0.8) {
      return { label: 'Neutral', icon: <Minus size={14} weight="bold" />, variant: 'secondary' as const }
    } else if (strength > median * 0.5) {
      return { label: 'Weak', icon: <TrendDown size={14} weight="bold" />, variant: 'secondary' as const }
    } else {
      return { label: 'Very Weak', icon: <Snowflake size={14} weight="fill" />, variant: 'outline' as const }
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Fire size={24} weight="duotone" className="text-orange-500" />
              Currency Performance Heatmap
            </CardTitle>
            <CardDescription className="mt-1">
              Visual representation of currency strength vs CZK
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">By Strength</SelectItem>
                <SelectItem value="rate">By Rate</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
                className="h-8 px-3"
              >
                Grid
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="h-8 px-3"
              >
                List
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50" />
            <span>Very Weak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span>Weak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500/30 border border-orange-500/50" />
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span>Very Strong</span>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedRates.map((rate) => {
              const badge = getStrengthBadge(rate)
              return (
                <TooltipProvider key={rate.currencyCode}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${getHeatColor(rate)}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="font-mono font-bold text-lg">
                            {rate.currencyCode}
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {badge.icon}
                            <span className="font-medium">{badge.label}</span>
                          </div>
                          <div className="font-mono text-sm">
                            {(rate.rate / rate.amount).toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm space-y-1">
                        <div className="font-semibold">{rate.country}</div>
                        <div className="font-mono">{rate.amount} {rate.currencyCode} = {rate.rate.toFixed(2)} CZK</div>
                        <div className="text-xs text-muted-foreground">
                          Unit rate: {(rate.rate / rate.amount).toFixed(4)} CZK
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedRates.map((rate) => {
              const badge = getStrengthBadge(rate)
              const strength = rate.rate / rate.amount
              const percentage = ((strength - min) / (max - min)) * 100
              
              return (
                <div
                  key={rate.currencyCode}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="font-mono font-bold text-sm w-12">
                        {rate.currencyCode}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {rate.country}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={badge.variant} className="gap-1 whitespace-nowrap">
                        {badge.icon}
                        {badge.label}
                      </Badge>
                      <div className="font-mono text-sm font-medium w-20 text-right">
                        {strength.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
