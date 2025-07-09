// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/mes_test'
process.env.NEXT_PUBLIC_STACK_PROJECT_ID = 'test-project-id'
process.env.STACK_SECRET_SERVER_KEY = 'test-secret-key'
