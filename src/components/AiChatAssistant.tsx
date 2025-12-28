import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircleDots, PaperPlaneRight, Sparkle, User } from '@phosphor-icons/react'
import { ExchangeRate } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface AiChatAssistantProps {
  rates: ExchangeRate[]
  date: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AiChatAssistant({ rates, date }: AiChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const currencyContext = rates.map(r => ({
        code: r.currencyCode,
        country: r.country,
        currency: r.currency,
        rate: r.rate,
        amount: r.amount
      }))

      const conversationHistory = messages.slice(-4).map(m => 
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n')

      const promptText = `You are a helpful financial assistant specializing in Czech National Bank exchange rates. 
      
Current date: ${date}

Available currency data:
${JSON.stringify(currencyContext, null, 2)}

Previous conversation:
${conversationHistory}

User question: ${userMessage.content}

Provide a helpful, concise answer (2-3 sentences). If asked about a specific currency, provide its current rate and context. If asked for advice, give practical suggestions. Be friendly and professional.`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini', false)

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    'What is the current USD rate?',
    'Which currency is strongest vs CZK?',
    'Is it a good time to exchange EUR?',
    'Compare USD and GBP rates'
  ]

  return (
    <Card className="shadow-lg h-[600px] flex flex-col">
      <CardHeader className="shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg">
            <ChatCircleDots size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">AI Currency Assistant</CardTitle>
            <CardDescription className="text-base mt-1">
              Ask questions about exchange rates and currencies
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkle size={32} weight="duotone" className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">How can I help you?</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Ask me anything about current exchange rates
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Try asking:</p>
                <div className="grid gap-2">
                  {suggestedQuestions.map((question, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                      <Sparkle size={16} weight="duotone" className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User size={16} weight="bold" className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                    <Sparkle size={16} weight="duotone" className="text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about exchange rates..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0"
          >
            <PaperPlaneRight size={18} weight="bold" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
