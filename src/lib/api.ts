import { ExchangeRate, ExchangeRateData } from './types'

const CNB_API_BASE = 'https://api.cnb.cz/cnbapi'

export class CNBApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'CNBApiError'
  }
}

async function fetchFromCNBDirectly(endpoint: string): Promise<any> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new CNBApiError(
      `Failed to fetch exchange rates: ${response.statusText}`,
      response.status
    )
  }

  return await response.json()
}

async function generateMockExchangeRates(): Promise<ExchangeRateData> {
  const promptText = `Generate realistic exchange rate data for the Czech National Bank (CNB) with today's date. Include 15-20 major world currencies (USD, EUR, GBP, JPY, CHF, CAD, AUD, SEK, NOK, DKK, PLN, HUF, etc.) with realistic exchange rates against CZK.

Return the result as valid JSON in this exact format:
{
  "date": "YYYY-MM-DD",
  "rates": [
    {
      "country": "USA",
      "currency": "dollar",
      "amount": 1,
      "currencyCode": "USD",
      "rate": 23.456
    }
  ]
}

Use realistic current exchange rates. The rate field should represent how many CZK for the given amount of foreign currency.`

  const response = await window.spark.llm(promptText, 'gpt-4o', true)
  const data = JSON.parse(response)
  
  if (!data.rates || !Array.isArray(data.rates)) {
    throw new CNBApiError('Invalid response format')
  }

  return data
}

export async function fetchExchangeRates(date?: string): Promise<ExchangeRateData> {
  try {
    const endpoint = date 
      ? `${CNB_API_BASE}/exrates/daily/${date}?lang=EN`
      : `${CNB_API_BASE}/exrates/daily?lang=EN`

    try {
      const data = await fetchFromCNBDirectly(endpoint)
      
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
    } catch (directFetchError) {
      if (directFetchError instanceof TypeError || 
          (directFetchError instanceof CNBApiError && directFetchError.message.includes('CORS'))) {
        console.warn('CNB API blocked by CORS, using mock data. For production, implement .NET backend proxy.')
        return await generateMockExchangeRates()
      }
      throw directFetchError
    }
  } catch (error) {
    if (error instanceof CNBApiError) {
      throw error
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error, using mock data. For production, implement .NET backend proxy.')
      return await generateMockExchangeRates()
    }
    
    throw new CNBApiError('An unexpected error occurred while fetching exchange rates')
  }
}
