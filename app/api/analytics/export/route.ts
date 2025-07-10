import { NextRequest, NextResponse } from 'next/server'
import { authObject as auth } from '@/lib/auth'
import { ExportService, ExportOptions } from '@/lib/services/export'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { teamId, exportType, options } = await request.json()

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    if (!exportType) {
      return NextResponse.json(
        { error: 'Export type is required' },
        { status: 400 }
      )
    }

    const exportOptions: ExportOptions = {
      format: options?.format || 'csv',
      dateRange: options?.dateRange,
      departments: options?.departments,
      customStartDate: options?.customStartDate ? new Date(options.customStartDate) : undefined,
      customEndDate: options?.customEndDate ? new Date(options.customEndDate) : undefined
    }

    let exportData
    switch (exportType) {
      case 'dashboard':
        exportData = await ExportService.exportDashboardMetrics(
          session.user.id,
          teamId,
          exportOptions
        )
        break
      case 'performance':
        exportData = await ExportService.exportPerformanceMetrics(
          session.user.id,
          teamId,
          exportOptions
        )
        break
      case 'wip':
        exportData = await ExportService.exportWIPData(
          session.user.id,
          teamId,
          exportOptions
        )
        break
      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        )
    }

    if (exportOptions.format === 'csv') {
      const csvContent = ExportService.toCSV(exportData)

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${exportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
