'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cloudStorageService } from '@/lib/cloud-storage-service'

interface Case {
  id: string
  cnrNumber: string
  caseNumber: string
  filingNumber?: string
  caseType: string
  title: string
  petitionerName?: string
  respondentName?: string
  court: string
  courtLocation?: string
  hallNumber?: string
  caseStatus?: string
  filingDate?: string
  lastHearingDate?: string
  nextHearingDate?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  stage: string
  description?: string
  assignedLawyer?: string
  createdAt?: string
  updatedAt?: string
  subjectMatter?: string
  reliefSought?: string
  caseValue?: string
  jurisdiction?: string
  advocates?: Array<{
    name: string
    type: string
    contact?: string
  }>
  judges?: Array<{
    name: string
    designation: string
  }>
  parties?: Array<{
    name: string
    type: string
    contact?: string
  }>
  hearingHistory?: Array<{
    judge: string
    date: string
    nextDate: string
    purpose: string
    url: string
  }>
  orders?: Array<{
    number: number
    name: string
    date: string
    url: string
  }>
  actsAndSections?: {
    acts?: string
    sections?: string
  }
  registrationNumber?: string
  registrationDate?: string
  firstHearingDate?: string
  decisionDate?: string
  natureOfDisposal?: string
}

// Helper function to get cases from localStorage
const getCasesFromStorage = (): Case[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('legal-cases')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading cases from localStorage:', error)
    return []
  }
}

// Helper function to format case number
const formatCaseNumber = (caseItem: Case): string => {
  if (!caseItem.caseNumber) return 'Not specified'
  
  // Format: "O.S. No. 531/2025" or "CIVIL No. 200/2025"
  // Handle different case type formats from APIs
  let caseType = caseItem.caseType || 'CIVIL'
  
  // Convert common variations
  if (caseType === 'O.S.' || caseType === 'OS' || caseType === 'O.S') {
    caseType = 'O.S.'
  } else if (caseType === 'CRIMINAL' || caseType === 'CRIM') {
    caseType = 'CRIMINAL'
  } else if (caseType === 'CIVIL') {
    caseType = 'CIVIL'
  }
  
  return `${caseType} No. ${caseItem.caseNumber}`
}

// Helper function to format dates consistently
const formatDisplayDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Not specified'
  
  try {
    const date = new Date(dateString)
    
    // Check if it's a null/default date (1970-01-01)
    if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
      return 'Not specified'
    }
    
    // Return formatted date in local timezone
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return 'Not specified'
  }
}

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const caseId = params.id
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingData, setEditingData] = useState({
    caseNumber: '',
    title: '',
    clientName: '',
    court: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    stage: '',
    description: '',
    assignedLawyer: ''
  })

  useEffect(() => {
    // Load case from cloud storage or localStorage
    const fetchCase = async () => {
      setLoading(true)
      try {
        // Try to load from cloud storage first
        const cloudCases = await cloudStorageService.getAllCases()
        const foundCase = cloudCases.find((c: any) => c.id === caseId)
        
        if (foundCase) {
          setCaseData(foundCase as Case)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Error loading case from cloud storage:', error)
      }
      
      // Fallback to localStorage
      const savedCases = localStorage.getItem('legal-cases')
      if (savedCases) {
        const cases = JSON.parse(savedCases)
        const foundCase = cases.find((c: Case) => c.id === caseId)
        if (foundCase) {
          setCaseData(foundCase)
        } else {
          // Case not found, redirect back to cases page
          router.push('/cases')
        }
      } else {
        // No cases in localStorage, redirect back to cases page
        router.push('/cases')
      }
      setLoading(false)
    }
    
    fetchCase()
  }, [caseId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Not Found</h1>
          <p className="text-gray-600 mb-4">The case you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/cases')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Cases
          </button>
        </div>
      </div>
    )
  }

  const handleEditCase = () => {
    if (!caseData) return
    
    setEditingData({
      caseNumber: caseData.caseNumber,
      title: caseData.title,
      clientName: caseData.petitionerName || '',
      court: caseData.court || '',
      priority: caseData.priority,
      stage: caseData.stage || '',
      description: caseData.description || '',
      assignedLawyer: caseData.assignedLawyer || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateCase = () => {
    if (!caseData || !editingData.caseNumber || !editingData.title || !editingData.clientName) {
      alert('Please fill in all required fields')
      return
    }

    const updatedCase: Case = {
      ...caseData,
      caseNumber: editingData.caseNumber,
      title: editingData.title,
      clientName: editingData.clientName,
      court: editingData.court,
      priority: editingData.priority,
      stage: editingData.stage,
      description: editingData.description,
      assignedLawyer: editingData.assignedLawyer,
      updatedAt: new Date().toISOString()
    }

    // Update localStorage
    const savedCases = localStorage.getItem('legal-cases')
    if (savedCases) {
      const cases = JSON.parse(savedCases)
      const updatedCases = cases.map((c: Case) => c.id === caseData.id ? updatedCase : c)
      localStorage.setItem('legal-cases', JSON.stringify(updatedCases))
    }

    setCaseData(updatedCase)
    setShowEditModal(false)
  }

  const handleDeleteCase = () => {
    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      // Update localStorage
      const savedCases = localStorage.getItem('legal-cases')
      if (savedCases) {
        const cases = JSON.parse(savedCases)
        const updatedCases = cases.filter((c: Case) => c.id !== caseData?.id)
        localStorage.setItem('legal-cases', JSON.stringify(updatedCases))
      }
      
      router.push('/cases')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/cases')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{formatCaseNumber(caseData)}</h1>
                <p className="text-gray-600">{caseData.title}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getPriorityColor(caseData.priority)}`}>
                {caseData.priority}
              </span>
              <button 
                onClick={handleEditCase}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Case
              </button>
              <button 
                onClick={handleDeleteCase}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete Case
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Case Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Detailed information about this case
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {/* Basic Case Information */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Case Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatCaseNumber(caseData)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">CNR Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.cnrNumber || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Filing Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.filingNumber || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Case Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.caseType || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.title}
                  </dd>
                </div>

                {/* Parties Information */}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Petitioner</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.petitionerName || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Respondent</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.respondentName || 'Not specified'}
                  </dd>
                </div>

                {/* Court Information */}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Court</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.court || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Court Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.courtLocation || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Hall Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.hallNumber || 'Not specified'}
                  </dd>
                </div>

                {/* Case Status and Dates */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Case Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {caseData.caseStatus || caseData.stage || 'Active'}
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Filing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.filingDate)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.registrationDate)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">First Hearing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.firstHearingDate)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Hearing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.lastHearingDate)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Next Hearing Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.nextHearingDate)}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Decision Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDisplayDate(caseData.decisionDate)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Nature of Disposal</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.natureOfDisposal || 'Not specified'}
                  </dd>
                </div>

                {/* Case Details */}
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Subject Matter</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.subjectMatter || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Relief Sought</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.reliefSought || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Case Value</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.caseValue || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.jurisdiction || 'Not specified'}
                  </dd>
                </div>

                {/* Legal Acts and Sections */}
                {caseData.actsAndSections && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Legal Acts and Sections</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-2">
                        {caseData.actsAndSections.acts && (
                          <div>
                            <span className="font-medium">Acts:</span> {caseData.actsAndSections.acts}
                          </div>
                        )}
                        {caseData.actsAndSections.sections && (
                          <div>
                            <span className="font-medium">Sections:</span> {caseData.actsAndSections.sections}
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Priority and Stage */}
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(caseData.priority)}`}>
                      {caseData.priority}
                    </span>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Current Stage</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {caseData.stage || 'Not specified'}
                  </dd>
                </div>

                {/* Advocates */}
                {caseData.advocates && caseData.advocates.length > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Advocates</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        {caseData.advocates.map((advocate, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="font-medium">{advocate.name}</span>
                            <span className="text-gray-500">({advocate.type})</span>
                            {advocate.contact && <span className="text-gray-400">- {advocate.contact}</span>}
                          </div>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Judges */}
                {caseData.judges && caseData.judges.length > 0 && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Judges</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        {caseData.judges.map((judge, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="font-medium">{judge.name}</span>
                            <span className="text-gray-500">({judge.designation})</span>
                          </div>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Created and Updated Dates */}
                {caseData.createdAt && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDisplayDate(caseData.createdAt)}
                    </dd>
                  </div>
                )}
                {caseData.updatedAt && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDisplayDate(caseData.updatedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Hearing History Section */}
          {caseData.hearingHistory && caseData.hearingHistory.length > 0 && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Hearing History</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Complete hearing history for this case
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judge</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {caseData.hearingHistory.map((hearing, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDisplayDate(hearing.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hearing.judge}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hearing.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hearing.nextDate ? formatDisplayDate(hearing.nextDate) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {hearing.url && (
                              <a
                                href={hearing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Details
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Section */}
          {caseData.orders && caseData.orders.length > 0 && (
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Orders</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Court orders issued for this case
                </p>
              </div>
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {caseData.orders.map((order, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDisplayDate(order.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {order.url && (
                              <a
                                href={order.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Order
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Case Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Case</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Number *
                  </label>
                  <input
                    type="text"
                    value={editingData.caseNumber}
                    onChange={(e) => setEditingData({...editingData, caseNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CASE-2024-004"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    value={editingData.title}
                    onChange={(e) => setEditingData({...editingData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Contract Dispute Resolution"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={editingData.clientName}
                    onChange={(e) => setEditingData({...editingData, clientName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., ABC Corporation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court
                  </label>
                  <input
                    type="text"
                    value={editingData.court}
                    onChange={(e) => setEditingData({...editingData, court: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., High Court of Delhi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editingData.priority}
                    onChange={(e) => setEditingData({...editingData, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stage
                  </label>
                  <input
                    type="text"
                    value={editingData.stage}
                    onChange={(e) => setEditingData({...editingData, stage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Preliminary, Arguments, Evidence"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingData.description}
                    onChange={(e) => setEditingData({...editingData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Case description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Lawyer
                  </label>
                  <input
                    type="text"
                    value={editingData.assignedLawyer}
                    onChange={(e) => setEditingData({...editingData, assignedLawyer: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCase}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Update Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}