// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Add custom jest matchers from jest-dom
// import '@testing-library/jest-dom/extend-expect'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock StackAuth
jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn(() => null),
  useStackApp: jest.fn(() => ({
    urls: {
      signIn: '/sign-in',
      signUp: '/sign-up'
    }
  })),
  stackServerApp: {
    getUser: jest.fn(() => Promise.resolve(null)),
    getProject: jest.fn(() => Promise.resolve({
      config: { clientTeamCreationEnabled: true }
    }))
  }
}))

// Global test timeout
jest.setTimeout(10000)
