import { useKV } from '@github/spark/hooks'

export interface HistoricalPrediction {
  id: string
  currency: string
  currencyName: string
  createdAt: string
  currentRate: number
  predictions: Array<{
    day: string
    date: string
    predicted: number
    confidence: 'high' | 'medium' | 'low'
    actualRate?: number
  }>
  overallTrend: 'bullish' | 'bearish' | 'stable'
  analysis: string
  weekChange: number
}

export function usePredictionHistory() {
  const [history, setHistory] = useKV<HistoricalPrediction[]>('prediction-history', [])

  const savePrediction = (prediction: Omit<HistoricalPrediction, 'id' | 'createdAt'>) => {
    setHistory((current) => {
      const currentArray = current || []
      const newPrediction: HistoricalPrediction = {
        ...prediction,
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      }
      return [newPrediction, ...currentArray]
    })
  }

  const deletePrediction = (id: string) => {
    setHistory((current) => (current || []).filter(p => p.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  const getPredictionsByCurrency = (currency: string) => {
    return (history || []).filter(p => p.currency === currency)
  }

  const updateActualRates = (predictionId: string, actualRates: Array<{ date: string; rate: number }>) => {
    setHistory((current) => 
      (current || []).map(pred => {
        if (pred.id !== predictionId) return pred
        
        return {
          ...pred,
          predictions: pred.predictions.map(p => {
            const actual = actualRates.find(a => a.date === p.date)
            return actual ? { ...p, actualRate: actual.rate } : p
          })
        }
      })
    )
  }

  return {
    history: history || [],
    savePrediction,
    deletePrediction,
    clearHistory,
    getPredictionsByCurrency,
    updateActualRates,
  }
}
