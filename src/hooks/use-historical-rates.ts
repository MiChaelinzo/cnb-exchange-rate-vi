import { useState, useEffect, useCallback } from 'react'
import { fetchHistoricalRates, CNBApiError } from '@/lib/api'

interface HistoricalDataPoint {
  date: string
  rate: number
}

interface UseHistoricalRatesResult {
  data: HistoricalDataPoint[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHistoricalRates(
  currencyCode: string | null,
  days: number = 30
): UseHistoricalRatesResult {
  const [data, setData] = useState<HistoricalDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currencyCode) {
      setData([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchHistoricalRates(currencyCode, days)
      setData(result)
    } catch (err) {
      if (err instanceof CNBApiError) {
        setError(err.message)
      } else {
        setError('Failed to fetch historical data')
      }
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [currencyCode, days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
