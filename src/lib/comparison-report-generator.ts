import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ComparisonDataPoint } from '@/hooks/use-comparison-rates'
import { ExchangeRate } from './types'

interface ComparisonReportOptions {
  title?: string
  includeCharts?: boolean
  includeDetailedStats?: boolean
  selectedCurrencies?: string[]
}

interface CurrencyComparison {
  currencyCode: string
  currencyName: string
  country: string
  ratesOverTime: Array<{
    date: string
    rate: number | null
    amount: number
  }>
  averageRate: number
  minRate: number
  maxRate: number
  volatility: number
  totalChange: number
  totalChangePercent: number
  trend: 'up' | 'down' | 'stable'
}

export class ComparisonReportGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number
  private primaryColor: [number, number, number] = [53, 51, 153]
  private accentColor: [number, number, number] = [16, 185, 129]
  private warningColor: [number, number, number] = [239, 68, 68]
  private textColor: [number, number, number] = [64, 64, 64]

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 15
    this.currentY = this.margin
  }

  private addHeader(title: string, dateRange: string) {
    this.doc.setFillColor(...this.primaryColor)
    this.doc.rect(0, 0, this.pageWidth, 45, 'F')

    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, 20)

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(dateRange, this.margin, 28)

    this.doc.setFontSize(10)
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    this.doc.text(`Generated: ${dateStr}`, this.margin, 36)

    this.currentY = 55
    this.doc.setTextColor(...this.textColor)
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      this.doc.setFontSize(9)
      this.doc.setTextColor(150, 150, 150)
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      )
      this.doc.text(
        'CNB Exchange Rates - Multi-Period Comparison Report',
        this.margin,
        this.pageHeight - 10
      )
    }
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    if (this.currentY + requiredSpace > this.pageHeight - 20) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  private addSection(title: string, icon?: string) {
    this.checkPageBreak(15)
    
    this.doc.setFillColor(245, 247, 250)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 2, 2, 'F')
    
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(...this.primaryColor)
    const text = icon ? `${icon} ${title}` : title
    this.doc.text(text, this.margin + 3, this.currentY + 7)
    
    this.currentY += 15
    this.doc.setTextColor(...this.textColor)
    this.doc.setFont('helvetica', 'normal')
  }

  private addText(text: string, size: number = 10, bold: boolean = false) {
    this.checkPageBreak()
    this.doc.setFontSize(size)
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal')
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - 2 * this.margin)
    this.doc.text(lines, this.margin, this.currentY)
    this.currentY += lines.length * (size / 2) + 3
  }

  private addMetricCard(
    label: string,
    value: string,
    subtext: string,
    x: number,
    y: number,
    width: number,
    color: [number, number, number]
  ) {
    this.doc.setFillColor(250, 251, 252)
    this.doc.roundedRect(x, y, width, 25, 2, 2, 'F')
    
    this.doc.setDrawColor(...color)
    this.doc.setLineWidth(0.5)
    this.doc.line(x + 3, y + 3, x + 3, y + 22)

    this.doc.setFontSize(9)
    this.doc.setTextColor(120, 120, 120)
    this.doc.text(label, x + 6, y + 7)

    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(...color)
    this.doc.text(value, x + 6, y + 15)

    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(120, 120, 120)
    this.doc.text(subtext, x + 6, y + 20)

    this.doc.setTextColor(...this.textColor)
  }

  private analyzeCurrencyComparisons(
    comparisons: ComparisonDataPoint[],
    selectedCurrencies?: string[]
  ): CurrencyComparison[] {
    const currencyMap = new Map<string, CurrencyComparison>()

    const allCurrencyCodes = new Set<string>()
    comparisons.forEach(comp => {
      comp.data.rates.forEach(rate => {
        if (!selectedCurrencies || selectedCurrencies.includes(rate.currencyCode)) {
          allCurrencyCodes.add(rate.currencyCode)
        }
      })
    })

    Array.from(allCurrencyCodes).forEach(code => {
      const ratesOverTime: Array<{ date: string; rate: number | null; amount: number }> = []
      let currencyName = ''
      let country = ''

      comparisons.forEach(comp => {
        const rate = comp.data.rates.find(r => r.currencyCode === code)
        if (rate) {
          currencyName = rate.currency
          country = rate.country
          ratesOverTime.push({
            date: comp.date,
            rate: rate.rate / rate.amount,
            amount: rate.amount,
          })
        } else {
          ratesOverTime.push({
            date: comp.date,
            rate: null,
            amount: 1,
          })
        }
      })

      const validRates = ratesOverTime.filter(r => r.rate !== null).map(r => r.rate!)
      if (validRates.length === 0) return

      const averageRate = validRates.reduce((sum, r) => sum + r, 0) / validRates.length
      const minRate = Math.min(...validRates)
      const maxRate = Math.max(...validRates)
      const volatility = ((maxRate - minRate) / averageRate) * 100

      const firstRate = ratesOverTime.find(r => r.rate !== null)?.rate || 0
      const validRatesReversed = [...ratesOverTime].reverse()
      const lastRate = validRatesReversed.find(r => r.rate !== null)?.rate || 0
      const totalChange = lastRate - firstRate
      const totalChangePercent = firstRate !== 0 ? (totalChange / firstRate) * 100 : 0

      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (Math.abs(totalChangePercent) > 1) {
        trend = totalChangePercent > 0 ? 'up' : 'down'
      }

      currencyMap.set(code, {
        currencyCode: code,
        currencyName,
        country,
        ratesOverTime,
        averageRate,
        minRate,
        maxRate,
        volatility,
        totalChange,
        totalChangePercent,
        trend,
      })
    })

    return Array.from(currencyMap.values()).sort((a, b) => 
      a.currencyCode.localeCompare(b.currencyCode)
    )
  }

  private addOverviewMetrics(
    comparisons: ComparisonDataPoint[],
    currencyAnalysis: CurrencyComparison[]
  ) {
    this.addSection('Overview', '📊')
    this.checkPageBreak(65)

    const startY = this.currentY
    const cardWidth = (this.pageWidth - 2 * this.margin - 9) / 3

    this.addMetricCard(
      'Time Periods',
      `${comparisons.length}`,
      `${comparisons.length} dates compared`,
      this.margin,
      startY,
      cardWidth,
      this.primaryColor
    )

    this.addMetricCard(
      'Currencies Analyzed',
      `${currencyAnalysis.length}`,
      `Across all periods`,
      this.margin + cardWidth + 3,
      startY,
      cardWidth,
      this.accentColor
    )

    const mostVolatile = currencyAnalysis.reduce((max, curr) => 
      curr.volatility > max.volatility ? curr : max
    , currencyAnalysis[0])

    this.addMetricCard(
      'Most Volatile',
      mostVolatile.currencyCode,
      `${mostVolatile.volatility.toFixed(2)}% range`,
      this.margin + 2 * (cardWidth + 3),
      startY,
      cardWidth,
      this.warningColor
    )

    this.currentY = startY + 30

    const strongestGainer = currencyAnalysis.reduce((max, curr) => 
      curr.totalChangePercent > max.totalChangePercent ? curr : max
    , currencyAnalysis[0])

    const biggestLoser = currencyAnalysis.reduce((min, curr) => 
      curr.totalChangePercent < min.totalChangePercent ? curr : min
    , currencyAnalysis[0])

    this.addMetricCard(
      'Strongest Gainer',
      strongestGainer.currencyCode,
      `+${strongestGainer.totalChangePercent.toFixed(2)}%`,
      this.margin,
      this.currentY,
      cardWidth,
      this.accentColor
    )

    this.addMetricCard(
      'Biggest Loser',
      biggestLoser.currencyCode,
      `${biggestLoser.totalChangePercent.toFixed(2)}%`,
      this.margin + cardWidth + 3,
      this.currentY,
      cardWidth,
      this.warningColor
    )

    const avgVolatility = currencyAnalysis.reduce((sum, curr) => sum + curr.volatility, 0) / currencyAnalysis.length

    this.addMetricCard(
      'Avg Volatility',
      `${avgVolatility.toFixed(2)}%`,
      `Market stability`,
      this.margin + 2 * (cardWidth + 3),
      this.currentY,
      cardWidth,
      this.primaryColor
    )

    this.currentY += 35
  }

  private addPeriodSummary(comparisons: ComparisonDataPoint[]) {
    this.addSection('Time Periods Summary', '📅')
    this.checkPageBreak(10 + comparisons.length * 8)

    const tableData = comparisons.map(comp => [
      new Date(comp.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      comp.data.rates.length.toString(),
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Date', 'Currencies Available']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: this.primaryColor,
        fontSize: 10,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addCurrencyComparisonTable(
    currencyAnalysis: CurrencyComparison[],
    comparisons: ComparisonDataPoint[]
  ) {
    this.addSection('Currency Rate Comparison', '💱')
    this.checkPageBreak(30)

    const headers = [
      'Currency',
      ...comparisons.map(c => 
        new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      'Change %',
    ]

    const tableData = currencyAnalysis.map(curr => [
      `${curr.currencyCode}\n${curr.currencyName}`,
      ...curr.ratesOverTime.map(r => r.rate !== null ? r.rate.toFixed(3) : '—'),
      curr.totalChangePercent >= 0 
        ? `+${curr.totalChangePercent.toFixed(2)}%`
        : `${curr.totalChangePercent.toFixed(2)}%`,
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 25, fontStyle: 'bold' },
        [headers.length - 1]: { 
          halign: 'right',
          cellWidth: 15,
        },
      },
      margin: { left: this.margin, right: this.margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === headers.length - 1) {
          const value = data.cell.text[0]
          if (value.startsWith('+')) {
            data.cell.styles.textColor = this.accentColor
          } else if (value.startsWith('-')) {
            data.cell.styles.textColor = this.warningColor
          }
        }
      },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addVolatilityAnalysis(currencyAnalysis: CurrencyComparison[]) {
    this.addSection('Volatility Analysis', '📉')
    this.checkPageBreak(30)

    const sortedByVolatility = [...currencyAnalysis].sort((a, b) => b.volatility - a.volatility)
    const topVolatile = sortedByVolatility.slice(0, 10)

    const tableData = topVolatile.map((curr, index) => [
      (index + 1).toString(),
      curr.currencyCode,
      curr.currencyName,
      `${curr.volatility.toFixed(2)}%`,
      `${curr.minRate.toFixed(3)} - ${curr.maxRate.toFixed(3)}`,
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Code', 'Currency', 'Volatility', 'Range (CZK)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: this.primaryColor,
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right', fontSize: 7 },
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addTrendAnalysis(currencyAnalysis: CurrencyComparison[]) {
    this.addSection('Trend Analysis', '📈')
    this.checkPageBreak(40)

    const upTrending = currencyAnalysis.filter(c => c.trend === 'up').length
    const downTrending = currencyAnalysis.filter(c => c.trend === 'down').length
    const stable = currencyAnalysis.filter(c => c.trend === 'stable').length

    this.doc.setFillColor(240, 253, 244)
    const boxHeight = 20
    this.doc.roundedRect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      boxHeight,
      2,
      2,
      'F'
    )

    this.doc.setFontSize(10)
    this.doc.setTextColor(...this.textColor)

    const summary = `Of ${currencyAnalysis.length} currencies tracked: ${upTrending} (${((upTrending/currencyAnalysis.length)*100).toFixed(1)}%) are trending up, ${downTrending} (${((downTrending/currencyAnalysis.length)*100).toFixed(1)}%) are trending down, and ${stable} (${((stable/currencyAnalysis.length)*100).toFixed(1)}%) remain stable.`

    const lines = this.doc.splitTextToSize(summary, this.pageWidth - 2 * this.margin - 6)
    this.doc.text(lines, this.margin + 3, this.currentY + 7)

    this.currentY += boxHeight + 10

    const topGainers = [...currencyAnalysis]
      .sort((a, b) => b.totalChangePercent - a.totalChangePercent)
      .slice(0, 5)

    const topLosers = [...currencyAnalysis]
      .sort((a, b) => a.totalChangePercent - b.totalChangePercent)
      .slice(0, 5)

    const gainersData = topGainers.map((curr, index) => [
      (index + 1).toString(),
      curr.currencyCode,
      curr.currencyName,
      `+${curr.totalChangePercent.toFixed(2)}%`,
    ])

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Top 5 Gainers', this.margin, this.currentY)
    this.currentY += 5

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Code', 'Currency', 'Change']],
      body: gainersData,
      theme: 'striped',
      headStyles: {
        fillColor: this.accentColor,
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, fontStyle: 'bold' },
        3: { halign: 'right', textColor: this.accentColor },
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10

    const losersData = topLosers.map((curr, index) => [
      (index + 1).toString(),
      curr.currencyCode,
      curr.currencyName,
      `${curr.totalChangePercent.toFixed(2)}%`,
    ])

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Top 5 Losers', this.margin, this.currentY)
    this.currentY += 5

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['#', 'Code', 'Currency', 'Change']],
      body: losersData,
      theme: 'striped',
      headStyles: {
        fillColor: this.warningColor,
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 20, fontStyle: 'bold' },
        3: { halign: 'right', textColor: this.warningColor },
      },
      margin: { left: this.margin, right: this.margin },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addDetailedCurrencyAnalysis(currencyAnalysis: CurrencyComparison[]) {
    this.addSection('Detailed Currency Statistics', '📋')
    
    const tableData = currencyAnalysis.map(curr => [
      curr.currencyCode,
      curr.currencyName,
      curr.averageRate.toFixed(3),
      `${curr.minRate.toFixed(3)} - ${curr.maxRate.toFixed(3)}`,
      `${curr.volatility.toFixed(2)}%`,
      curr.totalChangePercent >= 0 
        ? `+${curr.totalChangePercent.toFixed(2)}%`
        : `${curr.totalChangePercent.toFixed(2)}%`,
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Code', 'Currency', 'Avg Rate', 'Range (CZK)', 'Volatility', 'Change']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: this.primaryColor,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { fontSize: 6 },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      margin: { left: this.margin, right: this.margin },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const value = data.cell.text[0]
          if (value.startsWith('+')) {
            data.cell.styles.textColor = this.accentColor
          } else if (value.startsWith('-')) {
            data.cell.styles.textColor = this.warningColor
          }
        }
      },
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10
  }

  private addVisualChart(currencyAnalysis: CurrencyComparison[], comparisons: ComparisonDataPoint[]) {
    this.addSection('Rate Trend Visualization', '📊')
    this.checkPageBreak(70)

    const topCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'].filter(code =>
      currencyAnalysis.some(c => c.currencyCode === code)
    )

    const chartX = this.margin
    const chartY = this.currentY
    const chartWidth = this.pageWidth - 2 * this.margin
    const chartHeight = 60
    const plotWidth = chartWidth - 30
    const plotHeight = chartHeight - 25

    this.doc.setDrawColor(200, 200, 200)
    this.doc.setLineWidth(0.2)
    this.doc.rect(chartX + 25, chartY, plotWidth, plotHeight)

    const allRates = currencyAnalysis
      .filter(c => topCurrencies.includes(c.currencyCode))
      .flatMap(c => c.ratesOverTime.filter(r => r.rate !== null).map(r => r.rate!))
    const minRate = Math.min(...allRates)
    const maxRate = Math.max(...allRates)
    const rateRange = maxRate - minRate

    for (let i = 0; i <= 4; i++) {
      const y = chartY + (plotHeight * i) / 4
      this.doc.line(chartX + 25, y, chartX + 25 + plotWidth, y)
      
      const value = maxRate - (rateRange * i) / 4
      this.doc.setFontSize(7)
      this.doc.setTextColor(120, 120, 120)
      this.doc.text(value.toFixed(2), chartX + 20, y + 1, { align: 'right' })
    }

    for (let i = 0; i < comparisons.length; i++) {
      const x = chartX + 25 + (plotWidth * i) / (comparisons.length - 1)
      const date = new Date(comparisons[i].date)
      this.doc.setFontSize(6)
      this.doc.text(
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x,
        chartY + plotHeight + 5,
        { align: 'center', angle: 45 }
      )
    }

    const colors: Array<[number, number, number]> = [
      [53, 51, 153],
      [16, 185, 129],
      [239, 68, 68],
      [251, 146, 60],
      [139, 92, 246],
    ]

    topCurrencies.forEach((code, index) => {
      const currency = currencyAnalysis.find(c => c.currencyCode === code)
      if (!currency) return

      const color = colors[index % colors.length]
      this.doc.setDrawColor(...color)
      this.doc.setLineWidth(0.5)

      for (let i = 0; i < currency.ratesOverTime.length - 1; i++) {
        const rate1 = currency.ratesOverTime[i].rate
        const rate2 = currency.ratesOverTime[i + 1].rate

        if (rate1 !== null && rate2 !== null) {
          const x1 = chartX + 25 + (plotWidth * i) / (currency.ratesOverTime.length - 1)
          const y1 = chartY + plotHeight - ((rate1 - minRate) / rateRange) * plotHeight
          const x2 = chartX + 25 + (plotWidth * (i + 1)) / (currency.ratesOverTime.length - 1)
          const y2 = chartY + plotHeight - ((rate2 - minRate) / rateRange) * plotHeight

          this.doc.line(x1, y1, x2, y2)
        }
      }
    })

    const legendY = chartY + plotHeight + 15
    topCurrencies.forEach((code, index) => {
      const color = colors[index % colors.length]
      const x = this.margin + (index * 30)
      
      this.doc.setFillColor(...color)
      this.doc.rect(x, legendY, 3, 3, 'F')
      
      this.doc.setFontSize(8)
      this.doc.setTextColor(...this.textColor)
      this.doc.text(code, x + 5, legendY + 2.5)
    })

    this.currentY = legendY + 10
  }

  public async generateReport(
    comparisons: ComparisonDataPoint[],
    options: ComparisonReportOptions = {}
  ): Promise<jsPDF> {
    const {
      title = 'Exchange Rate Comparison Report',
      includeCharts = true,
      includeDetailedStats = true,
      selectedCurrencies,
    } = options

    const dateRange = comparisons.length > 0
      ? `${new Date(comparisons[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(comparisons[comparisons.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : 'No dates selected'

    this.addHeader(title, dateRange)

    const currencyAnalysis = this.analyzeCurrencyComparisons(comparisons, selectedCurrencies)

    this.addOverviewMetrics(comparisons, currencyAnalysis)

    this.addPeriodSummary(comparisons)

    this.addCurrencyComparisonTable(currencyAnalysis, comparisons)

    if (includeCharts) {
      this.addVisualChart(currencyAnalysis, comparisons)
    }

    this.addVolatilityAnalysis(currencyAnalysis)

    this.addTrendAnalysis(currencyAnalysis)

    if (includeDetailedStats) {
      this.addDetailedCurrencyAnalysis(currencyAnalysis)
    }

    this.addFooter()

    return this.doc
  }

  public async downloadReport(
    comparisons: ComparisonDataPoint[],
    filename?: string,
    options?: ComparisonReportOptions
  ): Promise<void> {
    await this.generateReport(comparisons, options)
    
    const defaultFilename = `exchange-rate-comparison-${new Date().toISOString().split('T')[0]}.pdf`
    this.doc.save(filename || defaultFilename)
  }
}
