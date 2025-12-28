import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to Spark
              </h1>
              <p className="text-lg text-muted-foreground">
                Your app is ready to build
              </p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  This is a clean slate for your next project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Start Building
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
