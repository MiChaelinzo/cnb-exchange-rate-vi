import { ExchangeRateData } from './types'

interface DayPrediction {
  day: string
  date: string
  predicted: number
  confidence: 'high' | 'medium' | 'low'
}

interface PredictionResult {
  currency: string
  currentRate: number
  predictions: DayPrediction[]
  overallTrend: 'bullish' | 'bearish' | 'stable'
  analysis: string
  weekChange: number
}

// 1. Export to CSV (Spreadsheet friendly)
export function exportToCSV(data: ExchangeRateData): void {
  const headers = ['Country', 'Currency', 'Amount', 'Currency Code', 'Rate (CZK)']
  
  const rows = data.rates.map(rate => [
    rate.country,
    rate.currency,
    rate.amount.toString(),
    rate.currencyCode,
    rate.rate.toFixed(3)
  ])

  // Add a metadata row at the top, followed by headers and data
  const csvContent = [
    `# CNB Exchange Rates - ${data.date}`,
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadFile(csvContent, `cnb-rates-${data.date}.csv`, 'text/csv;charset=utf-8;')
}

// 2. Export to Text (Human readable text file)
export function exportToText(data: ExchangeRateData): void {
  const lines: string[] = []

  lines.push(`CNB EXCHANGE RATES`)
  lines.push(`==========================================`)
  lines.push(`Date: ${new Date(data.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`)
  lines.push(`Total Currencies: ${data.rates.length}`)
  lines.push(`Source: Czech National Bank`)
  lines.push(`==========================================`)
  lines.push(``)

  data.rates.forEach((rate, index) => {
    lines.push(`${index + 1}. ${rate.currencyCode} - ${rate.currency}`)
    lines.push(`   Country:  ${rate.country}`)
    lines.push(`   Rate:     ${rate.amount} ${rate.currencyCode} = ${rate.rate.toFixed(3)} CZK`)
    lines.push(`   Per Unit: 1 ${rate.currencyCode} = ${(rate.rate / rate.amount).toFixed(3)} CZK`)
    lines.push(`------------------------------------------`)
  })

  const textContent = lines.join('\n')
  downloadFile(textContent, `cnb-rates-${data.date}.txt`, 'text/plain;charset=utf-8;')
}

// 3. Export to JSON (Structured data format)
export function exportToJSON(data: ExchangeRateData): void {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, `cnb-rates-${data.date}.json`, 'application/json')
}

// 4. Export to PDF (Visual document via SVG data URI)
export function exportToPDF(data: ExchangeRateData): void {
  const pageWidth = 210
  const pageHeight = Math.max(297, 40 + (data.rates.length * 20))
  const margin = 10
  const yPosition = margin + 10

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 ${pageWidth} ${pageHeight}">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; fill: #1a1a1a; }
      .header { font-family: Arial, sans-serif; font-size: 4px; fill: #4a4a4a; }
      .body { font-family: Arial, sans-serif; font-size: 3.5px; fill: #2a2a2a; }
      .divider { stroke: #cccccc; stroke-width: 0.3; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="white"/>
  
  <text x="${margin}" y="${yPosition}" class="title">CNB Exchange Rates</text>
  <text x="${margin}" y="${yPosition + 6}" class="header">Valid Date: ${new Date(data.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}</text>
  <text x="${margin}" y="${yPosition + 10}" class="header">Total Currencies: ${data.rates.length}</text>
  <text x="${margin}" y="${yPosition + 14}" class="header">Source: Czech National Bank (CNB)</text>
  
  <line x1="${margin}" y1="${yPosition + 18}" x2="${pageWidth - margin}" y2="${yPosition + 18}" class="divider"/>
  
  ${data.rates.map((rate, index) => {
    const baseY = yPosition + 25 + (index * 16)
    return `
    <text x="${margin}" y="${baseY}" class="body" font-weight="bold">${index + 1}. ${rate.currencyCode} - ${rate.currency}</text>
    <text x="${margin + 5}" y="${baseY + 3.5}" class="body">Country: ${rate.country}</text>
    <text x="${margin + 5}" y="${baseY + 7}" class="body">Rate: ${rate.amount} ${rate.currencyCode} = ${rate.rate.toFixed(3)} CZK</text>
    <text x="${margin + 5}" y="${baseY + 10.5}" class="body">Per Unit: 1 ${rate.currencyCode} = ${(rate.rate / rate.amount).toFixed(3)} CZK</text>
    <line x1="${margin}" y1="${baseY + 13}" x2="${pageWidth - margin}" y2="${baseY + 13}" class="divider" stroke-dasharray="2"/>
    `
  }).join('')}
  
  <text x="${pageWidth / 2}" y="${pageHeight - 5}" class="header" text-anchor="middle">
    Generated: ${new Date().toLocaleString('en-US')}
  </text>
</svg>`

  downloadFile(svgContent, `cnb-rates-${data.date}.svg`, 'image/svg+xml')
}

// 5. Export to SVG (Visual document)
export function exportToSVG(data: ExchangeRateData): void {
  const pageWidth = 210
  const pageHeight = Math.max(297, 40 + (data.rates.length * 20))
  const margin = 10
  const yPosition = margin + 10

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 ${pageWidth} ${pageHeight}">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; fill: #1a1a1a; }
      .header { font-family: Arial, sans-serif; font-size: 4px; fill: #4a4a4a; }
      .body { font-family: Arial, sans-serif; font-size: 3.5px; fill: #2a2a2a; }
      .divider { stroke: #cccccc; stroke-width: 0.3; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="white"/>
  
  <text x="${margin}" y="${yPosition}" class="title">CNB Exchange Rates</text>
  <text x="${margin}" y="${yPosition + 6}" class="header">Valid Date: ${new Date(data.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}</text>
  <text x="${margin}" y="${yPosition + 10}" class="header">Total Currencies: ${data.rates.length}</text>
  <text x="${margin}" y="${yPosition + 14}" class="header">Source: Czech National Bank (CNB)</text>
  
  <line x1="${margin}" y1="${yPosition + 18}" x2="${pageWidth - margin}" y2="${yPosition + 18}" class="divider"/>
  
  ${data.rates.map((rate, index) => {
    const baseY = yPosition + 25 + (index * 16)
    return `
    <text x="${margin}" y="${baseY}" class="body" font-weight="bold">${index + 1}. ${rate.currencyCode} - ${rate.currency}</text>
    <text x="${margin + 5}" y="${baseY + 3.5}" class="body">Country: ${rate.country}</text>
    <text x="${margin + 5}" y="${baseY + 7}" class="body">Rate: ${rate.amount} ${rate.currencyCode} = ${rate.rate.toFixed(3)} CZK</text>
    <text x="${margin + 5}" y="${baseY + 10.5}" class="body">Per Unit: 1 ${rate.currencyCode} = ${(rate.rate / rate.amount).toFixed(3)} CZK</text>
    <line x1="${margin}" y1="${baseY + 13}" x2="${pageWidth - margin}" y2="${baseY + 13}" class="divider" stroke-dasharray="2"/>
    `
  }).join('')}
  
  <text x="${pageWidth / 2}" y="${pageHeight - 5}" class="header" text-anchor="middle">
    Generated: ${new Date().toLocaleString('en-US')}
  </text>
</svg>`

  downloadFile(svgContent, `cnb-rates-${data.date}.svg`, 'image/svg+xml')
}

// 6. Export Predictions to CSV
export function exportPredictionsToCSV(prediction: PredictionResult, currencyName: string): void {
  const headers = ['Day', 'Date', 'Predicted Rate (CZK)', 'Confidence Level', 'Change from Current (%)']
  
  const rows = prediction.predictions.map(pred => {
    const change = ((pred.predicted - prediction.currentRate) / prediction.currentRate) * 100
    return [
      pred.day,
      pred.date,
      pred.predicted.toFixed(3),
      pred.confidence,
      `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    ]
  })

  const csvContent = [
    `# AI Currency Predictions - ${prediction.currency} (${currencyName})`,
    `# Generated: ${new Date().toLocaleString('en-US')}`,
    `# Current Rate: ${prediction.currentRate.toFixed(3)} CZK`,
    `# Overall Trend: ${prediction.overallTrend.toUpperCase()}`,
    `# 7-Day Change: ${prediction.weekChange >= 0 ? '+' : ''}${prediction.weekChange.toFixed(2)}%`,
    `# Analysis: "${prediction.analysis}"`,
    `#`,
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadFile(csvContent, `${prediction.currency}-predictions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
}

// 7. Export Predictions to PDF (SVG format)
export function exportPredictionsToPDF(prediction: PredictionResult, currencyName: string): void {
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  let yPosition = margin + 10

  const trendColor = prediction.overallTrend === 'bullish' ? '#10b981' : 
                      prediction.overallTrend === 'bearish' ? '#ef4444' : '#6b7280'

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}mm" height="${pageHeight}mm" viewBox="0 0 ${pageWidth} ${pageHeight}">
  <defs>
    <style>
      .title { font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; fill: #1a1a1a; }
      .subtitle { font-family: Arial, sans-serif; font-size: 6px; fill: #4a4a4a; }
      .header { font-family: Arial, sans-serif; font-size: 4.5px; fill: #4a4a4a; font-weight: bold; }
      .body { font-family: Arial, sans-serif; font-size: 4px; fill: #2a2a2a; }
      .trend { font-family: Arial, sans-serif; font-size: 7px; font-weight: bold; fill: ${trendColor}; }
      .divider { stroke: #cccccc; stroke-width: 0.4; }
      .bold-divider { stroke: #4a4a4a; stroke-width: 0.6; }
      .highlight-box { fill: #f3f4f6; stroke: #d1d5db; stroke-width: 0.3; }
      .confidence-high { fill: #d1fae5; }
      .confidence-medium { fill: #dbeafe; }
      .confidence-low { fill: #f3f4f6; }
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="white"/>
  
  <text x="${margin}" y="${yPosition}" class="title">AI Currency Predictions Report</text>
  <text x="${margin}" y="${yPosition + 7}" class="subtitle">${prediction.currency} / CZK - ${currencyName}</text>
  
  <line x1="${margin}" y1="${yPosition + 11}" x2="${pageWidth - margin}" y2="${yPosition + 11}" class="bold-divider"/>
  
  <rect x="${margin}" y="${yPosition + 15}" width="${pageWidth - (margin * 2)}" height="25" class="highlight-box" rx="2"/>
  
  <text x="${margin + 3}" y="${yPosition + 21}" class="header">Current Rate</text>
  <text x="${margin + 3}" y="${yPosition + 26}" class="body">${prediction.currentRate.toFixed(3)} CZK</text>
  
  <text x="${margin + 50}" y="${yPosition + 21}" class="header">Overall Trend</text>
  <text x="${margin + 50}" y="${yPosition + 26}" class="trend">${prediction.overallTrend.toUpperCase()}</text>
  
  <text x="${margin + 100}" y="${yPosition + 21}" class="header">7-Day Change</text>
  <text x="${margin + 100}" y="${yPosition + 26}" class="body" fill="${prediction.weekChange >= 0 ? '#10b981' : '#ef4444'}">${prediction.weekChange >= 0 ? '+' : ''}${prediction.weekChange.toFixed(2)}%</text>
  
  <text x="${margin + 150}" y="${yPosition + 21}" class="header">Day 7 Forecast</text>
  <text x="${margin + 150}" y="${yPosition + 26}" class="body">${prediction.predictions[6]?.predicted.toFixed(3) || 'N/A'} CZK</text>
  
  <text x="${margin}" y="${yPosition + 50}" class="header">ANALYSIS</text>
  <line x1="${margin}" y1="${yPosition + 52}" x2="${pageWidth - margin}" y2="${yPosition + 52}" class="divider"/>
  
  ${wrapText(prediction.analysis, margin + 2, yPosition + 58, pageWidth - (margin * 2) - 4, 4.5, 5.5).map(line => 
    `<text x="${line.x}" y="${line.y}" class="body">${escapeXml(line.text)}</text>`
  ).join('\n  ')}
  
  <text x="${margin}" y="${yPosition + 85}" class="header">7-DAY FORECAST</text>
  <line x1="${margin}" y1="${yPosition + 87}" x2="${pageWidth - margin}" y2="${yPosition + 87}" class="divider"/>
  
  <text x="${margin + 3}" y="${yPosition + 93}" class="body" font-weight="bold">Day</text>
  <text x="${margin + 25}" y="${yPosition + 93}" class="body" font-weight="bold">Date</text>
  <text x="${margin + 65}" y="${yPosition + 93}" class="body" font-weight="bold">Predicted Rate</text>
  <text x="${margin + 110}" y="${yPosition + 93}" class="body" font-weight="bold">Confidence</text>
  <text x="${margin + 150}" y="${yPosition + 93}" class="body" font-weight="bold">Change</text>
  
  <line x1="${margin}" y1="${yPosition + 95}" x2="${pageWidth - margin}" y2="${yPosition + 95}" class="divider"/>
  
  ${prediction.predictions.map((pred, index) => {
    const baseY = yPosition + 102 + (index * 10)
    const change = ((pred.predicted - prediction.currentRate) / prediction.currentRate) * 100
    const confidenceClass = pred.confidence === 'high' ? 'confidence-high' : 
                           pred.confidence === 'medium' ? 'confidence-medium' : 'confidence-low'
    return `
    <rect x="${margin}" y="${baseY - 6}" width="${pageWidth - (margin * 2)}" height="8" class="${confidenceClass}" opacity="0.3" rx="1"/>
    <text x="${margin + 3}" y="${baseY}" class="body">${pred.day}</text>
    <text x="${margin + 25}" y="${baseY}" class="body">${new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>
    <text x="${margin + 65}" y="${baseY}" class="body" font-weight="bold">${pred.predicted.toFixed(3)} CZK</text>
    <text x="${margin + 110}" y="${baseY}" class="body">${pred.confidence}</text>
    <text x="${margin + 150}" y="${baseY}" class="body" fill="${change >= 0 ? '#10b981' : '#ef4444'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</text>
    `
  }).join('\n  ')}
  
  <line x1="${margin}" y1="${pageHeight - 15}" x2="${pageWidth - margin}" y2="${pageHeight - 15}" class="divider"/>
  <text x="${pageWidth / 2}" y="${pageHeight - 8}" class="body" text-anchor="middle" fill="#6b7280">
    Generated: ${new Date().toLocaleString('en-US')} | Powered by AI Analysis
  </text>
</svg>`

  downloadFile(svgContent, `${prediction.currency}-predictions-${new Date().toISOString().split('T')[0]}.svg`, 'image/svg+xml')
}

// Helper function to wrap text for SVG
function wrapText(text: string, x: number, y: number, maxWidth: number, fontSize: number, lineHeight: number): Array<{x: number, y: number, text: string}> {
  const words = text.split(' ')
  const lines: Array<{x: number, y: number, text: string}> = []
  let currentLine = ''
  let currentY = y
  
  const avgCharWidth = fontSize * 0.5
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push({ x, y: currentY, text: currentLine })
        currentY += lineHeight
      }
      currentLine = word
    }
  }
  
  if (currentLine) {
    lines.push({ x, y: currentY, text: currentLine })
  }
  
  return lines
}

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Helper function to trigger downloads
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}