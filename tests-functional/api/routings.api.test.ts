import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/routings/route'
import { RoutingsService } from '@/lib/services/routings'
import { stackServerApp } from '@/stack'

// Mock dependencies
jest.mock('@/lib/services/routings')
jest.mock('@/stack')

describe('/api/routings', () => {
  const mockUser = {
    id: 'user-123',
    selectedTeam: { id: 'team-123' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(mockUser)
  })

  describe('GET /api/routings', () => {
    it('should return routings for authenticated user', async () => {
      const mockRoutings = [
        {
          id: 'routing-1',
          name: 'Standard Assembly',
          teamId: 'team-123',
          isActive: true,
          operations: []
        },
        {
          id: 'routing-2',
          name: 'Testing Procedure',
          teamId: 'team-123',
          isActive: true,
          operations: []
        }
      ]

      ;(RoutingsService.getRoutingsByTeam as jest.Mock).mockResolvedValue(mockRoutings)

      const request = new NextRequest('http://localhost:3000/api/routings')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(mockRoutings)
      expect(RoutingsService.getRoutingsByTeam).toHaveBeenCalledWith('team-123', true)
    })

    it('should handle activeOnly=false query parameter', async () => {
      const mockRoutings = [
        { id: 'routing-1', isActive: true },
        { id: 'routing-2', isActive: false }
      ]

      ;(RoutingsService.getRoutingsByTeam as jest.Mock).mockResolvedValue(mockRoutings)

      const request = new NextRequest('http://localhost:3000/api/routings?activeOnly=false')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(RoutingsService.getRoutingsByTeam).toHaveBeenCalledWith('team-123', false)
    })

    it('should return 401 when user not authenticated', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/routings')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when no team selected', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue({
        id: 'user-123',
        selectedTeam: null
      })

      const request = new NextRequest('http://localhost:3000/api/routings')
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No team selected')
    })

    it('should handle service errors gracefully', async () => {
      ;(RoutingsService.getRoutingsByTeam as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest('http://localhost:3000/api/routings')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/routings', () => {
    const mockRoutingData = {
      name: 'New Routing',
      description: 'Test routing',
      version: '1.0'
    }

    it('should create routing successfully', async () => {
      const mockCreatedRouting = {
        id: 'routing-new',
        ...mockRoutingData,
        teamId: 'team-123',
        isActive: true,
        operations: []
      }

      ;(RoutingsService.createRouting as jest.Mock).mockResolvedValue(mockCreatedRouting)

      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: JSON.stringify(mockRoutingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toEqual(mockCreatedRouting)
      expect(RoutingsService.createRouting).toHaveBeenCalledWith({
        ...mockRoutingData,
        teamId: 'team-123'
      })
    })

    it('should create routing with operations', async () => {
      const routingWithOps = {
        ...mockRoutingData,
        operations: [
          {
            operationNumber: 1,
            operationName: 'Assembly',
            runTime: 1800,
            setupTime: 300
          },
          {
            operationNumber: 2,
            operationName: 'Testing',
            runTime: 600
          }
        ]
      }

      const mockCreatedRouting = {
        id: 'routing-with-ops',
        ...routingWithOps,
        teamId: 'team-123'
      }

      ;(RoutingsService.createRouting as jest.Mock).mockResolvedValue(mockCreatedRouting)

      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: JSON.stringify(routingWithOps),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(RoutingsService.createRouting).toHaveBeenCalledWith({
        ...routingWithOps,
        teamId: 'team-123'
      })
    })

    it('should return 401 when user not authenticated', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: JSON.stringify(mockRoutingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
      expect(RoutingsService.createRouting).not.toHaveBeenCalled()
    })

    it('should return 400 when no team selected', async () => {
      ;(stackServerApp.getUser as jest.Mock).mockResolvedValue({
        id: 'user-123',
        selectedTeam: null
      })

      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: JSON.stringify(mockRoutingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No team selected')
      expect(RoutingsService.createRouting).not.toHaveBeenCalled()
    })

    it('should handle invalid JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle service errors during creation', async () => {
      ;(RoutingsService.createRouting as jest.Mock).mockRejectedValue(
        new Error('Validation failed')
      )

      const request = new NextRequest('http://localhost:3000/api/routings', {
        method: 'POST',
        body: JSON.stringify(mockRoutingData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })
})
