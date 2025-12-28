import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, DownloadSimple, Sparkle } from '@phosphor-icons/react'
import { ExchangeRate } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AiReportGeneratorProps {
  rates: ExchangeRate[]
  date: string
}

export function AiReportGenerator({ rates, date }: AiReportGeneratorProps) {
  const [report, setReport] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReport = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const topRates = rates.slice(0, 15).map(r => ({
        code: r.currencyCode,
        country: r.country,
        currency: r.currency,
        rate: r.rate,
        amount: r.amount
      }))

      const sortedByRate = [...rates].sort((a, b) => b.rate - a.rate)
      const strongest = sortedByRate.slice(0, 3)
      const weakest = sortedByRate.slice(-3).reverse()

      const promptText = `You are a professional financial analyst. Generate a comprehensive market analysis report about Czech National Bank exchange rates for ${date}.

Top Currencies:
${JSON.stringify(topRates, null, 2)}

Strongest vs CZK:
${JSON.stringify(strongest.map(r => ({ code: r.currencyCode, rate: r.rate })), null, 2)}

Weakest vs CZK:
${JSON.stringify(weakest.map(r => ({ code: r.currencyCode, rate: r.rate })), null, 2)}

Generate a professional market report with the following structure:

# Exchange Rate Market Report
## Date: ${date}

### Executive Summary
(2-3 sentences overview of the current market situation)

### Key Findings
- Finding 1 about major currencies
- Finding 2 about trends
- Finding 3 about notable movements

### Currency Analysis
#### Major Currencies (USD, EUR, GBP)
(Brief analysis of major currencies performance)

#### Strongest Performers
(Analysis of currencies showing strength against CZK)

#### Weakest Performers
(Analysis of currencies showing weakness against CZK)

### Market Outlook
(2-3 sentences about what this data suggests for traders and travelers)

### Recommendations
- Recommendation for travelers
- Recommendation for traders
- Recommendation for businesses

Keep the report professional, concise, and data-driven. Use specific numbers from the data provided.`

      const response = await window.spark.llm(promptText, 'gpt-4o', false)
      setReport(response)
    } catch (err) {
      console.error('Report generation error:', err)
      setError('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = () => {
    if (!report) return

    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CNB-Exchange-Rate-Report-${date}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadTextReport = () => {
    if (!report) return

    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CNB-Exchange-Rate-Report-${date}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg">
              <FileText size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Market Report</CardTitle>
              <CardDescription className="text-base mt-1">
                Generate professional analysis of current exchange rates
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {report && (
              <>
                <Button
                  onClick={downloadTextReport}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <DownloadSimple size={18} weight="bold" />
                  Download TXT
                </Button>
                <Button
                  onClick={downloadReport}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <DownloadSimple size={18} weight="bold" />
                  Download MD
                </Button>
              </>
            )}
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              <Sparkle size={18} weight="bold" className={isGenerating ? 'animate-pulse' : ''} />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isGenerating && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <div className="space-y-2 mt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-6 w-1/3 mt-6" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        )}

        {!isGenerating && !report && !error && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center mb-4">
              <FileText size={32} weight="duotone" className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Report Generated</h3>
            <p className="text-muted-foreground mb-4">
              Click "Generate Report" to create a comprehensive market analysis
            </p>
          </div>
        )}

        {!isGenerating && report && (
          <ScrollArea className="h-[500px] rounded-lg border bg-muted/30 p-6">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {report}
              </pre>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
