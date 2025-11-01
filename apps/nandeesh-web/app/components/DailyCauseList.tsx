'use client'

import { useState, useEffect } from 'react'
import { cloudStorageService } from '@/lib/cloud-storage-service'
import { ClockIcon, BuildingLibraryIcon, UserIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface CaseItem {
  id: string
  title: string
  caseNumber: string
  cnrNumber: string
  court: string
  courtLocation: string
  nextHearingDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  petitionerName: string
  caseType: string
}

interface CauseListItem {
  case: CaseItem
  hearingTime: string
  court: string
}

export default function DailyCauseList() {
  const [todaysCases, setTodaysCases] = useState<CauseListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState<string>('All')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    loadTodaysCases()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadTodaysCases, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedDate])

  const loadTodaysCases = async () => {
    try {
      setIsLoading(true)
      const allCases = await cloudStorageService.getAllCases()
      
      const selected = new Date(selectedDate)
      selected.setHours(0, 0, 0, 0)
      const nextDay = new Date(selected)
      nextDay.setDate(nextDay.getDate() + 1)

      // Filter cases with hearing on selected date
      const todayCases = allCases
        .filter(c => {
          if (!c.nextHearingDate) return false
          const hearingDate = new Date(c.nextHearingDate)
          return hearingDate >= selected && hearingDate < nextDay
        })
        .map(caseData => {
          const hearingDate = new Date(caseData.nextHearingDate!)
          const hours = hearingDate.getHours()
          const minutes = hearingDate.getMinutes()
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          
          return {
            case: caseData as CaseItem,
            hearingTime: timeString,
            court: caseData.court || 'Court'
          }
        })
        .sort((a, b) => {
          // Sort by time, then by court
          if (a.hearingTime !== b.hearingTime) {
            return a.hearingTime.localeCompare(b.hearingTime)
          }
          return a.court.localeCompare(b.court)
        })

      setTodaysCases(todayCases)
    } catch (error) {
      console.error('Failed to load todays cases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const courts = Array.from(new Set(['All', ...todaysCases.map(c => c.court)]))
  const filteredCases = selectedCourt === 'All' 
    ? todaysCases 
    : todaysCases.filter(c => c.court === selectedCourt)

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const isToday = () => {
    const today = new Date()
    const selected = new Date(selectedDate)
    return today.toDateString() === selected.toDateString()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (todaysCases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Cause List</h3>
          <span className="ml-auto text-sm text-gray-500">
            {formatDate(selectedDate)}
          </span>
        </div>
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No cases scheduled for today</p>
          <p className="text-sm text-gray-500 mt-2">
            Cases with hearings scheduled for today will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Daily Cause List</h3>
              <p className="text-sm text-gray-500">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Total Cases:</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {todaysCases.length}
            </span>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="mt-4 py-2 bg-gray-50 rounded-lg px-2">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => navigateDate(-3)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all shadow-sm"
            >
              ← 3 Days
            </button>
            <button
              onClick={() => navigateDate(-1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all shadow-sm"
            >
              ← Previous
            </button>
            <button
              onClick={goToToday}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
                isToday()
                  ? 'bg-blue-600 text-white border border-blue-700'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => navigateDate(1)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all shadow-sm"
            >
              Next →
            </button>
            <button
              onClick={() => navigateDate(3)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition-all shadow-sm"
            >
              3 Days →
            </button>
          </div>
        </div>

        {/* Court Filter */}
        {courts.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {courts.map(court => (
              <button
                key={court}
                onClick={() => setSelectedCourt(court)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCourt === court
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {court}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cases List */}
      <div className="divide-y">
        {filteredCases.map((item, index) => (
          <Link
            key={item.case.id}
            href={`/cases/${item.case.id}`}
            className="block p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* Left: Time and Court Info */}
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-2">{item.hearingTime}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 line-clamp-1">
                        {item.case.caseType} No. {item.case.caseNumber}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {item.case.title}
                      </p>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      item.case.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                      item.case.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      item.case.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.case.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BuildingLibraryIcon className="h-4 w-4" />
                      <span>{item.court}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{item.case.petitionerName}</span>
                    </div>
                    {item.case.cnrNumber && (
                      <span className="text-gray-500">CNR: {item.case.cnrNumber}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Arrow */}
              <div className="ml-4 flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t">
        <Link 
          href="/cases" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
        >
          View All Cases
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
