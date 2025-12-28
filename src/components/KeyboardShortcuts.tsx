import { useEffect } from 'react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Keyboard, Command } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KeyboardShortcut {
  key: string
  description: string
  category: 'Navigation' | 'Actions' | 'Views' | 'General'
}

const shortcuts: KeyboardShortcut[] = [
  { key: '/', description: 'Focus search', category: 'General' },
  { key: 'r', description: 'Refresh current data', category: 'Actions' },
  { key: 'e', description: 'Export current view', category: 'Actions' },
  { key: 'f', description: 'Toggle favorites filter', category: 'Views' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
  { key: '1', description: 'Switch to Current Rates tab', category: 'Navigation' },
  { key: '2', description: 'Switch to Comparison tab', category: 'Navigation' },
  { key: '3', description: 'Switch to Analytics tab', category: 'Navigation' },
  { key: '4', description: 'Switch to AI Insights tab', category: 'Navigation' },
  { key: '5', description: 'Switch to History tab', category: 'Navigation' },
  { key: 'Esc', description: 'Close dialogs/modals', category: 'General' },
]

interface KeyboardShortcutsProps {
  onRefresh?: () => void
  onExport?: () => void
  onToggleFavorites?: () => void
  onFocusSearch?: () => void
  onSwitchTab?: (tab: string) => void
}

export function KeyboardShortcuts({
  onRefresh,
  onExport,
  onToggleFavorites,
  onFocusSearch,
  onSwitchTab,
}: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key === '?' && (event.shiftKey || event.key === '?')) {
        event.preventDefault()
        setIsOpen(true)
        return
      }

      switch (event.key.toLowerCase()) {
        case '/':
          event.preventDefault()
          onFocusSearch?.()
          break
        case 'r':
          event.preventDefault()
          onRefresh?.()
          break
        case 'e':
          event.preventDefault()
          onExport?.()
          break
        case 'f':
          event.preventDefault()
          onToggleFavorites?.()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          event.preventDefault()
          const tabMap: Record<string, string> = {
            '1': 'current',
            '2': 'comparison',
            '3': 'analytics',
            '4': 'ai',
            '5': 'history',
          }
          onSwitchTab?.(tabMap[event.key])
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onRefresh, onExport, onToggleFavorites, onFocusSearch, onSwitchTab])

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Keyboard size={16} weight="duotone" />
        Shortcuts
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Command size={24} weight="duotone" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Quick access to common actions and navigation
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key + shortcut.description}
                        className="flex items-center justify-between py-2 px-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <Badge variant="outline" className="font-mono">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Shortcuts work when not focused on input fields
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
