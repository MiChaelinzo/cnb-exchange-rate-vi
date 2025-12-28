import { useEffect } from 'react'
import { usePredictionHistory } from './use-prediction-history'
import { ExchangeRate } from '@/lib/types'

export function useAutoUpdatePredictionHistory(rates: ExchangeRate[] | undefined) {
  const { history, updateActualRates } = usePredictionHistory()

  useEffect(() => {
    if (!rates || rates.length === 0 || history.length === 0) return

    const today = new Date().toISOString().split('T')[0]

    history.forEach(prediction => {
      const currencyRate = rates.find(r => r.currencyCode === prediction.currency)
      if (!currencyRate) return

      const predictionDates = prediction.predictions
        .filter(p => p.date === today && p.actualRate === undefined)
        .map(p => ({
          date: p.date,
          rate: currencyRate.rate / currencyRate.amount
        }))

      if (predictionDates.length > 0) {
        updateActualRates(prediction.id, predictionDates)
      }
    })
  }, [rates, history, updateActualRates])
}
