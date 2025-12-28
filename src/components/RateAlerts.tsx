import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { ExchangeRate } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Plus, Trash, TrendUp, TrendDown, CheckCircle, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface RateAlert {
  id: string
  currencyCode: string
  targetRate: number
  condition: 'above' | 'below'
  createdAt: string
}

interface RateAlertsProps {
  rates: ExchangeRate[]
}

export function RateAlerts({ rates }: RateAlertsProps) {
  const [alerts, setAlerts, deleteAlerts] = useKV<RateAlert[]>('rate-alerts', [])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [targetRate, setTargetRate] = useState<string>('')
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [checkedAlerts, setCheckedAlerts] = useKV<string[]>('checked-alerts', [])

  const sortedRates = useMemo(() => {
    return [...rates].sort((a, b) => 
      a.currencyCode.localeCompare(b.currencyCode)
    )
  }, [rates])

  const triggeredAlerts = useMemo(() => {
    if (!alerts || alerts.length === 0) return []
    
    return alerts.filter(alert => {
      const rate = rates.find(r => r.currencyCode === alert.currencyCode)
      if (!rate) return false
      
      const currentRate = rate.rate / rate.amount
      
      if (alert.condition === 'above') {
        return currentRate >= alert.targetRate
      } else {
        return currentRate <= alert.targetRate
      }
    })
  }, [alerts, rates])

  useEffect(() => {
    if (triggeredAlerts.length > 0) {
      triggeredAlerts.forEach(alert => {
        if (!(checkedAlerts || []).includes(alert.id)) {
          const rate = rates.find(r => r.currencyCode === alert.currencyCode)
          if (rate) {
            const currentRate = (rate.rate / rate.amount).toFixed(4)
            toast.success(
              `Rate Alert: ${alert.currencyCode} is ${alert.condition} ${alert.targetRate.toFixed(4)}`,
              {
                description: `Current rate: ${currentRate} CZK`,
                duration: 10000,
              }
            )
            setCheckedAlerts((current) => [...(current || []), alert.id])
          }
        }
      })
    }
  }, [triggeredAlerts, checkedAlerts, rates, setCheckedAlerts])

  const handleAddAlert = () => {
    if (!selectedCurrency || !targetRate) {
      toast.error('Please select a currency and enter a target rate')
      return
    }

    const numericRate = parseFloat(targetRate)
    if (isNaN(numericRate) || numericRate <= 0) {
      toast.error('Please enter a valid positive number for the target rate')
      return
    }

    const newAlert: RateAlert = {
      id: `${Date.now()}-${Math.random()}`,
      currencyCode: selectedCurrency,
      targetRate: numericRate,
      condition,
      createdAt: new Date().toISOString(),
    }

    setAlerts((current) => [...(current || []), newAlert])
    
    toast.success('Rate alert created', {
      description: `You'll be notified when ${selectedCurrency} goes ${condition} ${numericRate.toFixed(4)} CZK`
    })

    setSelectedCurrency('')
    setTargetRate('')
  }

  const handleRemoveAlert = (id: string) => {
    setAlerts((current) => (current || []).filter(a => a.id !== id))
    setCheckedAlerts((current) => (current || []).filter(aid => aid !== id))
    toast.info('Alert removed')
  }

  const getCurrentRate = (currencyCode: string): number | null => {
    const rate = rates.find(r => r.currencyCode === currencyCode)
    return rate ? rate.rate / rate.amount : null
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Rate Alerts</CardTitle>
            <CardDescription className="mt-1">
              Get notified when exchange rates reach your target
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {triggeredAlerts.length > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle size={20} weight="fill" className="text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{triggeredAlerts.length}</strong> {triggeredAlerts.length === 1 ? 'alert has' : 'alerts have'} been triggered!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="font-semibold text-sm">Create New Alert</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alert-currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger id="alert-currency">
                  <SelectValue placeholder="Select currency..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedRates.map((rate) => (
                    <SelectItem key={rate.currencyCode} value={rate.currencyCode}>
                      {rate.currencyCode} - {rate.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-condition">Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as 'above' | 'below')}>
                <SelectTrigger id="alert-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    <div className="flex items-center gap-2">
                      <TrendUp size={16} />
                      <span>Goes Above</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="below">
                    <div className="flex items-center gap-2">
                      <TrendDown size={16} />
                      <span>Goes Below</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-rate">Target Rate (CZK)</Label>
            <Input
              id="alert-rate"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 23.5000"
              value={targetRate}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setTargetRate(value)
                }
              }}
              className="font-mono"
            />
            {selectedCurrency && getCurrentRate(selectedCurrency) !== null && (
              <p className="text-xs text-muted-foreground">
                Current rate: <span className="font-mono font-semibold">
                  {getCurrentRate(selectedCurrency)?.toFixed(4)} CZK
                </span>
              </p>
            )}
          </div>

          <Button 
            onClick={handleAddAlert}
            disabled={!selectedCurrency || !targetRate}
            className="w-full gap-2"
          >
            <Plus size={18} weight="bold" />
            Create Alert
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Active Alerts ({(alerts || []).length})</h3>
          
          {(!alerts || alerts.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell size={48} weight="duotone" className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No alerts created yet</p>
              <p className="text-xs mt-1">Create an alert to get notified when rates change</p>
            </div>
          )}

          {alerts && alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const currentRate = getCurrentRate(alert.currencyCode)
                const isTriggered = triggeredAlerts.some(t => t.id === alert.id)
                
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isTriggered 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono font-semibold">
                            {alert.currencyCode}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {alert.condition === 'above' ? '≥' : '≤'}
                          </span>
                          <span className="font-mono font-bold">
                            {alert.targetRate.toFixed(4)} CZK
                          </span>
                          {isTriggered && (
                            <Badge className="bg-green-600 text-white">
                              Triggered
                            </Badge>
                          )}
                        </div>
                        {currentRate !== null && (
                          <div className="text-xs text-muted-foreground">
                            Current: <span className="font-mono font-semibold">
                              {currentRate.toFixed(4)} CZK
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAlert(alert.id)}
                        className="flex-shrink-0"
                      >
                        <Trash size={18} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {alerts && alerts.length > 0 && (
          <Alert>
            <Info size={20} />
            <AlertDescription className="text-sm">
              Alerts are checked when you refresh exchange rates. They persist across sessions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
