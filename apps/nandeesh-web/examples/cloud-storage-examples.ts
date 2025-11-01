/**
 * Example Usage of Enhanced Cloud Storage Functions
 * 
 * This file demonstrates how to use the enhanced cloud storage functions
 * to fetch, analyze, backup, and restore all cloud data.
 */

import { cloudStorageService } from '@/lib/cloud-storage-service'

// Example 1: Fetch All Cloud Data
export async function exampleFetchAllData() {
  try {
    console.log('📊 Fetching all cloud data...')
    
    const allData = await cloudStorageService.getAllCloudData()
    
    console.log('✅ Fetched all cloud data:')
    console.log(`  - Total cases: ${allData.statistics.totalCases}`)
    console.log(`  - Total activities: ${allData.statistics.totalActivities}`)
    console.log(`  - Total users: ${allData.statistics.totalUsers}`)
    console.log(`  - Last updated: ${allData.statistics.lastUpdated}`)
    
    if (allData.statistics.oldestCase) {
      console.log(`  - Oldest case: ${allData.statistics.oldestCase}`)
    }
    if (allData.statistics.newestCase) {
      console.log(`  - Newest case: ${allData.statistics.newestCase}`)
    }
    
    return allData
  } catch (error) {
    console.error('❌ Failed to fetch all cloud data:', error)
    throw error
  }
}

// Example 2: Get Detailed Statistics
export async function exampleGetStatistics() {
  try {
    console.log('📈 Getting detailed statistics...')
    
    const stats = await cloudStorageService.getDetailedStatistics()
    
    console.log('✅ Statistics retrieved:')
    console.log('  - Total cases:', stats.totalCases)
    console.log('  - Cases by priority:', stats.casesByPriority)
    console.log('  - Cases by status:', stats.casesByStatus)
    console.log('  - Cases by court:', stats.casesByCourt)
    console.log('  - Total activities:', stats.totalActivities)
    console.log('  - Total users:', stats.totalUsers)
    console.log('  - Active users:', stats.activeUsers)
    console.log('  - Online:', stats.syncStatus.isOnline)
    
    return stats
  } catch (error) {
    console.error('❌ Failed to get statistics:', error)
    throw error
  }
}

// Example 3: Export All Data as JSON
export async function exampleExportData() {
  try {
    console.log('💾 Exporting all cloud data...')
    
    const jsonData = await cloudStorageService.exportAllCloudData()
    
    console.log('✅ Data exported successfully')
    console.log(`  - Data size: ${(jsonData.length / 1024).toFixed(2)} KB`)
    
    // Save to file
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cloud-data-backup-${new Date().toISOString()}.json`
    a.click()
    
    console.log('✅ File download started')
    
    return jsonData
  } catch (error) {
    console.error('❌ Failed to export data:', error)
    throw error
  }
}

// Example 4: Import Data from JSON
export async function exampleImportData(jsonData: string) {
  try {
    console.log('📥 Importing cloud data...')
    
    const result = await cloudStorageService.importCloudData(jsonData)
    
    console.log('✅ Import completed:')
    console.log(`  - Imported: ${result.imported}`)
    console.log(`  - Skipped: ${result.skipped}`)
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Import errors:')
      result.errors.forEach(error => console.error(`  - ${error}`))
    }
    
    return result
  } catch (error) {
    console.error('❌ Failed to import data:', error)
    throw error
  }
}

// Example 5: Analyze Cases
export async function exampleAnalyzeCases() {
  try {
    const allData = await cloudStorageService.getAllCloudData()
    
    console.log('🔍 Analyzing cases...')
    
    // Cases by priority
    const casesByPriority = allData.cases.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Cases by priority:', casesByPriority)
    
    // Cases by status
    const casesByStatus = allData.cases.reduce((acc, c) => {
      acc[c.caseStatus || 'UNKNOWN'] = (acc[c.caseStatus || 'UNKNOWN'] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Cases by status:', casesByStatus)
    
    // High priority cases
    const highPriorityCases = allData.cases.filter(c => c.priority === 'HIGH' || c.priority === 'URGENT')
    console.log(`High priority cases: ${highPriorityCases.length}`)
    
    // Recent cases (last 7 days)
    const recentCases = allData.cases.filter(c => {
      const caseDate = new Date(c.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return caseDate > weekAgo
    })
    console.log(`Recent cases (last 7 days): ${recentCases.length}`)
    
    return {
      casesByPriority,
      casesByStatus,
      highPriorityCases,
      recentCases
    }
  } catch (error) {
    console.error('❌ Failed to analyze cases:', error)
    throw error
  }
}

// Example 6: Analyze Activities
export async function exampleAnalyzeActivities() {
  try {
    const allData = await cloudStorageService.getAllCloudData()
    
    console.log('📊 Analyzing activities...')
    
    // Activities by type
    const activitiesByType = allData.activities.reduce((acc, a) => {
      const key = `${a.entityType}_${a.action}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Activities by type:', activitiesByType)
    
    // Recent activities (last 24 hours)
    const recentActivities = allData.activities.filter(a => {
      const activityDate = new Date(a.timestamp)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return activityDate > yesterday
    })
    console.log(`Recent activities (last 24h): ${recentActivities.length}`)
    
    // Activities by user
    const activitiesByUser = allData.activities.reduce((acc, a) => {
      if (!acc[a.userId]) {
        acc[a.userId] = {
          userName: a.userName,
          count: 0
        }
      }
      acc[a.userId].count++
      return acc
    }, {} as Record<string, { userName: string; count: number }>)
    console.log('Activities by user:', activitiesByUser)
    
    return {
      activitiesByType,
      recentActivities,
      activitiesByUser
    }
  } catch (error) {
    console.error('❌ Failed to analyze activities:', error)
    throw error
  }
}

// Example 7: Create Complete Backup
export async function exampleCreateBackup() {
  try {
    console.log('💾 Creating complete backup...')
    
    // Step 1: Get all data
    const allData = await cloudStorageService.getAllCloudData()
    
    // Step 2: Get statistics
    const stats = await cloudStorageService.getDetailedStatistics()
    
    // Step 3: Create backup object
    const backup = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
        totalCases: allData.statistics.totalCases,
        totalActivities: allData.statistics.totalActivities,
        totalUsers: allData.statistics.totalUsers
      },
      data: allData,
      statistics: stats
    }
    
    // Step 4: Export as JSON
    const jsonData = JSON.stringify(backup, null, 2)
    
    // Step 5: Save to file
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `complete-backup-${new Date().toISOString()}.json`
    a.click()
    
    console.log('✅ Backup created successfully')
    
    return {
      backup,
      jsonData,
      size: jsonData.length
    }
  } catch (error) {
    console.error('❌ Failed to create backup:', error)
    throw error
  }
}

// Example 8: Run All Examples
export async function exampleRunAll() {
  console.log('🚀 Running all cloud storage examples...\n')
  
  try {
    // Example 1: Fetch all data
    console.log('Example 1: Fetching all data...')
    await exampleFetchAllData()
    console.log('\n')
    
    // Example 2: Get statistics
    console.log('Example 2: Getting statistics...')
    await exampleGetStatistics()
    console.log('\n')
    
    // Example 3: Analyze cases
    console.log('Example 3: Analyzing cases...')
    await exampleAnalyzeCases()
    console.log('\n')
    
    // Example 4: Analyze activities
    console.log('Example 4: Analyzing activities...')
    await exampleAnalyzeActivities()
    console.log('\n')
    
    console.log('✅ All examples completed successfully!')
  } catch (error) {
    console.error('❌ Failed to run examples:', error)
    throw error
  }
}

// Example 9: Use in React Component
export function ExampleReactComponent() {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState(null)
  
  const fetchAllData = async () => {
    setLoading(true)
    try {
      const allData = await cloudStorageService.getAllCloudData()
      setData(allData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = async () => {
    try {
      const jsonData = await cloudStorageService.exportAllCloudData()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${new Date().toISOString()}.json`
      a.click()
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }
  
  return (
    <div>
      <button onClick={fetchAllData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch All Data'}
      </button>
      
      <button onClick={exportData}>
        Export Data
      </button>
      
      {data && (
        <div>
          <h2>Cloud Data</h2>
          <p>Total Cases: {data.statistics.totalCases}</p>
          <p>Total Activities: {data.statistics.totalActivities}</p>
          <p>Total Users: {data.statistics.totalUsers}</p>
        </div>
      )}
    </div>
  )
}








