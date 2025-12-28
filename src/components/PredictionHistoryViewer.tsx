import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ClockCounterClockwise, 
  Trash, 
  TrendUp, 
  TrendDown, 
  ChartLine,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calendar,
  Target
} from '@phosphor-icons/react'
import { usePredictionHistory, HistoricalPrediction } from '@/hooks/use-prediction-history'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatDate } from '@/lib/utils'

interface PredictionHistoryViewerProps {
  currencies: string[]
}

export function PredictionHistoryViewer({ currencies }: PredictionHistoryViewerProps) {
  const { history, deletePrediction, clearHistory } = usePredictionHistory()
  const [selectedPrediction, setSelectedPrediction] = useState<HistoricalPrediction | null>(null)
  const [filterCurrency, setFilterCurrency] = useState<string>('all')

  const filteredHistory = filterCurrency === 'all' 
    ? history 
    : history.filter(p => p.currency === filterCurrency)

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendUp size={16} weight="duotone" className="text-accent" />
      case 'bearish':
        return <TrendDown size={16} weight="duotone" className="text-destructive" />
      default:
        return <ChartLine size={16} weight="duotone" className="text-muted-foreground" />
    }
  }

  const calculateAccuracy = (prediction: HistoricalPrediction) => {
    const withActual = prediction.predictions.filter(p => p.actualRate !== undefined)
    if (withActual.length === 0) return null

    const totalError = withActual.reduce((sum, p) => {
      const error = Math.abs(p.predicted - (p.actualRate || 0)) / (p.actualRate || 1)
      return sum + error
    }, 0)

    const accuracy = (1 - (totalError / withActual.length)) * 100
    return Math.max(0, Math.min(100, accuracy))
  }

  const getAccuracyBadge = (accuracy: number | null) => {
    if (accuracy === null) {
      return (
        <Badge variant="outline" className="gap-1">
          <MinusCircle size={14} weight="fill" />
          No Data
        </Badge>
      )
    }

    if (accuracy >= 90) {
      return (
        <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
          <CheckCircle size={14} weight="fill" />
          {accuracy.toFixed(1)}% Accurate
        </Badge>
      )
    } else if (accuracy >= 70) {
      return (
        <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
          <CheckCircle size={14} weight="fill" />
          {accuracy.toFixed(1)}% Accurate
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={14} weight="fill" />
          {accuracy.toFixed(1)}% Accurate
        </Badge>
      )
    }
  }

  const getComparisonData = (prediction: HistoricalPrediction) => {
    return prediction.predictions.map(p => ({
      day: p.day,
      predicted: p.predicted,
      actual: p.actualRate,
    }))
  }

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Are you sure you want to delete this prediction?')) {
      deletePrediction(id)
      if (selectedPrediction?.id === id) {
        setSelectedPrediction(null)
      }
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all prediction history? This cannot be undone.')) {
      clearHistory()
      setSelectedPrediction(null)
    }
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
                <ClockCounterClockwise size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Prediction History</CardTitle>
                <CardDescription className="text-base mt-1">
                  Track and compare past AI forecasts
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  {currencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {history.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="gap-2"
                >
                  <Trash size={16} weight="bold" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-4">
                <ClockCounterClockwise size={32} weight="duotone" className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Prediction History</h3>
              <p className="text-muted-foreground mb-4">
                {filterCurrency === 'all' 
                  ? 'Generate predictions in the AI Insights tab to start tracking accuracy'
                  : `No predictions found for ${filterCurrency}`
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {filteredHistory.map((prediction) => {
                  const accuracy = calculateAccuracy(prediction)
                  const hasActualData = prediction.predictions.some(p => p.actualRate !== undefined)
                  
                  return (
                    <Card 
                      key={prediction.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPrediction(prediction)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold font-mono">{prediction.currency}</h4>
                                <span className="text-muted-foreground">- {prediction.currencyName}</span>
                                {getTrendIcon(prediction.overallTrend)}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} weight="duotone" />
                                  {formatDate(prediction.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target size={14} weight="duotone" />
                                  {prediction.weekChange >= 0 ? '+' : ''}{prediction.weekChange.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getAccuracyBadge(accuracy)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(prediction.id, e)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash size={16} weight="bold" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                            <div>
                              <div className="text-xs text-muted-foreground">Current Rate</div>
                              <div className="font-mono font-semibold">
                                {prediction.currentRate.toFixed(3)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Forecast Trend</div>
                              <div className="font-semibold capitalize">
                                {prediction.overallTrend}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Days Tracked</div>
                              <div className="font-semibold">
                                {prediction.predictions.filter(p => p.actualRate !== undefined).length} / {prediction.predictions.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Status</div>
                              <div className="font-semibold">
                                {hasActualData ? '✓ Active' : '⏳ Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPrediction} onOpenChange={(open) => !open && setSelectedPrediction(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPrediction && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <span className="font-mono">{selectedPrediction.currency}</span>
                  <span className="text-muted-foreground font-normal">/ CZK</span>
                  {getTrendIcon(selectedPrediction.overallTrend)}
                </DialogTitle>
                <DialogDescription className="text-base">
                  Generated on {formatDate(selectedPrediction.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground mb-1">Current Rate</div>
                      <div className="text-xl font-bold font-mono">
                        {selectedPrediction.currentRate.toFixed(3)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground mb-1">Trend</div>
                      <div className="text-xl font-bold capitalize">
                        {selectedPrediction.overallTrend}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground mb-1">7-Day Change</div>
                      <div className={`text-xl font-bold ${selectedPrediction.weekChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {selectedPrediction.weekChange >= 0 ? '+' : ''}{selectedPrediction.weekChange.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
                      <div className="text-xl font-bold">
                        {calculateAccuracy(selectedPrediction)?.toFixed(1) || 'N/A'}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base">Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{selectedPrediction.analysis}</p>
                  </CardContent>
                </Card>

                {selectedPrediction.predictions.some(p => p.actualRate !== undefined) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Predicted vs. Actual</CardTitle>
                      <CardDescription>Compare forecast accuracy</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getComparisonData(selectedPrediction)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="day" 
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                            domain={['dataMin - 0.1', 'dataMax + 0.1']}
                            tickFormatter={(value) => value.toFixed(2)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [value.toFixed(3), '']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            name="Predicted"
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="hsl(var(--accent))"
                            strokeWidth={2}
                            name="Actual"
                            dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Daily Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPrediction.predictions.map((pred, idx) => {
                        const change = pred.actualRate 
                          ? ((pred.predicted - pred.actualRate) / pred.actualRate) * 100 
                          : null
                        const isAccurate = change !== null ? Math.abs(change) < 1 : null
                        
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold text-muted-foreground min-w-[60px]">
                                {pred.day}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {pred.confidence}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Predicted</div>
                                <div className="font-mono font-semibold">
                                  {pred.predicted.toFixed(3)}
                                </div>
                              </div>
                              {pred.actualRate !== undefined && (
                                <>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Actual</div>
                                    <div className="font-mono font-semibold">
                                      {pred.actualRate.toFixed(3)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground">Variance</div>
                                    <div className={`font-semibold text-sm ${isAccurate ? 'text-accent' : 'text-destructive'}`}>
                                      {change !== null ? `${Math.abs(change).toFixed(2)}%` : 'N/A'}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {!selectedPrediction.predictions.some(p => p.actualRate !== undefined) && (
                  <Alert>
                    <AlertTitle>No Actual Data Yet</AlertTitle>
                    <AlertDescription>
                      Actual exchange rates will be populated automatically as time passes and new rates become available.
                      Check back later to see how accurate this prediction was.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
