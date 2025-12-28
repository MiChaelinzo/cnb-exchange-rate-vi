import { useState, useMemo } from 'react'
import { ExchangeRate } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowsLeftRight } from '@phosphor-icons/react'

interface MultiCurrencyConverterProps {
  rates: ExchangeRate[]
}

export function MultiCurrencyConverter({ rates }: MultiCurrencyConverterProps) {
  const [amount, setAmount] = useState<string>('100')

  const czkRate = 1
  const numericAmount = parseFloat(amount) || 0

  const popularCurrencies = useMemo(() => {
    const priorities = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY']
    return priorities
      .map(code => rates.find(r => r.currencyCode === code))
      .filter((r): r is ExchangeRate => r !== undefined)
  }, [rates])

  const allOtherCurrencies = useMemo(() => {
    const popularCodes = popularCurrencies.map(r => r.currencyCode)
    return rates.filter(r => !popularCodes.includes(r.currencyCode))
  }, [rates, popularCurrencies])

  const convertAmount = (rate: ExchangeRate) => {
    const normalizedRate = rate.rate / rate.amount
    const converted = numericAmount / normalizedRate
    return converted.toFixed(2)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <ArrowsLeftRight size={24} weight="duotone" className="text-accent" />
          </div>
          <div>
            <CardTitle className="text-2xl">Multi-Currency Converter</CardTitle>
            <CardDescription className="mt-1">
              Convert CZK to multiple currencies at once
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="multi-amount" className="text-base font-semibold">
            Amount in CZK
          </Label>
          <Input
            id="multi-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Enter amount..."
            className="text-2xl font-mono h-14"
          />
        </div>

        {numericAmount > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Popular Currencies
                </h3>
                <Badge variant="secondary" className="font-mono">
                  {amount} CZK
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularCurrencies.map((rate) => (
                  <div
                    key={rate.currencyCode}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">
                            {rate.currencyCode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {rate.currency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {rate.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-xl">
                          {convertAmount(rate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Rate: {(rate.rate / rate.amount).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                All Other Currencies
              </h3>
              <ScrollArea className="h-[300px] rounded-lg border border-border">
                <div className="p-3 space-y-2">
                  {allOtherCurrencies.map((rate) => (
                    <div
                      key={rate.currencyCode}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-base">
                          {rate.currencyCode}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{rate.currency}</p>
                          <p className="text-xs text-muted-foreground">{rate.country}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-lg">
                          {convertAmount(rate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {numericAmount === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Enter an amount in CZK to see conversions</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
