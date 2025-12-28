# CNB Exchange Rate Viewer

A professional web application that displays real-time exchange rates from the Czech National Bank (CNB) API.

## Overview

This application fetches live exchange rate data from the official Czech National Bank API and displays it in a clean, professional interface with sorting capabilities and currency conversion features.

## Features

✅ **Live CNB Data** - Fetches real exchange rates from the official CNB API via CORS proxy  
✅ **Currency Converter** - Real-time currency conversion calculator using live exchange rates  
✅ **Sortable Table** - Click column headers to sort by country, currency, code, or rate  
✅ **Error Handling** - Comprehensive error states with retry mechanisms  
✅ **Loading States** - Skeleton loaders for better user experience  
✅ **Responsive Design** - Mobile-friendly interface that adapts to all screen sizes  
✅ **Professional UI** - Clean, financial-grade design with proper typography  
✅ **Type Safety** - Full TypeScript implementation with proper types  

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
│   └── ui/                          # shadcn components
├── hooks/
│   └── use-exchange-rates.ts        # Custom hook for API data fetching
├── lib/
│   ├── api.ts                       # API service layer with CNB integration
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Utility functions
└── App.tsx                          # Main application component
```

## How It Works

### CORS Proxy Solution

The CNB API doesn't allow direct browser requests due to CORS restrictions. This application solves this by using a public CORS proxy service (corsproxy.io) that acts as an intermediary:

1. Browser requests data through the CORS proxy
2. Proxy forwards the request to CNB API
3. CNB API responds with exchange rate data
4. Proxy adds proper CORS headers and forwards response to browser

The implementation is in `src/lib/api.ts`:
```typescript
const CNB_API_BASE = 'https://api.cnb.cz/cnbapi'
const CORS_PROXY = 'https://corsproxy.io/?'

const endpoint = `${CNB_API_BASE}/exrates/daily?lang=EN`
const proxiedEndpoint = `${CORS_PROXY}${encodeURIComponent(endpoint)}`
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
7. **CORS Proxy**: Enables direct browser access to CNB API without backend

## Notes & Assumptions

1. **CORS Proxy**: Uses corsproxy.io public service for CORS bypass
2. **Date Format**: Exchange rates are updated daily by CNB
3. **Currency Codes**: Uses ISO 4217 currency codes from API response
4. **Browser Support**: Targets modern browsers with ES2020+ support

## Alternative Backend Implementation

If you prefer a custom backend instead of using a CORS proxy, refer to `BACKEND_GUIDE.md` for instructions on implementing a .NET API that fetches CNB data.

## Future Enhancements

- [ ] Date picker to view historical exchange rates
- [x] Currency converter calculator ✅ **Implemented**
- [ ] Favorite currencies feature with persistence
- [ ] Charts showing rate trends over time
- [ ] Export to CSV/Excel functionality
- [ ] Multi-language support
- [ ] PWA capabilities for offline access
- [ ] Custom backend option (see BACKEND_GUIDE.md)

## License

MIT

---

**CNB Exchange Rate Viewer with Live Data**

*Fetches real-time exchange rates from the Czech National Bank API*
