import { useState, useMemo } from 'react'
import { ExchangeRate } from '@/lib/types'
import { useHistoricalRates } from '@/hooks/use-historical-rates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendUp, TrendDown, ArrowsClockwise, Warning } from '@phosphor-icons/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDate } from '@/lib/utils'

interface CurrencyTrendChartProps {
  rates: ExchangeRate[]
}

export function CurrencyTrendChart({ rates }: CurrencyTrendChartProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD')
  const [timeRange, setTimeRange] = useState<number>(30)

  const { data: historicalData, isLoading, error, refetch } = useHistoricalRates(selectedCurrency, timeRange)

  const chartData = useMemo(() => {
    return historicalData.map(point => ({
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: point.date,
      rate: Number(point.rate.toFixed(3)),
    }))
  }, [historicalData])

  const trendAnalysis = useMemo(() => {
    if (chartData.length < 2) return null

    const firstRate = chartData[0].rate
    const lastRate = chartData[chartData.length - 1].rate
    const change = lastRate - firstRate
    const percentChange = (change / firstRate) * 100

    return {
      change,
      percentChange,
      isPositive: change > 0,
    }
  }, [chartData])

  const sortedRates = useMemo(() => {
    return [...rates].sort((a, b) => a.currency.localeCompare(b.currency))
  }, [rates])

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="text-2xl">Currency Trend Analysis</CardTitle>
            <CardDescription className="text-base mt-1">
              Historical exchange rate movements against CZK
            </CardDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency-select" className="text-sm font-medium">
                Currency
              </Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger id="currency-select" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedRates.map((rate) => (
                    <SelectItem key={rate.currencyCode} value={rate.currencyCode}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{rate.currencyCode}</span>
                        <span className="text-muted-foreground">- {rate.currency}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timerange-select" className="text-sm font-medium">
                Time Range
              </Label>
              <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(Number(value))}>
                <SelectTrigger id="timerange-select" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                variant="outline"
                className="w-full h-10 gap-2"
              >
                <ArrowsClockwise 
                  size={16} 
                  weight="bold"
                  className={isLoading ? 'animate-spin' : ''}
                />
                Refresh Chart
              </Button>
            </div>
          </div>

          {trendAnalysis && !isLoading && !error && (
            <div className={`p-4 rounded-lg border ${
              trendAnalysis.isPositive 
                ? 'bg-accent/10 border-accent/30' 
                : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {trendAnalysis.isPositive ? (
                    <TrendUp size={24} weight="bold" className="text-accent" />
                  ) : (
                    <TrendDown size={24} weight="bold" className="text-destructive" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {timeRange}-day trend for {selectedCurrency}
                    </p>
                    <p className="font-semibold text-base">
                      {trendAnalysis.isPositive ? '+' : ''}{trendAnalysis.percentChange.toFixed(2)}% 
                      ({trendAnalysis.isPositive ? '+' : ''}{trendAnalysis.change.toFixed(3)} CZK)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current Rate</p>
                  <p className="font-mono font-semibold text-lg">
                    {chartData.length > 0 ? chartData[chartData.length - 1].rate.toFixed(3) : '—'} CZK
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Warning size={20} weight="fill" />
            <AlertDescription className="ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}

        {!isLoading && !error && chartData.length > 0 && (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => value.toFixed(2)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value: number) => [value.toFixed(3) + ' CZK', 'Rate']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return formatDate(payload[0].payload.fullDate)
                    }
                    return label
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
                  name={`${selectedCurrency} / CZK`}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>Showing {chartData.length} data points (excludes weekends)</p>
            </div>
          </div>
        )}

        {!isLoading && !error && chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Warning size={48} weight="light" className="text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Historical Data Available</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Unable to retrieve historical data for {selectedCurrency}. Try selecting a different currency or time range.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
