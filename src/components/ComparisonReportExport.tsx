import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FilePdf, Download, Gear, CheckSquare } from '@phosphor-icons/react'
import { ComparisonReportGenerator } from '@/lib/comparison-report-generator'
import { ComparisonDataPoint } from '@/hooks/use-comparison-rates'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ComparisonReportExportProps {
  comparisons: ComparisonDataPoint[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ComparisonReportExport({ 
  comparisons, 
  variant = 'default',
  size = 'default' 
}: ComparisonReportExportProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeDetailedStats, setIncludeDetailedStats] = useState(true)
  const [showCurrencyFilter, setShowCurrencyFilter] = useState(false)
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const allCurrencies = Array.from(
    new Set(
      comparisons.flatMap(comp => 
        comp.data.rates.map(rate => rate.currencyCode)
      )
    )
  ).sort()

  if (comparisons.length === 0) {
    return null
  }

  const handleQuickExport = async () => {
    setIsExporting(true)
    try {
      const generator = new ComparisonReportGenerator()
      await generator.downloadReport(comparisons, undefined, {
        includeCharts: true,
        includeDetailedStats: true,
      })
      toast.success('PDF comparison report downloaded successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCustomExport = async () => {
    setIsExporting(true)
    setShowOptions(false)
    try {
      const generator = new ComparisonReportGenerator()
      await generator.downloadReport(comparisons, undefined, {
        includeCharts,
        includeDetailedStats,
        selectedCurrencies: showCurrencyFilter && selectedCurrencies.length > 0 
          ? selectedCurrencies 
          : undefined,
      })
      toast.success('PDF comparison report downloaded successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF report')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleCurrency = (code: string) => {
    setSelectedCurrencies(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  const selectAllCurrencies = () => {
    setSelectedCurrencies(allCurrencies)
  }

  const deselectAllCurrencies = () => {
    setSelectedCurrencies([])
  }

  const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']
  const selectMajorCurrencies = () => {
    setSelectedCurrencies(allCurrencies.filter(c => majorCurrencies.includes(c)))
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            className="gap-2"
            disabled={isExporting}
          >
            <FilePdf size={18} weight="duotone" />
            {isExporting ? 'Generating...' : 'Export Comparison'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleQuickExport} disabled={isExporting}>
            <Download size={16} className="mr-2" weight="duotone" />
            Quick Export (Full Report)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowOptions(true)} disabled={isExporting}>
            <Gear size={16} className="mr-2" weight="duotone" />
            Custom Export Options
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePdf size={24} weight="duotone" className="text-primary" />
              Custom Comparison Report Options
            </DialogTitle>
            <DialogDescription>
              Customize your multi-period exchange rate comparison PDF report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="include-charts" className="text-base font-semibold">
                  Include Charts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Visual trend charts showing rate changes over time
                </p>
              </div>
              <Switch
                id="include-charts"
                checked={includeCharts}
                onCheckedChange={setIncludeCharts}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="include-stats" className="text-base font-semibold">
                  Detailed Statistics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Complete breakdown with volatility and trend analysis
                </p>
              </div>
              <Switch
                id="include-stats"
                checked={includeDetailedStats}
                onCheckedChange={setIncludeDetailedStats}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="filter-currencies" className="text-base font-semibold">
                  Filter Currencies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select specific currencies to include in report
                </p>
              </div>
              <Switch
                id="filter-currencies"
                checked={showCurrencyFilter}
                onCheckedChange={setShowCurrencyFilter}
              />
            </div>

            {showCurrencyFilter && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Select Currencies ({selectedCurrencies.length} selected)
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectMajorCurrencies}
                      className="h-7 text-xs"
                    >
                      Major
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllCurrencies}
                      className="h-7 text-xs"
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllCurrencies}
                      className="h-7 text-xs"
                    >
                      None
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[200px] w-full rounded-md border bg-background p-3">
                  <div className="grid grid-cols-3 gap-3">
                    {allCurrencies.map(code => (
                      <div key={code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`currency-${code}`}
                          checked={selectedCurrencies.includes(code)}
                          onCheckedChange={() => toggleCurrency(code)}
                        />
                        <label
                          htmlFor={`currency-${code}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {code}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="text-sm font-semibold mb-2">Report Will Include:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Overview metrics and key statistics</li>
                <li>✓ Time period summary ({comparisons.length} dates)</li>
                <li>✓ Currency rate comparison table</li>
                {includeCharts && <li>✓ Rate trend visualizations</li>}
                <li>✓ Volatility analysis (top 10 most volatile)</li>
                <li>✓ Trend analysis (gainers & losers)</li>
                {includeDetailedStats && <li>✓ Detailed currency statistics</li>}
                {showCurrencyFilter && selectedCurrencies.length > 0 && (
                  <li>✓ Filtered to {selectedCurrencies.length} selected currencies</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowOptions(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCustomExport}
              disabled={isExporting || (showCurrencyFilter && selectedCurrencies.length === 0)}
              className="gap-2"
            >
              <FilePdf size={18} weight="duotone" />
              {isExporting ? 'Generating...' : 'Generate PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
