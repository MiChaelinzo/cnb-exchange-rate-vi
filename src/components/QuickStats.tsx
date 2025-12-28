import { useMemo } from 'react'
import { ExchangeRate } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { TrendUp, TrendDown, Globe, ChartLine } from '@phosphor-icons/react'

interface QuickStatsProps {
  rates: ExchangeRate[]
}

export function QuickStats({ rates }: QuickStatsProps) {
  const stats = useMemo(() => {
    if (rates.length === 0) return null

    const normalizedRates = rates.map(r => r.rate / r.amount)
    const avgRate = normalizedRates.reduce((sum, r) => sum + r, 0) / normalizedRates.length
    const maxRate = Math.max(...normalizedRates)
    const minRate = Math.min(...normalizedRates)
    
    const strongestCurrency = rates.find(r => (r.rate / r.amount) === minRate)
    const weakestCurrency = rates.find(r => (r.rate / r.amount) === maxRate)

    return {
      totalCurrencies: rates.length,
      avgRate: avgRate.toFixed(3),
      strongestCurrency,
      weakestCurrency,
      rateSpread: (maxRate - minRate).toFixed(3),
    }
  }, [rates])

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Currencies</p>
              <p className="text-3xl font-bold mt-2">{stats.totalCurrencies}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Globe size={24} weight="duotone" className="text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Rate</p>
              <p className="text-3xl font-bold mt-2">{stats.avgRate}</p>
              <p className="text-xs text-muted-foreground mt-1">per 1 CZK</p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <ChartLine size={24} weight="duotone" className="text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Strongest vs CZK</p>
              <p className="text-2xl font-bold mt-2">{stats.strongestCurrency?.currencyCode}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.strongestCurrency?.country}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendUp size={24} weight="duotone" className="text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weakest vs CZK</p>
              <p className="text-2xl font-bold mt-2">{stats.weakestCurrency?.currencyCode}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.weakestCurrency?.country}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendDown size={24} weight="duotone" className="text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
