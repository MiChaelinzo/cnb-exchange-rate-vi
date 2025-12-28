import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Bell, BellSlash, Check, Trash, Info, Warning, CheckCircle, XCircle } from '@phosphor-icons/react'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
}

interface NotificationPreferences {
  rateAlerts: boolean
  predictionAccuracy: boolean
  dataUpdates: boolean
  systemNotifications: boolean
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [preferences, setPreferences] = useKV<NotificationPreferences>('notification-preferences', {
    rateAlerts: true,
    predictionAccuracy: true,
    dataUpdates: true,
    systemNotifications: true,
  })
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredNotifications = showUnreadOnly 
    ? (notifications || []).filter(n => !n.read)
    : (notifications || [])

  const markAsRead = (id: string) => {
    setNotifications(current => 
      (current || []).map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(current => 
      (current || []).map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(current => 
      (current || []).filter(n => n.id !== id)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(current => ({
      rateAlerts: current?.rateAlerts ?? true,
      predictionAccuracy: current?.predictionAccuracy ?? true,
      dataUpdates: current?.dataUpdates ?? true,
      systemNotifications: current?.systemNotifications ?? true,
      [key]: value
    }))
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} weight="fill" className="text-green-500" />
      case 'warning':
        return <Warning size={20} weight="fill" className="text-orange-500" />
      case 'error':
        return <XCircle size={20} weight="fill" className="text-red-500" />
      default:
        return <Info size={20} weight="fill" className="text-blue-500" />
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5'
      case 'warning':
        return 'border-orange-500/20 bg-orange-500/5'
      case 'error':
        return 'border-red-500/20 bg-red-500/5'
      default:
        return 'border-blue-500/20 bg-blue-500/5'
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bell size={24} weight="duotone" />
              Notification Center
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your alerts and notification preferences
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <Check size={16} weight="bold" />
                Mark All Read
              </Button>
            )}
            {(notifications || []).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2"
              >
                <Trash size={16} weight="bold" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Notification Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border bg-card">
              <Label htmlFor="rate-alerts" className="flex-1 cursor-pointer">
                <div className="font-medium">Rate Alerts</div>
                <div className="text-xs text-muted-foreground">When watched currencies hit target rates</div>
              </Label>
              <Switch
                id="rate-alerts"
                checked={preferences?.rateAlerts ?? true}
                onCheckedChange={(v) => updatePreference('rateAlerts', v)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border bg-card">
              <Label htmlFor="prediction-accuracy" className="flex-1 cursor-pointer">
                <div className="font-medium">Prediction Accuracy</div>
                <div className="text-xs text-muted-foreground">AI prediction performance updates</div>
              </Label>
              <Switch
                id="prediction-accuracy"
                checked={preferences?.predictionAccuracy ?? true}
                onCheckedChange={(v) => updatePreference('predictionAccuracy', v)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border bg-card">
              <Label htmlFor="data-updates" className="flex-1 cursor-pointer">
                <div className="font-medium">Data Updates</div>
                <div className="text-xs text-muted-foreground">When new exchange rates are available</div>
              </Label>
              <Switch
                id="data-updates"
                checked={preferences?.dataUpdates ?? true}
                onCheckedChange={(v) => updatePreference('dataUpdates', v)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border bg-card">
              <Label htmlFor="system-notifications" className="flex-1 cursor-pointer">
                <div className="font-medium">System Notifications</div>
                <div className="text-xs text-muted-foreground">Important system announcements</div>
              </Label>
              <Switch
                id="system-notifications"
                checked={preferences?.systemNotifications ?? true}
                onCheckedChange={(v) => updatePreference('systemNotifications', v)}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className="gap-2"
              >
                {showUnreadOnly ? <Bell size={16} /> : <BellSlash size={16} />}
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
              </Button>
            )}
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {showUnreadOnly ? 'No Unread Notifications' : 'No Notifications Yet'}
              </h3>
              <p className="text-muted-foreground">
                {showUnreadOnly 
                  ? 'All caught up! Check back later for new updates.'
                  : "You'll see important updates and alerts here."
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      notification.read 
                        ? 'border-border bg-card opacity-60' 
                        : `${getTypeColor(notification.type)} border-2`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-7 text-xs gap-1"
                              >
                                <Check size={14} weight="bold" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash size={14} weight="bold" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
