import { useState } from 'react'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import { useComparisonRates } from '@/hooks/use-comparison-rates'
import { useFavorites } from '@/hooks/use-favorites'
import { CurrencyConverter } from '@/components/CurrencyConverter'
import { ComparisonDateSelector } from '@/components/ComparisonDateSelector'
import { QuickStats } from '@/components/QuickStats'
import { RateAlerts } from '@/components/RateAlerts'
import { ExportMenu } from '@/components/ExportMenu'
import { CurrencyTrendChart } from '@/components/CurrencyTrendChart'
import { ExchangeRateTable } from '@/components/ExchangeRateTable'
import { ExchangeRateTableSkeleton } from '@/components/ExchangeRateTableSkeleton'
import { RateComparisonTable } from '@/components/RateComparisonTable'
import { MultiCurrencyConverter } from '@/components/MultiCurrencyConverter'
import { HistoricalCalendar } from '@/components/HistoricalCalendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowsClockwise, Bank, Warning, ChartLine, CalendarCheck, Star, ChartPieSlice, CalendarBlank } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

type ViewMode = 'current' | 'comparison' | 'analytics' | 'calendar'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('current')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  const { data, isLoading, error, refetch } = useExchangeRates()
  const comparison = useComparisonRates()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()

  const handleRefresh = async () => {
    if (viewMode === 'current' || viewMode === 'analytics') {
      toast.promise(refetch(), {
        loading: 'Fetching exchange rates...',
        success: 'Exchange rates updated successfully',
        error: 'Failed to fetch exchange rates',
      })
    } else if (viewMode === 'comparison') {
      toast.info('To refresh comparison data, try re-adding the dates.')
    }
  }

  const handleAddComparisonDate = async (date: string) => {
    toast.promise(comparison.addDate(date), {
      loading: 'Adding date to comparison...',
      success: 'Date added successfully',
      error: (err) => `Error: ${err}`
    })
  }

  const isLoadingActive = (viewMode === 'current' || viewMode === 'analytics') 
    ? isLoading 
    : comparison.isLoading

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary rounded-xl">
                <Bank size={32} weight="fill" className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  CNB Exchange Rates
                </h1>
                <p className="text-muted-foreground text-sm">
                  Czech National Bank Official Rates
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(viewMode === 'current' || viewMode === 'analytics') && !isLoading && !error && data && (
                <ExportMenu data={data} variant="outline" size="lg" />
              )}
              <Button
                onClick={handleRefresh}
                disabled={isLoadingActive}
                size="lg"
                className="gap-2"
              >
                <ArrowsClockwise 
                  size={18} 
                  weight="bold"
                  className={isLoadingActive ? 'animate-spin' : ''}
                />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-4 h-12">
              <TabsTrigger value="current" className="gap-2 text-base">
                <ChartLine size={20} weight="duotone" />
                Current Rates
              </TabsTrigger>
              <TabsTrigger value="comparison" className="gap-2 text-base">
                <CalendarCheck size={20} weight="duotone" />
                Comparison
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2 text-base">
                <ChartPieSlice size={20} weight="duotone" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2 text-base">
                <CalendarBlank size={20} weight="duotone" />
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Current Rates View */}
            <TabsContent value="current" className="space-y-8 mt-8">
              {!isLoading && !error && data && (
                <QuickStats rates={data.rates} />
              )}

              {!isLoading && !error && data && (
                <CurrencyConverter rates={data.rates} />
              )}

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-2xl">Current Exchange Rates</CardTitle>
                      {data && (
                        <CardDescription className="text-base mt-1">
                          Valid for: <span className="font-semibold text-foreground">{formatDate(data.date)}</span>
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {data && (
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          Showing {showFavoritesOnly 
                            ? `${(favorites || []).length} favorite${(favorites || []).length !== 1 ? 's' : ''}`
                            : `${data.rates.length} currencies`
                          }
                        </div>
                      )}
                      
                      {data && (
                        <Button
                          variant={showFavoritesOnly ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                          className="gap-2"
                        >
                          <Star size={16} weight={showFavoritesOnly ? "fill" : "regular"} />
                          {showFavoritesOnly ? 'Show All' : 'Watchlist'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <Warning size={20} weight="fill" />
                      <AlertTitle>Error Loading Exchange Rates</AlertTitle>
                      <AlertDescription className="mt-2">
                        {error}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                          className="mt-3 block"
                        >
                          Try Again
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {isLoading && <ExchangeRateTableSkeleton />}

                  {!isLoading && !error && data && (
                    <>
                      {showFavoritesOnly && (favorites || []).length === 0 ? (
                        <div className="text-center py-12">
                          <Star size={48} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Click the star icon next to any currency to add it to your watchlist
                          </p>
                          <Button variant="outline" onClick={() => setShowFavoritesOnly(false)}>
                            View All Currencies
                          </Button>
                        </div>
                      ) : (
                        <ExchangeRateTable 
                          rates={data.rates}
                          favorites={favorites || []}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={isFavorite}
                          showFavoritesOnly={showFavoritesOnly}
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comparison View */}
            <TabsContent value="comparison" className="space-y-8 mt-8">
              <ComparisonDateSelector
                selectedDates={comparison.comparisons.map(c => c.date)}
                onAddDate={handleAddComparisonDate}
                onClear={comparison.clear}
                isLoading={comparison.isLoading}
              />
              
              {comparison.error && (
                <Alert variant="destructive">
                  <Warning size={20} weight="fill" />
                  <AlertTitle>Comparison Error</AlertTitle>
                  <AlertDescription>{comparison.error}</AlertDescription>
                </Alert>
              )}

              <RateComparisonTable
                comparisons={comparison.comparisons}
                onRemoveDate={comparison.removeDate}
              />
            </TabsContent>

            {/* Analytics View */}
            <TabsContent value="analytics" className="space-y-8 mt-8">
              {isLoading && (
                 <div className="space-y-6">
                   <ExchangeRateTableSkeleton />
                 </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <Warning size={20} weight="fill" />
                  <AlertTitle>Error Loading Data</AlertTitle>
                  <AlertDescription className="mt-2">
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-3 block"
                    >
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading && !error && data && (
                <>
                  <QuickStats rates={data.rates} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MultiCurrencyConverter rates={data.rates} />
                    <RateAlerts rates={data.rates} />
                  </div>
                  <CurrencyTrendChart rates={data.rates} />
                </>
              )}
            </TabsContent>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-8 mt-8">
              {!isLoading && !error && data && (
                <HistoricalCalendar availableCurrencies={data.rates} />
              )}

              {isLoading && (
                <div className="space-y-6">
                  <ExchangeRateTableSkeleton />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <Warning size={20} weight="fill" />
                  <AlertTitle>Error Loading Data</AlertTitle>
                  <AlertDescription className="mt-2">
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-3 block"
                    >
                      Try Again
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Data provided by the{' '}
            <a
              href="https://www.cnb.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary"
            >
              Czech National Bank
            </a>
          </p>
          <p className="mt-1">
            Exchange rates are updated daily by CNB
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
