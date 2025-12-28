import { useState } from 'react'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import { useComparisonRates } from '@/hooks/use-comparison-rates'
import { useFavorites } from '@/hooks/use-favorites'
import { CurrencyConverter } from '@/components/CurrencyConverter'
import { ComparisonDateSelector } from '@/components/ComparisonDateSelector'
import { CustomTemplateBuilder } from '@/components/CustomTemplate
import { ComparisonReportExport } from '@/components/ComparisonRepor
import { QuickStats } from '@/components/QuickStats'
import { RateAlerts } from '@/components/RateAlerts'
import { ExportMenu } from '@/components/ExportMenu'
import { AiCurrencyPredictions } from '@/components/
import { AccuracyTrendAnalytics } from '@/components/AccuracyTrendAnalytics'
import { CurrencyHeatmap } from '@/components/Curren
import { AiInsights } from '@/components/AiInsights'
import { CollaborationDashboard } from '@/components/Collabora
import { AiReportGenerator } from '@/components/AiReportGenerator'
import { Card, CardContent, CardDescription, Ca
import { ArrowsClockwise, Bank, Warning, ChartLine, CalendarCheck, Star, Ch
import { Toaster } from '@/components/ui/sonner'


import { formatDate } from '@/lib/utils'
  const [showFavoritesOnly, setShowFavoritesOnly
import { toast } from 'sonner'

  const { favorites, clearFavorites } = useFavorites()

function App() {
    if (viewMode === 'current' || viewMode === 'analytics' || viewMode === 'ai') 
        loading: 'Fetching exchange rates...',
        error: 'Failed to fetch exchange rates',
    } else if (viewMode === 'comparison') {
        loading: 'Refreshing comparison d
        error: 'Failed to refresh comparison data',

  const handleRefresh = async () => {
    toast.promise(comparison.addDate(date), {
      toast.promise(refetch(), {
    })
        success: 'Exchange rates updated successfully',
    comparison.clear()
      })
    toast.pr
      success: `Template applied successfully!
    })

    <div className="min-h-screen bg-gradient-to-br 
      })
     
  }

              <div>
                  CNB Exchange Rates
                <p className="text-muted-foreground 
                </p>
            </div>
      
   

  return (
                <ExportMenu data={data} variant="outline" size="lg" />
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex flex-col gap-4">
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
              <T
              <Button
                onClick={handleRefresh}
                disabled={(viewMode === 'current' || viewMode === 'analytics') && isLoading || (viewMode === 'comparison' && comparison.isLoading)}
                size="lg"
                className="gap-2"
              >
                <ArrowsClockwise 
                  size={18} 
                  weight="bold"
                  className={((viewMode === 'current' || viewMode === 'analytics') && isLoading) || (viewMode === 'comparison' && comparison.isLoading) ? 'animate-spin' : ''}
                />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12">
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
            </TabsList>

            <TabsContent value="current" className="space-y-8 mt-8">
              {!isLoading && !error && data && (
                <QuickStats rates={data.rates} />
              )}

              {!isLoading && !error && data && (
                <CurrencyConverter rates={data.rates} />
              )}

              {!isLoading && !error && data && (
                <CurrencyTrendChart rates={data.rates} />
              )}

                      )}
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-2xl">Current Exchange Rates</CardTitle>
                      {data && (
                        <CardDescription className="text-base mt-1">
                          Valid for: <span className="font-semibold text-foreground">{formatDate(data.date)}</span>
                  <ComparisonReportExport 
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {data && (
                        <div className="text-sm text-muted-foreground">

                            ? `${(favorites || []).length} favorite${(favorites || []).length !== 1 ? 's' : ''}`
                            : `${data.rates.length} currencies`
                          }
                        </div>
                      )}
                error={comparison.error}
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
                      {data && (
                        <ExportMenu data={data} variant="ghost" size="sm" />
                      )}
              )}
                  </div>
                  <ExchangeRa
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <Warning size={20} weight="fill" />
                      <AlertTitle>Error Loading Exchange Rates</AlertTitle>
                      <AlertDescription className="mt-2">
                        {error}
                      Try Again
                          variant="outline"
                          size="sm"
                          onClick={handleRefresh}
                          className="mt-3"
                        >
                          Try Again
                        </Button>
                      </AlertDescription>
                    </Alert>


                  {isLoading && <ExchangeRateTableSkeleton />}

                <Alert variant="destructive">
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
                </>
                      )}
              )}
                  )}
              <CollaborationDa
              </Card>
              

            <TabsContent value="comparison" className="space-y-8 mt-8">
              <ComparisonDateSelector
                selectedDates={comparison.comparisons.map(c => c.date)}
                onAddDate={handleAddComparisonDate}
                  </CardHeader>
                onClear={comparison.clear}
                      showFavoritesOnly={false}
                error={comparison.error}
              )}

              <RateComparisonTable
                comparisons={comparison.comparisons}
                }}
              />
        </div>

            <TabsContent value="analytics" className="space-y-8 mt-8">
              {!isLoading && !error && data && (
              rel=
                  <QuickStats rates={data.rates} />
            </a>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MultiCurrencyConverter rates={data.rates} />
                    <RateAlerts rates={data.rates} />
  )

                  <CurrencyTrendChart rates={data.rates} />
                </>


              {isLoading && (
                <div className="space-y-6">
                  <ExchangeRateTableSkeleton />
                </div>



                <Alert variant="destructive">
                  <Warning size={20} weight="fill" />
                  <AlertTitle>Error Loading Data</AlertTitle>
                  <AlertDescription className="mt-2">
                    {error}

                      variant="outline"

                      onClick={handleRefresh}
                      className="mt-3"
                    >
                      Try Again
                    </Button>

                </Alert>

            </TabsContent>

        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">

            Data provided by the{' '}

              href="https://www.cnb.cz"

              rel="noopener noreferrer"

            >

            </a>

          <p className="mt-1">
            Exchange rates are updated daily by CNB
          </p>

      </div>

  )


