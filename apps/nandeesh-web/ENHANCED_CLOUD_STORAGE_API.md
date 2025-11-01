# Enhanced Cloud Storage API Documentation

## Overview

Enhanced cloud storage functions to fetch ALL data from cloud storage, including cases, activities, users, and detailed statistics.

## New Functions

### 1. `getAllCloudData()`

Fetches ALL data from cloud storage in a single call.

#### Returns

```typescript
{
  cases: CloudCase[]           // All cases
  activities: UserActivity[]   // All user activities
  users: any[]                 // All users
  syncStatus: CloudSyncStatus  // Current sync status
  statistics: {
    totalCases: number         // Total number of cases
    totalActivities: number    // Total number of activities
    totalUsers: number         // Total number of users
    lastUpdated: Date          // When data was last updated
    oldestCase?: Date          // Date of oldest case
    newestCase?: Date          // Date of newest case
  }
}
```

#### Usage

```typescript
<<<<<<< Updated upstream
import { cloudStorageService } from '@/lib/cloud-storage-service';

// Fetch all cloud data
const allData = await cloudStorageService.getAllCloudData();

console.log('Total cases:', allData.statistics.totalCases);
console.log('Total activities:', allData.statistics.totalActivities);
console.log('All cases:', allData.cases);
console.log('All activities:', allData.activities);
console.log('All users:', allData.users);
=======
import { cloudStorageService } from '@/lib/cloud-storage-service'

// Fetch all cloud data
const allData = await cloudStorageService.getAllCloudData()

console.log('Total cases:', allData.statistics.totalCases)
console.log('Total activities:', allData.statistics.totalActivities)
console.log('All cases:', allData.cases)
console.log('All activities:', allData.activities)
console.log('All users:', allData.users)
>>>>>>> Stashed changes
```

### 2. `exportAllCloudData()`

Exports all cloud data as JSON string for backup or migration.

#### Returns

```typescript
<<<<<<< Updated upstream
string; // JSON string containing all cloud data
=======
string  // JSON string containing all cloud data
>>>>>>> Stashed changes
```

#### Usage

```typescript
<<<<<<< Updated upstream
import { cloudStorageService } from '@/lib/cloud-storage-service';

// Export all data as JSON
const jsonData = await cloudStorageService.exportAllCloudData();

// Save to file
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'cloud-data-backup.json';
a.click();

// Or copy to clipboard
await navigator.clipboard.writeText(jsonData);
console.log('Cloud data copied to clipboard');
=======
import { cloudStorageService } from '@/lib/cloud-storage-service'

// Export all data as JSON
const jsonData = await cloudStorageService.exportAllCloudData()

// Save to file
const blob = new Blob([jsonData], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'cloud-data-backup.json'
a.click()

// Or copy to clipboard
await navigator.clipboard.writeText(jsonData)
console.log('Cloud data copied to clipboard')
>>>>>>> Stashed changes
```

### 3. `importCloudData(jsonData: string)`

Imports cloud data from JSON. Updates existing cases or creates new ones.

#### Parameters

- `jsonData`: JSON string containing the data to import

#### Returns

```typescript
{
  imported: number      // Number of items successfully imported
  skipped: number       // Number of items skipped
  errors: string[]      // Array of error messages
}
```

#### Usage

```typescript
<<<<<<< Updated upstream
import { cloudStorageService } from '@/lib/cloud-storage-service';

// Import from JSON string
const jsonData = `...`; // Your JSON data
const result = await cloudStorageService.importCloudData(jsonData);

console.log(`Imported: ${result.imported}`);
console.log(`Skipped: ${result.skipped}`);
if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
=======
import { cloudStorageService } from '@/lib/cloud-storage-service'

// Import from JSON string
const jsonData = `...` // Your JSON data
const result = await cloudStorageService.importCloudData(jsonData)

console.log(`Imported: ${result.imported}`)
console.log(`Skipped: ${result.skipped}`)
if (result.errors.length > 0) {
  console.error('Errors:', result.errors)
>>>>>>> Stashed changes
}
```

### 4. `getDetailedStatistics()`

Gets comprehensive statistics about cloud storage data.

#### Returns

```typescript
{
<<<<<<< Updated upstream
  totalCases: number; // Total number of cases
  casesByPriority: Record<string, number>; // Cases grouped by priority
  casesByStatus: Record<string, number>; // Cases grouped by status
  casesByCourt: Record<string, number>; // Cases grouped by court
  totalActivities: number; // Total number of activities
  activitiesByType: Record<string, number>; // Activities grouped by type
  totalUsers: number; // Total number of users
  activeUsers: number; // Number of active users
  totalFileSize: number; // Total file size (if applicable)
  syncStatus: {
    isOnline: boolean; // Whether currently online
    lastSync: Date | null; // Last sync timestamp
    pendingChanges: number; // Number of pending changes
=======
  totalCases: number                              // Total number of cases
  casesByPriority: Record<string, number>         // Cases grouped by priority
  casesByStatus: Record<string, number>           // Cases grouped by status
  casesByCourt: Record<string, number>            // Cases grouped by court
  totalActivities: number                         // Total number of activities
  activitiesByType: Record<string, number>        // Activities grouped by type
  totalUsers: number                              // Total number of users
  activeUsers: number                             // Number of active users
  totalFileSize: number                           // Total file size (if applicable)
  syncStatus: {
    isOnline: boolean                             // Whether currently online
    lastSync: Date | null                         // Last sync timestamp
    pendingChanges: number                        // Number of pending changes
>>>>>>> Stashed changes
  }
}
```

#### Usage

```typescript
<<<<<<< Updated upstream
import { cloudStorageService } from '@/lib/cloud-storage-service';

// Get detailed statistics
const stats = await cloudStorageService.getDetailedStatistics();

console.log('Total cases:', stats.totalCases);
console.log('Cases by priority:', stats.casesByPriority);
=======
import { cloudStorageService } from '@/lib/cloud-storage-service'

// Get detailed statistics
const stats = await cloudStorageService.getDetailedStatistics()

console.log('Total cases:', stats.totalCases)
console.log('Cases by priority:', stats.casesByPriority)
>>>>>>> Stashed changes
// {
//   "LOW": 10,
//   "MEDIUM": 25,
//   "HIGH": 8,
//   "URGENT": 2
// }

<<<<<<< Updated upstream
console.log('Cases by status:', stats.casesByStatus);
=======
console.log('Cases by status:', stats.casesByStatus)
>>>>>>> Stashed changes
// {
//   "OPEN": 15,
//   "IN_PROGRESS": 20,
//   "CLOSED": 10
// }

<<<<<<< Updated upstream
console.log('Activities by type:', stats.activitiesByType);
=======
console.log('Activities by type:', stats.activitiesByType)
>>>>>>> Stashed changes
// {
//   "CASE_CREATE": 45,
//   "CASE_UPDATE": 120,
//   "CASE_DELETE": 3
// }

<<<<<<< Updated upstream
console.log('Active users:', stats.activeUsers);
console.log('Online:', stats.syncStatus.isOnline);
=======
console.log('Active users:', stats.activeUsers)
console.log('Online:', stats.syncStatus.isOnline)
>>>>>>> Stashed changes
```

## Complete Example

```typescript
<<<<<<< Updated upstream
import { cloudStorageService } from '@/lib/cloud-storage-service';
=======
import { cloudStorageService } from '@/lib/cloud-storage-service'
>>>>>>> Stashed changes

// Example: Fetch, export, and analyze all cloud data
async function analyzeCloudData() {
  try {
    // 1. Fetch all cloud data
<<<<<<< Updated upstream
    const allData = await cloudStorageService.getAllCloudData();
    console.log('Fetched all cloud data:', {
      cases: allData.cases.length,
      activities: allData.activities.length,
      users: allData.users.length,
    });

    // 2. Get detailed statistics
    const stats = await cloudStorageService.getDetailedStatistics();
    console.log('Detailed statistics:', stats);

    // 3. Export data as JSON backup
    const jsonData = await cloudStorageService.exportAllCloudData();
    console.log('Exported data:', jsonData.substring(0, 100) + '...');

    // 4. Analyze cases by priority
    const highPriorityCases = allData.cases.filter(c => c.priority === 'HIGH');
    console.log('High priority cases:', highPriorityCases.length);

    // 5. Get recent activities
    const recentActivities = allData.activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return activityDate > yesterday;
    });
    console.log('Recent activities (last 24h):', recentActivities.length);
  } catch (error) {
    console.error('Error analyzing cloud data:', error);
=======
    const allData = await cloudStorageService.getAllCloudData()
    console.log('Fetched all cloud data:', {
      cases: allData.cases.length,
      activities: allData.activities.length,
      users: allData.users.length
    })

    // 2. Get detailed statistics
    const stats = await cloudStorageService.getDetailedStatistics()
    console.log('Detailed statistics:', stats)

    // 3. Export data as JSON backup
    const jsonData = await cloudStorageService.exportAllCloudData()
    console.log('Exported data:', jsonData.substring(0, 100) + '...')

    // 4. Analyze cases by priority
    const highPriorityCases = allData.cases.filter(c => c.priority === 'HIGH')
    console.log('High priority cases:', highPriorityCases.length)

    // 5. Get recent activities
    const recentActivities = allData.activities
      .filter(a => {
        const activityDate = new Date(a.timestamp)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return activityDate > yesterday
      })
    console.log('Recent activities (last 24h):', recentActivities.length)

  } catch (error) {
    console.error('Error analyzing cloud data:', error)
>>>>>>> Stashed changes
  }
}

// Run the analysis
<<<<<<< Updated upstream
analyzeCloudData();
=======
analyzeCloudData()
>>>>>>> Stashed changes
```

## Use Cases

### 1. Backup All Data

```typescript
// Create a complete backup of all cloud data
async function backupAllData() {
<<<<<<< Updated upstream
  const jsonData = await cloudStorageService.exportAllCloudData();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cloud-backup-${new Date().toISOString()}.json`;
  a.click();
=======
  const jsonData = await cloudStorageService.exportAllCloudData()
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cloud-backup-${new Date().toISOString()}.json`
  a.click()
>>>>>>> Stashed changes
}
```

### 2. Data Migration

```typescript
// Migrate data from one instance to another
async function migrateData(sourceJson: string) {
<<<<<<< Updated upstream
  const result = await cloudStorageService.importCloudData(sourceJson);
  console.log(
    `Migration complete: ${result.imported} imported, ${result.skipped} skipped`
  );
  if (result.errors.length > 0) {
    console.error('Migration errors:', result.errors);
=======
  const result = await cloudStorageService.importCloudData(sourceJson)
  console.log(`Migration complete: ${result.imported} imported, ${result.skipped} skipped`)
  if (result.errors.length > 0) {
    console.error('Migration errors:', result.errors)
>>>>>>> Stashed changes
  }
}
```

### 3. Dashboard Analytics

```typescript
// Display comprehensive dashboard statistics
async function getDashboardData() {
<<<<<<< Updated upstream
  const stats = await cloudStorageService.getDetailedStatistics();

=======
  const stats = await cloudStorageService.getDetailedStatistics()
  
>>>>>>> Stashed changes
  return {
    totalCases: stats.totalCases,
    casesByPriority: stats.casesByPriority,
    casesByStatus: stats.casesByStatus,
    activeUsers: stats.activeUsers,
<<<<<<< Updated upstream
    isOnline: stats.syncStatus.isOnline,
  };
=======
    isOnline: stats.syncStatus.isOnline
  }
>>>>>>> Stashed changes
}
```

### 4. Activity Audit

```typescript
// Audit all activities
async function auditActivities() {
<<<<<<< Updated upstream
  const allData = await cloudStorageService.getAllCloudData();

  // Group by user
  const activitiesByUser = allData.activities.reduce(
    (acc, activity) => {
      if (!acc[activity.userId]) {
        acc[activity.userId] = [];
      }
      acc[activity.userId].push(activity);
      return acc;
    },
    {} as Record<string, typeof allData.activities>
  );

  // Find most active user
  const mostActiveUser = Object.entries(activitiesByUser).sort(
    (a, b) => b[1].length - a[1].length
  )[0];

  console.log(
    'Most active user:',
    mostActiveUser[0],
    mostActiveUser[1].length,
    'activities'
  );
=======
  const allData = await cloudStorageService.getAllCloudData()
  
  // Group by user
  const activitiesByUser = allData.activities.reduce((acc, activity) => {
    if (!acc[activity.userId]) {
      acc[activity.userId] = []
    }
    acc[activity.userId].push(activity)
    return acc
  }, {} as Record<string, typeof allData.activities>)
  
  // Find most active user
  const mostActiveUser = Object.entries(activitiesByUser)
    .sort((a, b) => b[1].length - a[1].length)[0]
  
  console.log('Most active user:', mostActiveUser[0], mostActiveUser[1].length, 'activities')
>>>>>>> Stashed changes
}
```

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
<<<<<<< Updated upstream
  const allData = await cloudStorageService.getAllCloudData();
  // Use data...
} catch (error) {
  console.error('Failed to fetch cloud data:', error);
=======
  const allData = await cloudStorageService.getAllCloudData()
  // Use data...
} catch (error) {
  console.error('Failed to fetch cloud data:', error)
>>>>>>> Stashed changes
  // Fallback to local storage or show error message
}
```

## Performance Considerations

- `getAllCloudData()` fetches data in parallel where possible
- Consider pagination for large datasets
- Cache results if frequent access is needed
- Export only when necessary (can be resource-intensive)

## Browser Support

- All modern browsers
- Falls back to localStorage if Firebase is not configured
- Automatic offline support

## Related Documentation

- `CLOUD_STORAGE_SETUP.md` - Setup guide
- `CLOUD_STORAGE_SUMMARY.md` - Quick reference
- `lib/cloud-storage-service.ts` - Source code
<<<<<<< Updated upstream
=======








>>>>>>> Stashed changes
