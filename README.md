# CNB Exchange Rate Viewer

A professional web application that displays real-time exchange rates from the Czech National Bank (CNB) API.

## Overview

This application fetches live exchange rate data from the official Czech National Bank API and displays it in a clean, professional interface with sorting capabilities and currency conversion features.

## Features

✅ **Live CNB Data** - Fetches real exchange rates from the official CNB API with fallback proxy support  
✅ **Currency Converter** - Real-time currency conversion calculator using live exchange rates  
✅ **Historical Charts** - Interactive trend analysis with multiple chart types (line, bar, area, change)  
✅ **Sortable Table** - Click column headers to sort by country, currency, code, or rate  
✅ **Error Handling** - Comprehensive error states with retry mechanisms and fallback strategies  
✅ **Loading States** - Skeleton loaders for better user experience  
✅ **Responsive Design** - Mobile-friendly interface that adapts to all screen sizes  
✅ **Professional UI** - Clean, financial-grade design with proper typography  
✅ **Type Safety** - Full TypeScript implementation with proper types  
✅ **Batch Processing** - Optimized historical data fetching with parallel batch requests  

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Phosphor Icons
- **Build Tool**: Vite 7
- **API**: Czech National Bank Official API with CORS proxy

## Architecture

```
src/
├── components/
│   ├── ExchangeRateTable.tsx       # Main table component with sorting
│   ├── ExchangeRateTableSkeleton.tsx # Loading skeleton
│   ├── CurrencyConverter.tsx       # Currency conversion calculator
│   ├── CurrencyTrendChart.tsx      # Historical trend visualization
│   └── ui/                          # shadcn components
├── hooks/
│   ├── use-exchange-rates.ts        # Custom hook for API data fetching
│   └── use-historical-rates.ts      # Custom hook for historical data
├── lib/
│   ├── api.ts                       # API service layer with CNB integration
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Utility functions
└── App.tsx                          # Main application component
```

## How It Works

### Multi-Proxy Fallback System

The CNB API doesn't allow direct browser requests due to CORS restrictions. This application uses an intelligent multi-proxy system with automatic fallback:

**Primary Proxies**:
1. `https://corsproxy.io/` - Fast, reliable CORS proxy
2. `https://api.allorigins.win/raw?url=` - Backup proxy service

**How It Works**:
1. Browser requests data through the active CORS proxy
2. Proxy forwards the request to CNB API
3. CNB API responds with exchange rate data
4. Proxy adds proper CORS headers and forwards response to browser
5. If a proxy fails, automatically switches to the next available proxy

**Retry Logic**:
- Each request attempts up to 2 retries per proxy
- 10-second timeout on each request
- Exponential backoff between retries (500ms, 1000ms)
- Automatically remembers the working proxy for subsequent requests

The implementation is in `src/lib/api.ts`:
```typescript
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

async function fetchWithRetry(endpoint: string, maxRetries: number = 2) {
  // Tries each proxy with retries until successful
  for (let proxyAttempt = 0; proxyAttempt < CORS_PROXIES.length; proxyAttempt++) {
    // ... retry logic with timeout and exponential backoff
  }
}
```

### CNB API Endpoints

**Current rates**:
```
https://api.cnb.cz/cnbapi/exrates/daily?lang=EN
```

**Historical rates**:
```
https://api.cnb.cz/cnbapi/exrates/daily/{date}?lang=EN
```

**CNB API Documentation**: https://api.cnb.cz/cnbapi/swagger-ui.html

## Error Handling

The application implements comprehensive error handling:

- **Network Errors**: Displayed with user-friendly messages and retry option
- **API Errors**: HTTP status codes handled with appropriate messaging
- **Invalid Data**: Validates API response structure before rendering
- **Loading States**: Shows skeleton loaders during data fetch

## Key Implementation Details

### Custom Hook Pattern
The `useExchangeRates` hook encapsulates all data fetching logic, providing:
- Loading states
- Error states
- Data state
- Refetch functionality

### API Service Layer
The `api.ts` module provides:
- Typed API responses
- Custom error classes
- Proper error propagation
- Request configuration

### Sorting Functionality
The table component implements client-side sorting:
- Click any column header to sort
- Toggle between ascending/descending
- Visual indicators for active sort
- Type-aware sorting (string vs number)

### Currency Converter
The converter component provides:
- Real-time conversion between any two currencies
- Automatic calculation on input change
- Support for all CNB currencies plus CZK
- Swap functionality to reverse conversion direction
- Clear visual feedback of conversion results
- Cross-currency conversion via CZK base rate

### Historical Trend Charts
The chart component provides:
- Interactive visualization of currency trends over time
- Multiple chart types: Line, Bar, Area, and Daily Change
- Customizable time ranges: 7, 14, 30, 60, or 90 days
- Detailed trend analysis with statistics:
  - Overall trend percentage and direction
  - Maximum daily increase and decrease
  - Average daily change and volatility
  - Count of positive, negative, and stable days
- Optimized batch fetching of historical data
- Parallel processing of multiple date requests
- Automatic exclusion of weekends (non-trading days)
- Rich tooltips showing rate changes between days
- Color-coded trend indicators (green for up, red for down)
- Responsive design that adapts to mobile screens

## Build & Run Instructions

### Prerequisites
- Node.js 18+ installed
- npm or compatible package manager

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## Design Decisions

1. **Professional Financial Theme**: Blue color palette conveys trust and stability
2. **IBM Plex Sans Font**: Technical typeface optimized for data display
3. **JetBrains Mono**: Monospace font for currency codes and numbers
4. **Generous Spacing**: Improves readability of numerical data
5. **Subtle Animations**: Measured transitions that feel professional
6. **High Contrast**: WCAG AA compliant color combinations
7. **Multi-Proxy Fallback**: Intelligent proxy switching for maximum reliability
8. **Batch Processing**: Parallel historical data fetching for better performance
9. **Smart Caching**: Remembers working proxy to reduce latency
10. **Comprehensive Analytics**: Rich trend analysis with multiple visualization types

## Notes & Assumptions

1. **Multi-Proxy System**: Uses multiple CORS proxy services with automatic fallback
2. **Batch Processing**: Fetches historical data in parallel batches of 3 for optimal performance
3. **Date Format**: Exchange rates are updated daily by CNB (excludes weekends)
4. **Currency Codes**: Uses ISO 4217 currency codes from API response
5. **Browser Support**: Targets modern browsers with ES2020+ support
6. **Timeout Handling**: 10-second timeout per request with automatic retry
7. **Data Validation**: Validates API responses before rendering to prevent errors

## Alternative Backend Implementation

If you prefer a custom backend instead of using a CORS proxy, refer to `BACKEND_GUIDE.md` for instructions on implementing a .NET API that fetches CNB data.

## Future Enhancements

- [ ] Date picker to view historical exchange rates
- [x] Currency converter calculator ✅ **Implemented**
- [x] Charts showing rate trends over time ✅ **Implemented**
- [ ] Favorite currencies feature with persistence
- [ ] Export to CSV/Excel functionality
- [ ] Multi-language support
- [ ] PWA capabilities for offline access
- [ ] Custom backend option (see BACKEND_GUIDE.md)
- [ ] Rate change notifications/alerts
- [ ] Compare multiple currencies on one chart

## License

MIT

---

**CNB Exchange Rate Viewer with Live Data**

*Fetches real-time exchange rates from the Czech National Bank API*
