#!/usr/bin/env node

// Test script to run the sequential operations migration
// This would need to be run with proper authentication context

const runMigration = async () => {
  try {
    console.log('Testing sequential operations migration...')

    // In a real scenario, you'd need to:
    // 1. Authenticate with your app
    // 2. Get the session token
    // 3. Make the API call with proper headers

    console.log('To test manually:')
    console.log('1. Log into your app at http://localhost:3000')
    console.log('2. Create a new order with multiple operations')
    console.log('3. Check that only operation 1 is visible initially')
    console.log('4. Complete operation 1, then check that operation 2 becomes visible')

    console.log('\nAlternatively, you can run the migration from within your app code:')
    console.log('- Import WorkOrderOperationsService')
    console.log('- Call WorkOrderOperationsService.migrateToSequentialOperations(teamId)')

  } catch (error) {
    console.error('Error:', error)
  }
}

runMigration()
