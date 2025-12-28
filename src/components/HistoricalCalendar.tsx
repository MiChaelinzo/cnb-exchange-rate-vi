import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useCalendarRates, CalendarDayData } from '@/hooks/use-calendar-rates'
import { ExchangeRate } from '@/lib/types'
import { CaretLeft, CaretRight, Info, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface HistoricalCalendarProps {
  availableCurrencies: ExchangeRate[]
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getColorForRate(rate: number | null, min: number, max: number): string {
  if (rate === null) return 'bg-muted'
  
  const range = max - min
  const normalized = (rate - min) / range
  
  if (normalized <= 0.2) return 'bg-blue-200 dark:bg-blue-900'
  if (normalized <= 0.4) return 'bg-cyan-200 dark:bg-cyan-800'
  if (normalized <= 0.6) return 'bg-teal-200 dark:bg-teal-700'
  if (normalized <= 0.8) return 'bg-orange-200 dark:bg-orange-700'
  return 'bg-red-200 dark:bg-red-800'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function HistoricalCalendar({ availableCurrencies }: HistoricalCalendarProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR')
  
  const {
    monthData,
    isLoading,
    error,
    currentMonth,
    periodAverage,
    goToNextMonth,
    goToPreviousMonth,
  } = useCalendarRates(selectedCurrency)

  const { minRate, maxRate, calendarDays } = useMemo(() => {
    const rates = monthData.filter(d => d.rate !== null).map(d => d.rate!)
    const min = rates.length > 0 ? Math.min(...rates) : 0
    const max = rates.length > 0 ? Math.max(...rates) : 0
    
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const paddedDays: (CalendarDayData | null)[] = Array(firstDay).fill(null)
    
    return {
      minRate: min,
      maxRate: max,
      calendarDays: [...paddedDays, ...monthData],
    }
  }, [monthData, currentMonth])

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth <= new Date()
  }, [currentMonth])

  const selectedCurrencyInfo = availableCurrencies.find(
    c => c.currencyCode === selectedCurrency
  )

  return (
    <div className="space-y-6">
      <Alert>
        <Info size={20} weight="fill" />
        <AlertDescription>
          View historical exchange rates in an interactive calendar format. Select a currency
          and navigate through months to see daily rate variations visualized with color-coded cells.
          Hover over any day to see detailed information.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CalendarBlank size={28} weight="duotone" />
                Historical Rate Calendar
              </CardTitle>
              <CardDescription className="mt-1">
                Visual representation of daily exchange rates
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency.currencyCode} value={currency.currencyCode}>
                      {currency.currencyCode} - {currency.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="gap-2"
            >
              <CaretLeft size={16} weight="bold" />
              Previous
            </Button>

            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              {periodAverage && (
                <p className="text-sm text-muted-foreground">
                  Period average: <span className="font-mono font-medium">{periodAverage.toFixed(3)}</span>
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="gap-2"
            >
              Next
              <CaretRight size={16} weight="bold" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEKDAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-20" />
                  }

                  const dayNum = new Date(day.date).getDate()
                  const colorClass = getColorForRate(day.rate, minRate, maxRate)
                  
                  const percentageFromAvg = periodAverage && day.rate
                    ? ((day.rate - periodAverage) / periodAverage * 100).toFixed(2)
                    : null

                  if (day.isFuture || day.rate === null) {
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          'h-20 rounded-md border-2 flex flex-col items-center justify-center',
                          'bg-muted/50 text-muted-foreground',
                          day.isWeekend && 'opacity-50'
                        )}
                      >
                        <span className="text-lg font-semibold">{dayNum}</span>
                        <span className="text-xs">
                          {day.isFuture ? 'Future' : 'No data'}
                        </span>
                      </div>
                    )
                  }

                  return (
                    <TooltipProvider key={day.date}>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-20 rounded-md border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg',
                              'flex flex-col items-center justify-center p-1',
                              colorClass,
                              day.isToday && 'border-primary ring-2 ring-primary ring-offset-2',
                              day.isWeekend && 'opacity-75'
                            )}
                          >
                            <span className="text-lg font-bold">{dayNum}</span>
                            <span className="text-xs font-mono font-medium">
                              {day.rate.toFixed(3)}
                            </span>
                            {day.isToday && (
                              <span className="text-[10px] font-semibold text-primary mt-1">
                                TODAY
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">{formatDate(day.date)}</p>
                            <p className="text-sm">
                              {selectedCurrencyInfo?.currency} ({selectedCurrency})
                            </p>
                            <p className="font-mono text-lg font-bold">
                              {day.rate.toFixed(3)} CZK
                            </p>
                            {percentageFromAvg && (
                              <p className="text-xs text-muted-foreground">
                                {parseFloat(percentageFromAvg) > 0 ? '+' : ''}
                                {percentageFromAvg}% from period average
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 pt-4 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-2">Color Legend</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded bg-blue-200 dark:bg-blue-900 border" />
                  <span className="text-xs">Weakest</span>
                </div>
                <div className="w-6 h-6 rounded bg-cyan-200 dark:bg-cyan-800 border" />
                <div className="w-6 h-6 rounded bg-teal-200 dark:bg-teal-700 border" />
                <div className="w-6 h-6 rounded bg-orange-200 dark:bg-orange-700 border" />
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 rounded bg-red-200 dark:bg-red-800 border" />
                  <span className="text-xs">Strongest</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
