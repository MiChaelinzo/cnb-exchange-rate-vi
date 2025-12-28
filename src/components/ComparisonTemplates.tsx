import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChartLine, Lightning, Rocket } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ComparisonTemplate {
  id: string
  name: string
  description: string
  icon: typeof Calendar
  dates: string[]
}

interface ComparisonTemplatesProps {
  onApplyTemplate: (dates: string[]) => void
  isLoading?: boolean
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1)
  }
  
  return date.toISOString().split('T')[0]
}

function getMonthsAgoDate(months: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1)
  }
  
  return date.toISOString().split('T')[0]
}

function getCurrentDate(): string {
  const date = new Date()
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1)
  }
  
  return date.toISOString().split('T')[0]
}

export function ComparisonTemplates({ onApplyTemplate, isLoading }: ComparisonTemplatesProps) {
  const templates: ComparisonTemplate[] = [
    {
      id: 'weekly',
      name: 'Weekly Comparison',
      description: 'Compare current rates with the past week (today, 1, 3, 5, 7 days ago)',
      icon: Calendar,
      dates: [
        getCurrentDate(),
        getDateDaysAgo(1),
        getDateDaysAgo(3),
        getDateDaysAgo(5),
        getDateDaysAgo(7),
      ]
    },
    {
      id: 'biweekly',
      name: 'Bi-Weekly Comparison',
      description: 'Track rates over two weeks (today, 3, 7, 10, 14 days ago)',
      icon: ChartLine,
      dates: [
        getCurrentDate(),
        getDateDaysAgo(3),
        getDateDaysAgo(7),
        getDateDaysAgo(10),
        getDateDaysAgo(14),
      ]
    },
    {
      id: 'monthly',
      name: 'Monthly Comparison',
      description: 'View monthly progression (today, 1, 2, 3, 4 weeks ago)',
      icon: Lightning,
      dates: [
        getCurrentDate(),
        getDateDaysAgo(7),
        getDateDaysAgo(14),
        getDateDaysAgo(21),
        getDateDaysAgo(28),
      ]
    },
    {
      id: 'quarterly',
      name: 'Quarterly Comparison',
      description: 'Quarterly overview (today, 1, 2, 3 months ago)',
      icon: Rocket,
      dates: [
        getCurrentDate(),
        getMonthsAgoDate(1),
        getMonthsAgoDate(2),
        getMonthsAgoDate(3),
      ]
    },
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Quick Comparison Templates</CardTitle>
        <CardDescription className="text-base">
          Select a pre-configured time period to instantly compare exchange rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <button
                key={template.id}
                onClick={() => onApplyTemplate(template.dates)}
                disabled={isLoading}
                className={cn(
                  "group relative flex flex-col items-start gap-3 p-5 rounded-lg border-2 transition-all",
                  "hover:border-primary hover:bg-primary/5 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent",
                  "text-left"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    "p-2.5 rounded-lg bg-primary/10 text-primary transition-colors",
                    "group-hover:bg-primary group-hover:text-primary-foreground"
                  )}>
                    <Icon size={24} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {template.description}
                </p>
                <div className="mt-auto w-full pt-2 border-t">
                  <div className="text-xs text-muted-foreground font-mono">
                    {template.dates.length} dates
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
              <Calendar size={20} weight="duotone" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">
                Template Date Selection
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All templates automatically exclude weekends when the CNB doesn't publish rates. 
                Dates are calculated from today's date and adjusted to the nearest weekday.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
