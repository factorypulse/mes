'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@stackframe/stack'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OperatorDashboard } from '@/components/work-orders/operator-dashboard'
import { ActiveWOO } from '@/components/work-orders/active-woo'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Factory } from 'lucide-react'
import { WOOWithRelations } from '@/lib/services/work-order-operations'

export default function OperatorPage() {
  const params = useParams<{ teamId: string }>()
  const user = useUser({ or: 'redirect' })
  const [activeWoo, setActiveWoo] = useState<WOOWithRelations | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleWooUpdate = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleWooComplete = () => {
    setActiveWoo(null)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold">Operator Workflow</h1>
        <p className="text-gray-600 mt-1">
          Manage your work order operations and track progress
        </p>
      </div>

      {/* Operator Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Operator Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user.displayName || user.primaryEmail}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                All Departments
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Work Queue</TabsTrigger>
          <TabsTrigger value="active" disabled={!activeWoo}>
            Active Work Order
            {activeWoo && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                In Progress
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <OperatorDashboard
            key={refreshKey}
            teamId={params.teamId}
            operatorId={user.id}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {activeWoo ? (
            <ActiveWOO
              woo={activeWoo}
              onUpdate={handleWooUpdate}
              onComplete={handleWooComplete}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Work Order
                </h3>
                <p className="text-gray-600">
                  Start a work order from your queue to begin tracking time and capturing data.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
