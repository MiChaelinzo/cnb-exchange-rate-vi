import { ExchangeRate, ExchangeRateData } from './types'

const CNB_API_BASE = 'https://api.cnb.cz/cnbapi'
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
]

let currentProxyIndex = 0
let workingProxy: string | null = null

export class CNBApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'CNBApiError'
  }
}

async function fetchWithRetry(endpoint: string, maxRetries: number = 2): Promise<Response> {
  let lastError: Error | null = null
  
  if (workingProxy) {
    try {
      const proxiedEndpoint = `${workingProxy}${encodeURIComponent(endpoint)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch(proxiedEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return response
      }
      
      if (response.status === 404) {
        throw new CNBApiError('Data not found for the specified date', 404)
      }
      
      workingProxy = null
    } catch (error) {
      if (error instanceof CNBApiError) {
        throw error
      }
      workingProxy = null
    }
  }
  
  for (let proxyAttempt = 0; proxyAttempt < CORS_PROXIES.length; proxyAttempt++) {
    const proxyIndex = (currentProxyIndex + proxyAttempt) % CORS_PROXIES.length
    const proxy = CORS_PROXIES[proxyIndex]
    const proxiedEndpoint = `${proxy}${encodeURIComponent(endpoint)}`
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        const response = await fetch(proxiedEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          currentProxyIndex = proxyIndex
          workingProxy = proxy
          return response
        }
        
        if (response.status === 404) {
          throw new CNBApiError('Data not found for the specified date', 404)
        }
        
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error
        
        if (error instanceof CNBApiError) {
          throw error
        }
        
        if (attempt < maxRetries) {
          await delay(300 * (attempt + 1))
        }
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed')
}

export async function fetchExchangeRates(date?: string): Promise<ExchangeRateData> {
  const endpoint = date 
    ? `${CNB_API_BASE}/exrates/daily/${date}?lang=EN`
    : `${CNB_API_BASE}/exrates/daily?lang=EN`

  try {
    const response = await fetchWithRetry(endpoint)
    const data = await response.json()
    
    if (!data.rates || !Array.isArray(data.rates)) {
      throw new CNBApiError('Invalid response format from CNB API')
    }

    const rates: ExchangeRate[] = data.rates.map((rate: any) => ({
      country: rate.country || 'Unknown',
      currency: rate.currency || 'Unknown',
      amount: rate.amount || 1,
      currencyCode: rate.currencyCode || 'XXX',
      rate: rate.rate || 0,
    }))

    return {
      date: data.date || new Date().toISOString().split('T')[0],
      rates,
    }
  } catch (error) {
    if (error instanceof CNBApiError) {
      throw error
    }
    
    if (error instanceof TypeError || (error as Error).message?.includes('fetch')) {
      throw new CNBApiError('Network error: Unable to connect to CNB API')
    }
    
    throw new CNBApiError('An unexpected error occurred while fetching exchange rates')
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getWorkingDates(startDate: Date, numDays: number): string[] {
  const dates: string[] = []
  let daysAdded = 0
  let daysChecked = 0
  const maxDaysToCheck = numDays * 3
  
  while (daysAdded < numDays && daysChecked < maxDaysToCheck) {
    const date = new Date(startDate)
    date.setDate(date.getDate() - daysChecked)
    
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(date.toISOString().split('T')[0])
      daysAdded++
    }
    daysChecked++
  }
  
  return dates
}

async function fetchRatesInBatches(
  dates: string[],
  batchSize: number = 2
): Promise<Map<string, ExchangeRateData>> {
  const results = new Map<string, ExchangeRateData>()
  
  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize)
    
    for (const date of batch) {
      try {
        const data = await fetchExchangeRates(date)
        results.set(date, data)
        await delay(200)
      } catch (error) {
        console.warn(`Failed to fetch data for ${date}:`, error)
      }
    }
    
    if (i + batchSize < dates.length) {
      await delay(500)
    }
  }
  
  return results
}

export async function fetchHistoricalRates(
  currencyCode: string,
  days: number = 30
): Promise<{ date: string; rate: number }[]> {
  const dates = getWorkingDates(new Date(), days)
  
  console.log(`Fetching ${days} days of historical data for ${currencyCode}...`)
  
  const rateDataMap = await fetchRatesInBatches(dates, 2)
  
  const historicalData: Array<{ date: string; rate: number }> = []
  let currencyNotFoundCount = 0
  
  dates.forEach((date) => {
    const data = rateDataMap.get(date)
    if (data) {
      const rate = data.rates.find(r => r.currencyCode === currencyCode)
      if (rate) {
        historicalData.push({
          date,
          rate: rate.rate / rate.amount,
        })
      } else {
        currencyNotFoundCount++
      }
    }
  })
  
  console.log(`Retrieved ${historicalData.length} of ${dates.length} data points for ${currencyCode}`)
  console.log(`Successfully fetched ${rateDataMap.size} of ${dates.length} date requests`)
  
  if (historicalData.length === 0) {
    if (rateDataMap.size === 0) {
      throw new CNBApiError(
        `Unable to fetch historical data due to network issues. 0 of ${dates.length} requests succeeded.\n\nThis might happen if:\n• Network connectivity issues\n• CORS proxy services are unavailable\n• CNB API is temporarily down\n\nPlease try again in a few moments or select a shorter time range.`
      )
    }
    
    if (currencyNotFoundCount > 0) {
      throw new CNBApiError(
        `No historical data found for ${currencyCode}. The currency may not be available in CNB records.\n\nThis might happen if:\n• The currency is not tracked by the Czech National Bank\n• The currency code is incorrect\n\nTry selecting a different currency like EUR, USD, or GBP.`
      )
    } else {
      throw new CNBApiError(
        `Unable to fetch historical data. ${rateDataMap.size} of ${dates.length} requests succeeded.\n\nPlease try:\n• Selecting a shorter time range (7 days)\n• Refreshing the page\n• Trying again in a few moments`
      )
    }
  }
  
  if (historicalData.length < Math.floor(dates.length * 0.3)) {
    console.warn(
      `Low data availability: ${historicalData.length} of ${dates.length} data points retrieved. Some dates may be unavailable.`
    )
  }
  
  return historicalData.reverse()
}
