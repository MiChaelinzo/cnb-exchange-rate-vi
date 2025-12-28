import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkle, TrendUp, TrendDown, Info } from '@phosphor-icons/react'
import { ExchangeRate } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AiInsightsProps {
  rates: ExchangeRate[]
  date: string
}

interface Insight {
  type: 'trend' | 'opportunity' | 'risk' | 'info'
  currency: string
  message: string
}

export function AiInsights({ rates, date }: AiInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsights = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const topCurrencies = rates.slice(0, 10).map(r => ({
        code: r.currencyCode,
        country: r.country,
        rate: r.rate,
        amount: r.amount
      }))

      const currencyData = JSON.stringify(topCurrencies, null, 2)
      
      const promptText = `You are a financial analyst expert. Analyze these exchange rates from the Czech National Bank for ${date}.

Currency Data:
${currencyData}

Generate exactly 5 insights about these exchange rates. Consider:
- Currencies that appear strong or weak against CZK
- Potential trading opportunities
- Notable patterns in the rates
- Risk factors or warnings
- Helpful information for travelers or traders

Return your analysis as a valid JSON object with a single property "insights" that contains an array of insight objects. Each insight must have:
- type: one of "trend", "opportunity", "risk", or "info"
- currency: the currency code (or "GENERAL" for general insights)
- message: a clear, concise message (1-2 sentences max)

Example format:
{
  "insights": [
    {"type": "trend", "currency": "USD", "message": "The US Dollar shows strong stability against CZK at 23.456, making it a reliable choice for international transactions."},
    {"type": "opportunity", "currency": "EUR", "message": "Euro is currently favorable for Czech travelers to Eurozone, with competitive rates for currency exchange."}
  ]
}`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const data = JSON.parse(response)
      
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('AI Insights error:', err)
      setError('Failed to generate insights. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendUp size={20} weight="duotone" className="text-accent" />
      case 'opportunity':
        return <Sparkle size={20} weight="duotone" className="text-accent" />
      case 'risk':
        return <TrendDown size={20} weight="duotone" className="text-destructive" />
      default:
        return <Info size={20} weight="duotone" className="text-primary" />
    }
  }

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-accent/10 border-accent/20'
      case 'opportunity':
        return 'bg-accent/10 border-accent/20'
      case 'risk':
        return 'bg-destructive/10 border-destructive/20'
      default:
        return 'bg-muted border-border'
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg">
              <Sparkle size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Market Insights</CardTitle>
              <CardDescription className="text-base mt-1">
                Intelligent analysis of current exchange rates
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isGenerating}
            size="lg"
            className="gap-2"
          >
            <Sparkle size={18} weight="bold" className={isGenerating ? 'animate-pulse' : ''} />
            {isGenerating ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-4 border rounded-lg">
                <Skeleton className="h-5 w-5 rounded shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isGenerating && insights.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center mb-4">
              <Sparkle size={32} weight="duotone" className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Generate Insights" to get AI-powered analysis of current exchange rates
            </p>
          </div>
        )}

        {!isGenerating && insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex gap-3 p-4 border rounded-lg transition-all hover:shadow-md ${getInsightBgColor(insight.type)}`}
              >
                <div className="shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {insight.currency}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-background/60 text-muted-foreground capitalize">
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {insight.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
