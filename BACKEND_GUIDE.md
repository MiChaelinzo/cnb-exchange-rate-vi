# .NET Backend Implementation Guide

This guide provides step-by-step instructions for implementing the required .NET backend API to complete the Omnixient Technical Assessment.

## Overview

The CNB API does not allow direct browser requests due to CORS restrictions. Your .NET backend will:
1. Fetch exchange rate data from the CNB API
2. Parse and transform the data
3. Expose it through a REST endpoint that the frontend can consume

## Prerequisites

- .NET 6, 7, or 8 SDK installed
- Visual Studio, VS Code, or Rider (optional)
- Basic understanding of ASP.NET Core Web API

## Step 1: Create the .NET Web API Project

```bash
# Create a new Web API project
dotnet new webapi -n CNBExchangeRateAPI
cd CNBExchangeRateAPI

# Add required packages
dotnet add package Microsoft.Extensions.Http
```

## Step 2: Project Structure

Organize your project with clean architecture:

```
CNBExchangeRateAPI/
├── Controllers/
│   └── ExchangeRatesController.cs
├── Services/
│   ├── IExchangeRateProvider.cs
│   └── ExchangeRateProvider.cs
├── Models/
│   ├── ExchangeRate.cs
│   └── ExchangeRateData.cs
├── Program.cs
└── appsettings.json
```

## Step 3: Define Data Models

Create `Models/ExchangeRate.cs`:

```csharp
namespace CNBExchangeRateAPI.Models
{
    public class ExchangeRate
    {
        public string Country { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal Rate { get; set; }
    }
}
```

Create `Models/ExchangeRateData.cs`:

```csharp
namespace CNBExchangeRateAPI.Models
{
    public class ExchangeRateData
    {
        public string Date { get; set; } = string.Empty;
        public List<ExchangeRate> Rates { get; set; } = new();
    }
}
```

## Step 4: Create the CNB API Response Models

The CNB API returns data in a specific format. Create models to deserialize it:

```csharp
namespace CNBExchangeRateAPI.Models.CNB
{
    // CNB API response structure
    public class CNBApiResponse
    {
        public List<CNBRate> Rates { get; set; } = new();
    }

    public class CNBRate
    {
        public int ValidFor { get; set; }
        public int Order { get; set; }
        public string Country { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public decimal Rate { get; set; }
    }
}
```

## Step 5: Implement the Exchange Rate Provider Service

Create `Services/IExchangeRateProvider.cs`:

```csharp
using CNBExchangeRateAPI.Models;

namespace CNBExchangeRateAPI.Services
{
    public interface IExchangeRateProvider
    {
        Task<ExchangeRateData> GetExchangeRatesAsync(string? date = null);
    }
}
```

Create `Services/ExchangeRateProvider.cs`:

```csharp
using CNBExchangeRateAPI.Models;
using CNBExchangeRateAPI.Models.CNB;
using System.Text.Json;

namespace CNBExchangeRateAPI.Services
{
    public class ExchangeRateProvider : IExchangeRateProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExchangeRateProvider> _logger;
        private readonly IConfiguration _configuration;

        public ExchangeRateProvider(
            HttpClient httpClient, 
            ILogger<ExchangeRateProvider> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ExchangeRateData> GetExchangeRatesAsync(string? date = null)
        {
            try
            {
                var baseUrl = _configuration["CNB:ApiBaseUrl"] 
                    ?? "https://api.cnb.cz/cnbapi";
                
                var endpoint = string.IsNullOrEmpty(date)
                    ? $"{baseUrl}/exrates/daily?lang=EN"
                    : $"{baseUrl}/exrates/daily/{date}?lang=EN";

                _logger.LogInformation("Fetching exchange rates from CNB API: {Endpoint}", endpoint);

                var response = await _httpClient.GetAsync(endpoint);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                
                // Parse the CNB response
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                var cnbResponse = JsonSerializer.Deserialize<CNBApiResponse>(content, options);

                if (cnbResponse?.Rates == null || !cnbResponse.Rates.Any())
                {
                    throw new InvalidOperationException("No exchange rates returned from CNB API");
                }

                // Transform to our model
                var result = new ExchangeRateData
                {
                    Date = date ?? DateTime.Now.ToString("yyyy-MM-dd"),
                    Rates = cnbResponse.Rates.Select(r => new ExchangeRate
                    {
                        Country = r.Country,
                        Currency = r.Currency,
                        Amount = r.Amount,
                        CurrencyCode = r.CurrencyCode,
                        Rate = r.Rate
                    }).ToList()
                };

                _logger.LogInformation("Successfully fetched {Count} exchange rates", result.Rates.Count);
                
                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Network error while fetching exchange rates from CNB API");
                throw new InvalidOperationException("Failed to connect to CNB API", ex);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to parse CNB API response");
                throw new InvalidOperationException("Invalid response format from CNB API", ex);
            }
        }
    }
}
```

## Step 6: Create the REST Controller

Create `Controllers/ExchangeRatesController.cs`:

```csharp
using CNBExchangeRateAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CNBExchangeRateAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExchangeRatesController : ControllerBase
    {
        private readonly IExchangeRateProvider _provider;
        private readonly ILogger<ExchangeRatesController> _logger;

        public ExchangeRatesController(
            IExchangeRateProvider provider, 
            ILogger<ExchangeRatesController> logger)
        {
            _provider = provider;
            _logger = logger;
        }

        /// <summary>
        /// Get current or historical exchange rates from CNB
        /// </summary>
        /// <param name="date">Optional date in YYYY-MM-DD format</param>
        /// <returns>Exchange rate data</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetExchangeRates([FromQuery] string? date = null)
        {
            try
            {
                // Validate date format if provided
                if (!string.IsNullOrEmpty(date) && 
                    !DateTime.TryParseExact(date, "yyyy-MM-dd", null, 
                        System.Globalization.DateTimeStyles.None, out _))
                {
                    return BadRequest(new { error = "Invalid date format. Use YYYY-MM-DD" });
                }

                var rates = await _provider.GetExchangeRatesAsync(date);
                return Ok(rates);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Error fetching exchange rates");
                return StatusCode(500, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error fetching exchange rates");
                return StatusCode(500, new { error = "An unexpected error occurred" });
            }
        }
    }
}
```

## Step 7: Configure Services in Program.cs

Update `Program.cs`:

```csharp
using CNBExchangeRateAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register HttpClient for ExchangeRateProvider
builder.Services.AddHttpClient<IExchangeRateProvider, ExchangeRateProvider>();

// Configure CORS to allow frontend requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",  // Vite dev server
            "http://localhost:3000"   // Alternative frontend port
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
```

## Step 8: Update appsettings.json

Add configuration for the CNB API:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "CNB": {
    "ApiBaseUrl": "https://api.cnb.cz/cnbapi"
  }
}
```

## Step 9: Run and Test the Backend

```bash
# Run the application
dotnet run

# The API will be available at:
# https://localhost:5001/api/exchangerates (HTTPS)
# http://localhost:5000/api/exchangerates (HTTP)

# Test with curl:
curl https://localhost:5001/api/exchangerates

# Test with specific date:
curl "https://localhost:5001/api/exchangerates?date=2025-01-15"

# Or visit Swagger UI:
# https://localhost:5001/swagger
```

## Step 10: Connect Frontend to Backend

Update the frontend `src/lib/api.ts`:

```typescript
// Replace the CNB_API_BASE constant
const BACKEND_API_BASE = 'https://localhost:5001/api'  // Your backend URL

export async function fetchExchangeRates(date?: string): Promise<ExchangeRateData> {
  try {
    const endpoint = date 
      ? `${BACKEND_API_BASE}/exchangerates?date=${date}`
      : `${BACKEND_API_BASE}/exchangerates`

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
  } catch (error) {
    // Error handling...
  }
}
```

Remove the `generateMockExchangeRates()` function and its usage.

## Step 11: Production Considerations

### Add Caching
Implement response caching to reduce CNB API calls:

```csharp
builder.Services.AddResponseCaching();

// In Program.cs after building:
app.UseResponseCaching();

// In controller:
[HttpGet]
[ResponseCache(Duration = 3600)] // Cache for 1 hour
public async Task<IActionResult> GetExchangeRates([FromQuery] string? date = null)
```

### Add Rate Limiting
Prevent abuse with rate limiting:

```bash
dotnet add package AspNetCoreRateLimit
```

### Environment Variables
For production, use environment variables instead of appsettings.json:

```bash
export CNB__ApiBaseUrl="https://api.cnb.cz/cnbapi"
export ASPNETCORE_ENVIRONMENT=Production
```

### Health Checks
Add health check endpoint:

```csharp
builder.Services.AddHealthChecks()
    .AddUrlGroup(new Uri("https://api.cnb.cz/cnbapi/health"), "CNB API");

app.MapHealthChecks("/health");
```

## Testing

### Unit Tests
Create test project:

```bash
dotnet new xunit -n CNBExchangeRateAPI.Tests
cd CNBExchangeRateAPI.Tests
dotnet add reference ../CNBExchangeRateAPI
dotnet add package Moq
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

Example unit test:

```csharp
using CNBExchangeRateAPI.Services;
using Moq;
using Moq.Protected;
using System.Net;

public class ExchangeRateProviderTests
{
    [Fact]
    public async Task GetExchangeRatesAsync_ReturnsValidData()
    {
        // Arrange
        var mockResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent(@"{
                ""rates"": [
                    {
                        ""country"": ""USA"",
                        ""currency"": ""dollar"",
                        ""amount"": 1,
                        ""currencyCode"": ""USD"",
                        ""rate"": 23.456
                    }
                ]
            }")
        };

        var mockHandler = new Mock<HttpMessageHandler>();
        mockHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(mockResponse);

        var httpClient = new HttpClient(mockHandler.Object);
        var logger = Mock.Of<ILogger<ExchangeRateProvider>>();
        var config = Mock.Of<IConfiguration>();

        var provider = new ExchangeRateProvider(httpClient, logger, config);

        // Act
        var result = await provider.GetExchangeRatesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Single(result.Rates);
        Assert.Equal("USD", result.Rates[0].CurrencyCode);
    }
}
```

## Troubleshooting

### CORS Issues
If you still get CORS errors:
1. Verify the frontend URL in the CORS policy matches exactly
2. Check browser console for the actual error
3. Ensure `UseCors()` is called before `UseAuthorization()`

### SSL Certificate Issues in Development
```bash
# Trust the development certificate
dotnet dev-certs https --trust
```

### CNB API Connection Issues
- Check your internet connection
- Verify the CNB API is accessible: https://api.cnb.cz/cnbapi/swagger-ui.html
- Check for any firewall restrictions

## Deployment

### Deploy to Azure
```bash
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myApiApp --runtime "DOTNET|8.0"
az webapp deployment source config-zip --resource-group myResourceGroup --name myApiApp --src deploy.zip
```

### Deploy to Docker
Create `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CNBExchangeRateAPI.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CNBExchangeRateAPI.dll"]
```

Build and run:
```bash
docker build -t cnb-exchange-api .
docker run -p 5000:80 cnb-exchange-api
```

## Summary

You now have a complete .NET backend that:
- ✅ Fetches real data from CNB API
- ✅ Exposes REST endpoint for frontend consumption
- ✅ Handles errors gracefully
- ✅ Uses dependency injection and clean architecture
- ✅ Supports CORS for browser requests
- ✅ Includes logging and configuration
- ✅ Ready for production deployment

The frontend is already configured to work with this backend structure. Simply update the API URL in `src/lib/api.ts` and remove the mock data fallback.

## Next Steps

1. ✅ Build and run the .NET backend
2. ✅ Test the API endpoint with Swagger or Postman
3. ✅ Update frontend API configuration
4. ✅ Test full integration between frontend and backend
5. ✅ Add unit tests
6. ✅ Deploy to production environment
7. ✅ Update README with final deployment URLs

Good luck with your assessment! 🚀
