import { useState, useEffect, useCallback } from 'react'
import { fetchHistoricalRates, CNBApiError } from '@/lib/api'

export interface CalendarDayData {
  date: string
  rate: number | null
  isWeekend: boolean
  isFuture: boolean
  isToday: boolean
}

interface UseCalendarRatesResult {
  monthData: CalendarDayData[]
  isLoading: boolean
  error: string | null
  currentMonth: Date
  periodAverage: number | null
  goToNextMonth: () => void
  goToPreviousMonth: () => void
  goToMonth: (date: Date) => void
  refetch: () => Promise<void>
}

export function useCalendarRates(currencyCode: string | null): UseCalendarRatesResult {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [monthData, setMonthData] = useState<CalendarDayData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [periodAverage, setPeriodAverage] = useState<number | null>(null)

  const fetchMonthData = useCallback(async () => {
    if (!currencyCode) {
      setMonthData([])
      setIsLoading(false)
      setError(null)
      setPeriodAverage(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month, daysInMonth)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      const daysToFetch = Math.min(
        daysInMonth,
        endDate > now ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : daysInMonth
      )
      
      let historicalData: Array<{ date: string; rate: number }> = []
      
      if (daysToFetch > 0 && startDate <= now) {
        historicalData = await fetchHistoricalRates(currencyCode, daysToFetch, startDate)
      }

      const dataMap = new Map(historicalData.map(d => [d.date, d.rate]))
      
      const validRates = historicalData.map(d => d.rate).filter(r => r > 0)
      const avgRate = validRates.length > 0
        ? validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length
        : null
      
      setPeriodAverage(avgRate)

      const calendarData: CalendarDayData[] = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dateString = date.toISOString().split('T')[0]
        const dayOfWeek = date.getDay()
        
        calendarData.push({
          date: dateString,
          rate: dataMap.get(dateString) || null,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isFuture: date > today,
          isToday: date.getTime() === today.getTime(),
        })
      }
      
      setMonthData(calendarData)
    } catch (err) {
      if (err instanceof CNBApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch calendar data')
      }
      setMonthData([])
      setPeriodAverage(null)
    } finally {
      setIsLoading(false)
    }
  }, [currencyCode, currentMonth])

  useEffect(() => {
    fetchMonthData()
  }, [fetchMonthData])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + 1)
      return next
    })
  }, [])

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() - 1)
      return next
    })
  }, [])

  const goToMonth = useCallback((date: Date) => {
    setCurrentMonth(date)
  }, [])

  return {
    monthData,
    isLoading,
    error,
    currentMonth,
    periodAverage,
    goToNextMonth,
    goToPreviousMonth,
    goToMonth,
    refetch: fetchMonthData,
  }
}
