'use client'



import { useState, useEffect, useMemo, useCallback } from 'react'

import { useRouter } from 'next/navigation'

import { ECourtsProvider, ECourtsCaseData, ECourtsConfig } from '@/lib/ecourts-provider'

import { backgroundSyncService, SyncStatus } from '@/lib/background-sync'

import { cloudStorageService, CloudCase, CloudSyncStatus, UserActivity } from '@/lib/cloud-storage-service'

import { unifiedDataService } from '@/lib/unified-data-service'

import EntityNavigation from '@/app/components/EntityNavigation'

import { migrationService, MigrationStatus } from '@/lib/migration-service'

import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon, UserIcon, BuildingOfficeIcon, ScaleIcon, AcademicCapIcon, BanknotesIcon, BriefcaseIcon, ClipboardDocumentListIcon, ArrowPathIcon, XMarkIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

import { AnimatedButton, SuccessButton } from '@/components/ui/animated-button'

import { StaggeredCards } from '@/components/anim/StaggeredList'

import { useToast } from '@/components/ui/toast'

// import { SyncStatusComponent } from './_components/SyncStatusComponent'



// Advanced search types

type CourtType = 'district' | 'high' | 'supreme' | 'consumer' | 'nclt' | 'cat'

type DistrictCourtFunction = 'cnr' | 'party' | 'advocate' | 'advocateNumber' | 'filing'



interface AdvancedSearchForm {

  courtType: CourtType

  districtCourtFunction?: DistrictCourtFunction

  highCourtFunction?: 'cnr' | 'party' | 'advocate' | 'filing'

  supremeCourtFunction?: 'diary' | 'party' | 'orders' | 'aor'

  ncltFunction?: 'caseNumber' | 'filingNumber' | 'party'

  catFunction?: 'caseNumber' | 'diaryNumber' | 'party' | 'advocate'

  consumerFunction?: 'caseDetails'

  

  // CNR Lookup

  cnrNumber?: string

  

  // Party Search

  state?: string

  district?: string

  complex?: string

  partyName?: string

  caseStage?: 'both' | 'pending' | 'disposed'

  year?: string

  

  // Advocate Search

  advocateName?: string

  

  // Advocate Number

  advocateNumber?: string

  

  // Filing Search

  filingNumber?: string

  

  // Supreme Court specific

  diaryNumber?: string

  aorNumber?: string

  orderDate?: string

  

  // NCLT specific

  caseNumber?: string

  benchId?: string

  typeId?: string

  

  // CAT specific

  caseYear?: string

  

  // Consumer Forum specific

  consumerCaseNumber?: string

}



const courtTypeOptions = [

  { value: 'district', label: 'District Court', icon: BuildingOfficeIcon },

  { value: 'high', label: 'High Court', icon: ScaleIcon },

  { value: 'supreme', label: 'Supreme Court', icon: AcademicCapIcon },

  { value: 'consumer', label: 'Consumer Forum', icon: BanknotesIcon },

  { value: 'nclt', label: 'NCLT', icon: BriefcaseIcon },

  { value: 'cat', label: 'CAT', icon: ClipboardDocumentListIcon }

]



const districtCourtFunctions = [

  { value: 'cnr', label: 'CNR Lookup', icon: DocumentTextIcon, description: 'Search by Case Number Reference' },

  { value: 'party', label: 'Party Search', icon: UserIcon, description: 'Search by party names with location filters' },

  { value: 'advocate', label: 'Advocate Search', icon: ScaleIcon, description: 'Search by advocate names' },

  { value: 'advocateNumber', label: 'Advocate Number', icon: AcademicCapIcon, description: 'Search by advocate registration number' },

  { value: 'filing', label: 'Filing Search', icon: ClipboardDocumentListIcon, description: 'Search by filing numbers' }

]



const highCourtFunctions = [

  { value: 'cnr', label: 'CNR Lookup', icon: DocumentTextIcon, description: 'Search by Case Number Reference' },

  { value: 'party', label: 'Party Search', icon: UserIcon, description: 'Search by party names' },

  { value: 'advocate', label: 'Advocate Search', icon: ScaleIcon, description: 'Search by advocate names' },

  { value: 'filing', label: 'Filing Search', icon: ClipboardDocumentListIcon, description: 'Search by filing numbers' }

]



const supremeCourtFunctions = [

  { value: 'diary', label: 'Diary Number', icon: DocumentTextIcon, description: 'Search by diary number' },

  { value: 'party', label: 'Party Search', icon: UserIcon, description: 'Search by party names' },

  { value: 'orders', label: 'Orders on Date', icon: ClipboardDocumentListIcon, description: 'Get orders for specific date' },

  { value: 'aor', label: 'AOR Search', icon: AcademicCapIcon, description: 'Search by Advocate on Record' }

]



const ncltFunctions = [

  { value: 'caseNumber', label: 'Case Number', icon: DocumentTextIcon, description: 'Search by case number' },

  { value: 'filingNumber', label: 'Filing Number', icon: ClipboardDocumentListIcon, description: 'Search by filing number' },

  { value: 'party', label: 'Party Search', icon: UserIcon, description: 'Search by party names' }

]



const catFunctions = [

  { value: 'caseNumber', label: 'Case Number', icon: DocumentTextIcon, description: 'Search by case number' },

  { value: 'diaryNumber', label: 'Diary Number', icon: ClipboardDocumentListIcon, description: 'Search by diary number' },

  { value: 'party', label: 'Party Search', icon: UserIcon, description: 'Search by party names' },

  { value: 'advocate', label: 'Advocate Search', icon: ScaleIcon, description: 'Search by advocate names' }

]



const consumerFunctions = [

  { value: 'caseDetails', label: 'Case Details', icon: DocumentTextIcon, description: 'Get case details by case number' }

]



// Dynamic data for dropdowns - will be loaded from API

interface CourtData {

  id: string

  name: string

}



interface StaticCourtData {

  states: CourtData[]

  districts: CourtData[]

  complexes: CourtData[]

  courts: CourtData[]

}



// Fallback sample data for dropdowns

const fallbackStates = [

  'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 

  'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Delhi'

]



const fallbackDistricts = {

  'Karnataka': ['Bangalore Urban', 'Bangalore Rural', 'Mysore', 'Mangalore', 'Hubli'],

  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],

  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirapalli'],

  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],

  'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore']

}



const fallbackComplexes = {

  'Bangalore Urban': ['City Civil Court', 'Family Court', 'Commercial Court', 'Motor Accident Claims Tribunal'],

  'Mumbai': ['City Civil Court', 'Family Court', 'Commercial Court', 'Motor Accident Claims Tribunal'],

  'Chennai': ['City Civil Court', 'Family Court', 'Commercial Court', 'Motor Accident Claims Tribunal']

}



interface Case {

  id: string

  cnrNumber: string

  caseNumber: string // Primary case number (Registration Number)

  filingNumber?: string // Filing Number (alternative)

  title: string

  petitionerName: string

  respondentName: string

  court: string

  courtLocation: string

  hallNumber?: string

  caseType: string

  caseStatus: string

  filingDate: string

  lastHearingDate?: string

  nextHearingDate?: string

  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

  stage: string

  subjectMatter: string

  reliefSought: string

  caseValue?: number

  jurisdiction: string

  advocates: Array<{

    name: string

    type?: string

    barNumber?: string

    phone?: string

    email?: string

  }>

  judges: Array<{

    name: string

    designation: string

    court: string

  }>

  // Enhanced eCourts data

  parties: Array<{

    name: string

    type: 'PLAINTIFF' | 'PETITIONER' | 'DEFENDANT' | 'RESPONDENT'

  }>

  hearingHistory: Array<{

    date: string

    purpose: string

    judge: string

    status?: string

  }>

  orders: Array<{

    number: number

    name: string

    date: string

    url?: string

  }>

  registrationNumber?: string

  registrationDate?: string

  firstHearingDate?: string

  decisionDate?: string

  natureOfDisposal?: string

  lastRefreshed?: string

  // Additional properties for cloud storage compatibility

  assignedTo?: string

  notes?: string

  documents?: string[]

  // Additional eCourts data fields

  status?: any

  acts?: any[]

  subMatters?: any[]

  iaDetails?: any[]

  categoryDetails?: any

  documentDetails?: any[]

  objections?: any[]

  history?: any[]

  firstInformationReport?: any

  transfer?: any[]

  // Additional fields

  actsAndSections?: {

    acts?: string

    sections?: string

  }

}



export default function CasesPage() {

  const router = useRouter()

  const { toast } = useToast()

  

        // Advanced search state

        const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)

        const [advancedSearchForm, setAdvancedSearchForm] = useState<AdvancedSearchForm>({

          courtType: 'district',

          districtCourtFunction: 'cnr',

          highCourtFunction: 'cnr',

          supremeCourtFunction: 'diary',

          ncltFunction: 'caseNumber',

          catFunction: 'caseNumber',

          consumerFunction: 'caseDetails',

          cnrNumber: '',

          state: '',

          district: '',

          complex: '',

          partyName: '',

          caseStage: 'both',

          year: '',

          advocateName: '',

          advocateNumber: '',

          filingNumber: '',

          diaryNumber: '',

          aorNumber: '',

          orderDate: '',

          caseNumber: '',

          benchId: '',

          typeId: '',

          caseYear: '',

          consumerCaseNumber: ''

        })

        

        // Dynamic court data states

        const [staticCourtData, setStaticCourtData] = useState<StaticCourtData>({

          states: [],

          districts: [],

          complexes: [],

          courts: []

        })

        const [isLoadingCourtData, setIsLoadingCourtData] = useState(false)

        const [courtDataError, setCourtDataError] = useState<string | null>(null)

  

  // Default cases

  const defaultCases: Case[] = [

    {

      id: '1',

      cnrNumber: 'DLCT01-001234-2023',

      caseNumber: 'CASE-2024-001',

      title: 'Contract Dispute Resolution',

      petitionerName: 'ABC Corporation',

      respondentName: 'XYZ Limited',

      court: 'High Court of Delhi',

      courtLocation: 'New Delhi',

      hallNumber: 'Hall No. 1',

      caseType: 'CIVIL',

      caseStatus: 'ACTIVE',

      filingDate: '2023-06-15',

      nextHearingDate: '2024-04-15',

      priority: 'HIGH',

      stage: 'Arguments',

      subjectMatter: 'Contract Dispute',

      reliefSought: 'Specific Performance',

      caseValue: 1000000,

      jurisdiction: 'Delhi',

      advocates: [

        {

          name: 'Adv. John Doe',

          type: 'PETITIONER',

          barNumber: 'DL123456',

          phone: '+91-9876543210',

          email: 'john@law.com'

        }

      ],

      judges: [

        {

          name: 'Hon. Justice Smith',

          designation: 'Judge',

          court: 'High Court of Delhi'

        }

      ],

      parties: [

        {

          name: 'ABC Corporation',

          type: 'PLAINTIFF'

        },

        {

          name: 'XYZ Limited',

          type: 'DEFENDANT'

        }

      ],

      hearingHistory: [],

      orders: []

    },

    {

      id: '2',

      cnrNumber: 'MHCT02-002345-2023',

      caseNumber: 'CASE-2024-002',

      title: 'Property Settlement',

      petitionerName: 'DEF Properties',

      respondentName: 'GHI Holdings',

      court: 'Bombay High Court',

      courtLocation: 'Mumbai',

      hallNumber: 'Hall No. 2',

      caseType: 'CIVIL',

      caseStatus: 'ACTIVE',

      filingDate: '2023-08-20',

      nextHearingDate: '2024-04-20',

      priority: 'MEDIUM',

      stage: 'Evidence',

      subjectMatter: 'Property Dispute',

      reliefSought: 'Property Division',

      caseValue: 5000000,

      jurisdiction: 'Mumbai',

      advocates: [

        {

          name: 'Adv. Jane Smith',

          type: 'RESPONDENT',

          barNumber: 'MH789012',

          phone: '+91-9876543211',

          email: 'jane@law.com'

        }

      ],

      judges: [

        {

          name: 'Hon. Justice Brown',

          designation: 'Judge',

          court: 'Bombay High Court'

        }

      ],

      parties: [

        {

          name: 'DEF Properties',

          type: 'PLAINTIFF'

        },

        {

          name: 'GHI Holdings',

          type: 'DEFENDANT'

        }

      ],

      hearingHistory: [],

      orders: []

    }

  ]



  // Load cases from cloud storage

  useEffect(() => {

    const loadCases = async () => {

      try {

        // Check if migration is needed

        if (migrationService.needsMigration()) {

          setShowMigrationModal(true)

          return

        }



        // Load cases from cloud storage

        const cloudCases = await cloudStorageService.getAllCases()

        

        // Convert CloudCase to Case format for compatibility

        const convertedCases: Case[] = cloudCases.map(cloudCase => ({

          id: cloudCase.id || '',

          title: cloudCase.title,

          caseNumber: cloudCase.caseNumber || '',

          cnrNumber: cloudCase.cnrNumber || '',

          petitionerName: cloudCase.petitionerName || '',

          respondentName: cloudCase.respondentName || '',

          court: cloudCase.court || '',

          courtLocation: cloudCase.courtLocation || '',

          caseType: cloudCase.caseType || 'CIVIL', // Use stored value or default

          caseStatus: cloudCase.caseStatus || 'PENDING',

          filingDate: cloudCase.filingDate || new Date().toISOString(),

          priority: cloudCase.priority || 'MEDIUM',

          stage: cloudCase.stage || '',

          subjectMatter: cloudCase.subjectMatter || '',

          reliefSought: cloudCase.reliefSought || '',

          jurisdiction: 'District Court', // Default value

          advocates: [], // Default empty array

          judges: [], // Default empty array

          hearingHistory: [], // Default empty array

          severity: 'MEDIUM', // Default value

          // Optional fields

          filingNumber: cloudCase.filingNumber,

          nextHearingDate: cloudCase.nextHearingDate,

          lastHearingDate: cloudCase.lastHearingDate,

          caseValue: cloudCase.caseValue,

          assignedTo: cloudCase.assignedTo,

          notes: cloudCase.notes,

          documents: cloudCase.documents,

          // Additional eCourts data

          registrationNumber: cloudCase.registrationNumber,

          status: cloudCase.status,

          parties: cloudCase.parties || [],

          acts: cloudCase.acts,

          subMatters: cloudCase.subMatters,

          iaDetails: cloudCase.iaDetails,

          categoryDetails: cloudCase.categoryDetails,

          documentDetails: cloudCase.documentDetails,

          objections: cloudCase.objections,

          history: cloudCase.history,

          orders: cloudCase.orders || [],

          firstInformationReport: cloudCase.firstInformationReport,

          transfer: cloudCase.transfer

        }))



        setCases(convertedCases)

        setCloudSyncStatus(cloudStorageService.getSyncStatus())

      } catch (error) {

        console.error('Failed to load cases from cloud:', error)

        // Fallback to localStorage

        const storedCases = localStorage.getItem('legal-cases')

        if (storedCases) {

          setCases(JSON.parse(storedCases))

        }

      }

    }



    loadCases()

  }, [])



  // Subscribe to real-time updates

  useEffect(() => {

    const unsubscribe = cloudStorageService.subscribeToCases((cloudCases) => {

      const convertedCases: Case[] = cloudCases.map(cloudCase => ({

        id: cloudCase.id || '',

        title: cloudCase.title,

        caseNumber: cloudCase.caseNumber || '',

        cnrNumber: cloudCase.cnrNumber || '',

        petitionerName: cloudCase.petitionerName || '',

        respondentName: cloudCase.respondentName || '',

        court: cloudCase.court || '',

        courtLocation: cloudCase.courtLocation || '',

        caseType: cloudCase.caseType || 'CIVIL', // Use stored value or default

        caseStatus: cloudCase.caseStatus || 'PENDING',

        filingDate: cloudCase.filingDate || new Date().toISOString(),

        priority: cloudCase.priority || 'MEDIUM',

        stage: cloudCase.stage || '',

        subjectMatter: cloudCase.subjectMatter || '',

        reliefSought: cloudCase.reliefSought || '',

        jurisdiction: 'District Court', // Default value

        advocates: [], // Default empty array

        judges: [], // Default empty array

        hearingHistory: [], // Default empty array

        severity: 'MEDIUM', // Default value

        // Optional fields

        filingNumber: cloudCase.filingNumber,

        nextHearingDate: cloudCase.nextHearingDate,

        lastHearingDate: cloudCase.lastHearingDate,

        caseValue: cloudCase.caseValue,

        assignedTo: cloudCase.assignedTo,

        notes: cloudCase.notes,

        documents: cloudCase.documents,

        // Additional eCourts data

        registrationNumber: cloudCase.registrationNumber,

        status: cloudCase.status,

        parties: cloudCase.parties || [],

        acts: cloudCase.acts,

        subMatters: cloudCase.subMatters,

        iaDetails: cloudCase.iaDetails,

        categoryDetails: cloudCase.categoryDetails,

        documentDetails: cloudCase.documentDetails,

        objections: cloudCase.objections,

        history: cloudCase.history,

        orders: cloudCase.orders || [],

        firstInformationReport: cloudCase.firstInformationReport,

        transfer: cloudCase.transfer

      }))

      

      setCases(convertedCases)

      setCloudSyncStatus(cloudStorageService.getSyncStatus())

    })



    return unsubscribe

  }, [])



  // Real-time collaboration listeners

  useEffect(() => {

    // Subscribe to user activities

    const unsubscribeActivities = cloudStorageService.onActivity((activity) => {

      setRecentActivities(prev => [activity, ...prev.slice(0, 9)]) // Keep last 10 activities

    })



    // Subscribe to user presence changes

    const unsubscribePresence = cloudStorageService.onPresenceChange((userCount) => {

      setActiveUsers(userCount)

    })



    return () => {

      unsubscribeActivities()

      unsubscribePresence()

    }

  }, [])



  // Load cases from cloud storage



  // Cases state

  const [cases, setCases] = useState<Case[]>([])



  const [showAddModal, setShowAddModal] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)

  const [showCNRModal, setShowCNRModal] = useState(false)

  const [editingCase, setEditingCase] = useState<Case | null>(null)

  const [cnrNumber, setCnrNumber] = useState('')

  const [isLoadingCNR, setIsLoadingCNR] = useState(false)

  const [searchError, setSearchError] = useState<string | null>(null)

  const [searchSuccess, setSearchSuccess] = useState<string | null>(null)

  

  // Basic search state

  const [searchQuery, setSearchQuery] = useState('')

  const [filteredCases, setFilteredCases] = useState<Case[]>([])

  

  // Cloud storage state

  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(cloudStorageService.getSyncStatus())

  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>(migrationService.getMigrationStatus())

  const [showMigrationModal, setShowMigrationModal] = useState(false)

  const [isMigrating, setIsMigrating] = useState(false)

  

  // Real-time collaboration state

  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([])

  const [activeUsers, setActiveUsers] = useState(0)

  const [currentUser, setCurrentUser] = useState(cloudStorageService.getCurrentUser())

  

  // Background sync state

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(backgroundSyncService.getStatus())

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)

  const [refreshInterval, setRefreshInterval] = useState(30) // minutes

  

  // Filter cases based on search query

  useEffect(() => {

    if (!searchQuery.trim()) {

      setFilteredCases(cases)

    } else {

      const query = searchQuery.toLowerCase()

      const filtered = cases.filter(caseItem => 

        caseItem.title?.toLowerCase().includes(query) ||

        caseItem.caseNumber?.toLowerCase().includes(query) ||

        caseItem.cnrNumber?.toLowerCase().includes(query) ||

        caseItem.petitionerName?.toLowerCase().includes(query) ||

        caseItem.respondentName?.toLowerCase().includes(query) ||

        caseItem.court?.toLowerCase().includes(query) ||

        caseItem.courtLocation?.toLowerCase().includes(query) ||

        caseItem.subjectMatter?.toLowerCase().includes(query) ||

        caseItem.reliefSought?.toLowerCase().includes(query) ||

        caseItem.stage?.toLowerCase().includes(query) ||

        caseItem.caseStatus?.toLowerCase().includes(query)

      )

      setFilteredCases(filtered)

    }

  }, [cases, searchQuery])



  // Background sync management

  useEffect(() => {

    // Subscribe to sync status changes

    const unsubscribe = backgroundSyncService.onStatusChange((status) => {

      setSyncStatus(status)

    })



    // Load saved settings

    const savedSettings = localStorage.getItem('legal-desktop-auto-refresh')

    if (savedSettings) {

      try {

        const settings = JSON.parse(savedSettings)

        setAutoRefreshEnabled(settings.enabled || false)

        setRefreshInterval(settings.interval || 30)

        

        if (settings.enabled) {

          backgroundSyncService.start(settings.interval)

        }

      } catch (error) {

        console.error('Failed to load auto-refresh settings:', error)

      }

    }



    return () => {

      unsubscribe()

    }

  }, [])



  // Handle auto-refresh toggle

  const handleAutoRefreshToggle = (enabled: boolean) => {

    setAutoRefreshEnabled(enabled)

    

    if (enabled) {

      backgroundSyncService.start(refreshInterval)

    } else {

      backgroundSyncService.stop()

    }

    

    // Save settings

    localStorage.setItem('legal-desktop-auto-refresh', JSON.stringify({

      enabled,

      interval: refreshInterval

    }))

  }



  // Handle refresh interval change

  const handleRefreshIntervalChange = (interval: number) => {

    setRefreshInterval(interval)

    

    if (autoRefreshEnabled) {

      backgroundSyncService.setInterval(interval)

    }

    

    // Save settings

    localStorage.setItem('legal-desktop-auto-refresh', JSON.stringify({

      enabled: autoRefreshEnabled,

      interval

    }))

  }



  // Manual sync trigger

  const handleManualSync = async () => {

    try {

      const status = await backgroundSyncService.performSync()

      setSyncStatus(status)

      

      if (status.updatedCases > 0) {

        setSearchSuccess(`Background sync completed: ${status.updatedCases} cases updated`)

        setTimeout(() => setSearchSuccess(null), 5000)

      }

    } catch (error) {

      console.error('Manual sync failed:', error)

      setSearchError('Manual sync failed. Please try again.')

      setTimeout(() => setSearchError(null), 5000)

    }

  }

  

  // Migration functions

  const handleStartMigration = async () => {

    setIsMigrating(true)

    try {

      const status = await migrationService.startMigration()

      setMigrationStatus(status)

      

      if (status.isComplete) {

        setShowMigrationModal(false)

        // Reload cases from cloud storage

        const cloudCases = await cloudStorageService.getAllCases()

        const convertedCases: Case[] = cloudCases.map(cloudCase => ({

          id: cloudCase.id || '',

          title: cloudCase.title,

          caseNumber: cloudCase.caseNumber || '',

          cnrNumber: cloudCase.cnrNumber || '',

          petitionerName: cloudCase.petitionerName || '',

          respondentName: cloudCase.respondentName || '',

          court: cloudCase.court || '',

          courtLocation: cloudCase.courtLocation || '',

          caseType: cloudCase.caseType || 'CIVIL', // Use stored value or default

          caseStatus: cloudCase.caseStatus || 'PENDING',

          filingDate: cloudCase.filingDate || new Date().toISOString(),

          priority: cloudCase.priority || 'MEDIUM',

          stage: cloudCase.stage || '',

          subjectMatter: cloudCase.subjectMatter || '',

          reliefSought: cloudCase.reliefSought || '',

          jurisdiction: 'District Court', // Default value

          advocates: [], // Default empty array

          judges: [], // Default empty array

          hearingHistory: [], // Default empty array

          severity: 'MEDIUM', // Default value

          // Optional fields

          filingNumber: cloudCase.filingNumber,

          nextHearingDate: cloudCase.nextHearingDate,

          lastHearingDate: cloudCase.lastHearingDate,

          caseValue: cloudCase.caseValue,

          assignedTo: cloudCase.assignedTo,

          notes: cloudCase.notes,

          documents: cloudCase.documents,

          // Additional eCourts data

          registrationNumber: cloudCase.registrationNumber,

          status: cloudCase.status,

          parties: cloudCase.parties || [],

          acts: cloudCase.acts,

          subMatters: cloudCase.subMatters,

          iaDetails: cloudCase.iaDetails,

          categoryDetails: cloudCase.categoryDetails,

          documentDetails: cloudCase.documentDetails,

          objections: cloudCase.objections,

          history: cloudCase.history,

          orders: cloudCase.orders || [],

          firstInformationReport: cloudCase.firstInformationReport,

          transfer: cloudCase.transfer

        }))

        setCases(convertedCases)

      }

    } catch (error) {

      console.error('Migration failed:', error)

    } finally {

      setIsMigrating(false)

    }

  }



  const handleSkipMigration = () => {

    setShowMigrationModal(false)

    // Use default cases if no migration

    setCases(defaultCases)

  }

  

  // Advanced search modal state

  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  const [searchFilters, setSearchFilters] = useState({

    caseNumber: '',

    partyName: '',

    advocateName: '',

    court: '',

    courtType: 'district' as 'district' | 'high' | 'supreme' | 'nclt' | 'cat' | 'consumer',

    filingDateFrom: '',

    filingDateTo: '',

    hearingDateFrom: '',

    hearingDateTo: '',

    caseType: '',

    caseStatus: ''

  })

  const [isLoadingSearch, setIsLoadingSearch] = useState(false)

  const [showCaseDetails, setShowCaseDetails] = useState(false)

  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)



  // Helper function to format case number

  const formatCaseNumber = (caseItem: Case): string => {

    if (!caseItem.caseNumber) return 'Not specified'

    

    // Format: "OS No. 200/2025" or "CIVIL No. 200/2025"

    const caseType = caseItem.caseType || 'CIVIL'

    return `${caseType} No. ${caseItem.caseNumber}`

  }

  const formatCaseTitle = (title: string): string => {

    if (!title || !title.includes('vs')) return title

    

    // Split by 'vs' to separate petitioners and respondents

    const parts = title.split(/\s+vs\.?\s+/i)

    if (parts.length !== 2) return title

    

    let petitionerPart = parts[0].trim()

    let respondentPart = parts[1].trim()

    

    // Count number of persons in petitioner part

    const petitionerNames = petitionerPart.split(',').map(n => n.trim()).filter(n => n)

    const respondentNames = respondentPart.split(',').map(n => n.trim()).filter(n => n)

    

    // Format petitioner part

    if (petitionerNames.length > 2) {

      petitionerPart = `${petitionerNames[0]} and Others`

    } else if (petitionerNames.length === 2) {

      petitionerPart = `${petitionerNames[0]} and Another`

    } else {

      petitionerPart = petitionerNames[0]

    }

    

    // Format respondent part

    if (respondentNames.length > 2) {

      respondentPart = `${respondentNames[0]} and Others`

    } else if (respondentNames.length === 2) {

      respondentPart = `${respondentNames[0]} and Another`

    } else {

      respondentPart = respondentNames[0]

    }

    

    // Add period after "Others" if it exists

    if (respondentPart.endsWith('Others')) {

      respondentPart += '.'

    }

    

    return `${petitionerPart} vs. ${respondentPart}`

  }

  const [newCase, setNewCase] = useState({

    caseNumber: '',

    filingNumber: '',

    title: '',

    petitionerName: '',

    respondentName: '',

    court: '',

    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',

    stage: ''

  })



  const handleAddCase = () => {

    if (!newCase.caseNumber || !newCase.title || !newCase.petitionerName) {

      alert('Please fill in all required fields')

      return

    }



    const caseToAdd: Case = {

      id: Date.now().toString(),

      cnrNumber: `CNR-${Date.now()}`,

      caseNumber: newCase.caseNumber, // Registration Number (primary)

      filingNumber: newCase.filingNumber || undefined, // Filing Number (optional)

      title: newCase.title,

      petitionerName: newCase.petitionerName,

      respondentName: newCase.respondentName || 'Unknown Respondent',

      court: newCase.court,

      courtLocation: 'Not specified',

      caseType: 'CIVIL',

      caseStatus: 'ACTIVE',

      filingDate: new Date().toISOString().split('T')[0],

      priority: newCase.priority,

      stage: newCase.stage,

      subjectMatter: newCase.title,

      reliefSought: 'Not specified',

      jurisdiction: newCase.court,

      advocates: [],

      judges: [],

      parties: [

        {

          name: newCase.petitionerName,

          type: 'PLAINTIFF'

        },

        {

          name: newCase.respondentName || 'Unknown Respondent',

          type: 'DEFENDANT'

        }

      ],

      hearingHistory: [],

      orders: []

    }



    setCases([...cases, caseToAdd])

    setNewCase({

      caseNumber: '',

      filingNumber: '',

      title: '',

      petitionerName: '',

      respondentName: '',

      court: '',

      priority: 'MEDIUM',

      stage: ''

    })

    setShowAddModal(false)

  }



  // eCourts CNR Import function

  const handleAdvancedSearch = async () => {

    setIsLoadingSearch(true)

    try {

      console.log('🔍 Starting advanced search with filters:', searchFilters)

      

      const config = {

        provider: 'third_party' as const,

        apiKey: 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104',

        timeout: 30000

      }

      

      const ecourtsProvider = new ECourtsProvider(config)

      const result = await ecourtsProvider.searchCases(searchFilters)

      

      console.log('📊 Advanced search result:', result)

      

      if (result.success && result.data && result.data.length > 0) {

        // Convert search results to Case format and add to cases list

        const newCases: Case[] = result.data.map((caseData, index) => ({

          id: `search-${Date.now()}-${index}`,

          cnrNumber: caseData.cnr,

          caseNumber: caseData.caseNumber || caseData.registrationNumber || `REG-${Date.now()}-${index}`, // Primary: Registration Number

          filingNumber: caseData.filingNumber || undefined, // Optional: Filing Number

          title: caseData.title,

          petitionerName: caseData.parties.find(p => p.type === 'PLAINTIFF' || p.type === 'PETITIONER')?.name || 'Unknown Petitioner',

          respondentName: caseData.parties.find(p => p.type === 'DEFENDANT' || p.type === 'RESPONDENT')?.name || 'Unknown Respondent',

          court: caseData.court,

          courtLocation: caseData.courtLocation,

          hallNumber: caseData.hallNumber || 'Not specified',

          caseType: caseData.caseType,

          caseStatus: caseData.caseStatus,

          filingDate: caseData.filingDate,

          lastHearingDate: caseData.lastHearingDate,

          nextHearingDate: caseData.nextHearingDate,

          priority: 'MEDIUM',

          stage: 'Active',

          subjectMatter: caseData.caseDetails.subjectMatter,

          reliefSought: caseData.caseDetails.reliefSought,

          caseValue: caseData.caseDetails.caseValue,

          jurisdiction: caseData.caseDetails.jurisdiction,

          advocates: caseData.advocates || [],

          judges: caseData.judges || [],

          parties: caseData.parties || [],

          hearingHistory: caseData.hearingHistory || [],

          orders: caseData.orders || []

        }))



        setCases([...cases, ...newCases])

        setShowAdvancedSearch(false)

        

        alert(`✅ Found ${result.total || result.data.length} cases!\n\nAdded ${newCases.length} new cases to your list.\n\nCourt Type: ${searchFilters.courtType.toUpperCase()} COURT`)

      } else if (result.error === 'API_UNAVAILABLE') {

        alert(`⚠️ Court API temporarily unavailable.\n\n${result.message}\n\nPlease try again in a few minutes.`)

      } else if (result.error === 'NOT_IMPLEMENTED') {

        alert(`ℹ️ ${result.message}\n\nPlease use the CNR Import feature for real-time data.`)

      } else {

        alert(`❌ No cases found matching your search criteria.\n\nTry adjusting your search filters or use the CNR Import feature.`)

      }

    } catch (error) {

      console.error('❌ Advanced search error:', error)

      alert(`❌ Error searching cases: ${error instanceof Error ? error.message : 'Unknown error'}`)

    } finally {

      setIsLoadingSearch(false)

    }

  }



  const handleCNRImport = async () => {

    if (!cnrNumber || cnrNumber.length !== 16) {

      alert('Please enter a valid CNR number (exactly 16 characters)')

      return

    }



    setIsLoadingCNR(true)

    try {

      console.log('🔍 Starting CNR import for:', cnrNumber)

      

      // Use server-side API route to avoid CORS issues

      console.log('📞 Calling server-side CNR API...')

      const response = await fetch('/api/ecourts/cnr/', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({ cnr: cnrNumber })

      })

      

      if (!response.ok) {

        throw new Error(`Server error: ${response.status} ${response.statusText}`)

      }

      

      const result = await response.json()

      

      console.log('📊 CNR import result:', result)

      console.log('📊 Result success:', result.success)

      console.log('📊 Result error:', result.error)

      console.log('📊 Result message:', result.message)

      

      if (result.success && result.data) {

        // Convert eCourts data to our enhanced case format

        const petitioner = result.data.parties.find((p: any) => p.type === 'PLAINTIFF' || p.type === 'PETITIONER')

        const respondent = result.data.parties.find((p: any) => p.type === 'DEFENDANT' || p.type === 'RESPONDENT')



        const newCase: Case = {

          id: Date.now().toString(),

          cnrNumber: result.data.cnr,

          caseNumber: result.data.caseNumber || result.data.registrationNumber || `REG-${Date.now()}`, // Primary: Registration Number

          filingNumber: result.data.filingNumber || undefined, // Optional: Filing Number

          title: result.data.title,

          petitionerName: petitioner?.name || 'Unknown Petitioner',

          respondentName: respondent?.name || 'Unknown Respondent',

          court: result.data.court,

          courtLocation: result.data.courtLocation,

          hallNumber: result.data.hallNumber || 'Not specified',

          caseType: result.data.caseType,

          caseStatus: result.data.caseStatus,

          filingDate: result.data.filingDate,

          lastHearingDate: result.data.lastHearingDate,

          nextHearingDate: result.data.nextHearingDate,

          priority: 'MEDIUM',

          stage: 'Active',

          subjectMatter: result.data.caseDetails.subjectMatter,

          reliefSought: result.data.caseDetails.reliefSought,

          caseValue: result.data.caseDetails.caseValue,

          jurisdiction: result.data.caseDetails.jurisdiction,

          advocates: result.data.advocates || [],

          judges: result.data.judges || [],

          // Enhanced eCourts data

          parties: result.data.parties || [],

          hearingHistory: result.data.hearingHistory || [],

          orders: result.data.orders || [],

          actsAndSections: result.data.actsAndSections,

          registrationNumber: result.data.registrationNumber,

          registrationDate: result.data.registrationDate,

          firstHearingDate: result.data.firstHearingDate,

          decisionDate: result.data.decisionDate,

          natureOfDisposal: result.data.natureOfDisposal

        }

        // Save to cloud storage
        console.log('💾 Saving case to cloud storage...')
        console.log('📊 Case title before save:', newCase.title)
        console.log('📊 Case CNR before save:', newCase.cnrNumber)
        
        const savedCaseId = await cloudStorageService.addCase(newCase)
        console.log('✅ Case saved to cloud storage with ID:', savedCaseId)

        // Update the local state with the cloud-stored version (which has the proper ID)
        newCase.id = savedCaseId
        console.log('🔧 Updating local state with case:', { id: newCase.id, title: newCase.title })
        setCases(prevCases => {
          console.log('📊 Previous cases count:', prevCases.length)
          const updated = [newCase, ...prevCases]
          console.log('📊 Updated cases count:', updated.length)
          return updated
        })

        setCnrNumber('')

        setShowCNRModal(false)

        

        // Show detailed success message with persistence confirmation

        alert(`✅ Case imported and saved to cloud storage!\n\nReal API Data from Kleopatra\n\nCNR: ${newCase.cnrNumber}\nCase: ${formatCaseNumber(newCase)}\nTitle: ${newCase.title}\nCourt: ${newCase.court}\nPetitioner: ${newCase.petitionerName}\nRespondent: ${newCase.respondentName}`)

      } else if (result.requiresCaptcha) {

        alert('⚠️ CAPTCHA required. Please use manual import or try again later.')

      } else if (result.requiresManual) {

        alert('⚠️ Manual intervention required. Please try the manual import option.')

      } else if (result.error === 'API_UNAVAILABLE') {

        alert(`⚠️ Court API temporarily unavailable.\n\n${result.message}\n\nPlease try again in a few minutes.`)

      } else {

        alert(`❌ Error importing case: ${result.error} - ${result.message}`)

      }

    } catch (error) {

      console.error('❌ CNR import error:', error)

      console.error('❌ Error type:', typeof error)

      console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown')

      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')

      alert(`❌ Error importing case: ${error instanceof Error ? error.message : 'Unknown error'}`)

    } finally {

      setIsLoadingCNR(false)

    }

  }



        // Load court data from Kleopatra API

        const loadCourtData = async (type: 'states' | 'districts' | 'complexes' | 'courts', params?: any) => {

          setIsLoadingCourtData(true)

          setCourtDataError(null)

          

          try {

            const config = {

              provider: 'third_party' as const,

              apiKey: 'klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104',

              timeout: 30000

            }

            

            const ecourtsProvider = new ECourtsProvider(config)

            let result: any

            

            switch (type) {

              case 'states':

                result = await ecourtsProvider.getDistrictCourtStates()

                if (result.success) {

                  setStaticCourtData(prev => ({ ...prev, states: result.data || [] }))

                }

                break

              case 'districts':

                result = await ecourtsProvider.getDistricts(params?.stateIds)

                if (result.success) {

                  setStaticCourtData(prev => ({ ...prev, districts: result.data || [] }))

                }

                break

              case 'complexes':

                result = await ecourtsProvider.getComplexes(params?.districtIds)

                if (result.success) {

                  setStaticCourtData(prev => ({ ...prev, complexes: result.data || [] }))

                }

                break

              case 'courts':

                result = await ecourtsProvider.getCourts(params?.complexIds)

                if (result.success) {

                  setStaticCourtData(prev => ({ ...prev, courts: result.data || [] }))

                }

                break

            }

            

            if (!result.success) {

              setCourtDataError(result.error || 'Failed to load court data')

            }

          } catch (error) {

            console.error('Error loading court data:', error)

            setCourtDataError('Failed to load court data from API')

          } finally {

            setIsLoadingCourtData(false)

          }

        }

        

        // Load states on component mount

        useEffect(() => {

          if (isAdvancedSearchOpen && staticCourtData.states.length === 0) {

            loadCourtData('states')

          }

        }, [isAdvancedSearchOpen])



        // Handle advanced search form changes

        const handleAdvancedSearchChange = (field: keyof AdvancedSearchForm, value: string) => {

          setAdvancedSearchForm(prev => {

            const newForm = { ...prev, [field]: value }

            

            // Reset dependent fields when court type changes

            if (field === 'courtType') {

              // Set default function based on court type

              switch (value) {

                case 'district':

              newForm.districtCourtFunction = 'cnr'

                  break

                case 'high':

                  newForm.highCourtFunction = 'cnr'

                  break

                case 'supreme':

                  newForm.supremeCourtFunction = 'diary'

                  break

                case 'nclt':

                  newForm.ncltFunction = 'caseNumber'

                  break

                case 'cat':

                  newForm.catFunction = 'caseNumber'

                  break

                case 'consumer':

                  newForm.consumerFunction = 'caseDetails'

                  break

              }

              newForm.state = ''

              newForm.district = ''

              newForm.complex = ''

            }

            

            // Reset dependent fields when state changes

            if (field === 'state') {

              newForm.district = ''

              newForm.complex = ''

              // Load districts for selected state

              if (value) {

                const selectedState = staticCourtData.states.find(s => s.name === value)

                if (selectedState) {

                  loadCourtData('districts', { stateIds: [selectedState.id] })

                }

              }

            }

            

            // Reset dependent fields when district changes

            if (field === 'district') {

              newForm.complex = ''

              // Load complexes for selected district

              if (value) {

                const selectedDistrict = staticCourtData.districts.find(d => d.name === value)

                if (selectedDistrict) {

                  loadCourtData('complexes', { districtIds: [selectedDistrict.id] })

                }

              }

            }

            

            // Load courts when complex changes

            if (field === 'complex' && value) {

              const selectedComplex = staticCourtData.complexes.find(c => c.name === value)

              if (selectedComplex) {

                loadCourtData('courts', { complexIds: [selectedComplex.id] })

              }

            }

            

            return newForm

          })

        }



        // Validate form based on selected function

        const isFormValid = () => {

          switch (advancedSearchForm.courtType) {

            case 'district':

            switch (advancedSearchForm.districtCourtFunction) {

              case 'cnr':

                return !!advancedSearchForm.cnrNumber?.trim()

              case 'party':

                return !!advancedSearchForm.partyName?.trim() && !!advancedSearchForm.state && !!advancedSearchForm.district

              case 'advocate':

                return !!advancedSearchForm.advocateName?.trim()

            case 'advocateNumber':

              return !!advancedSearchForm.advocateNumber?.trim() && !!advancedSearchForm.state && !!advancedSearchForm.year

              case 'filing':

                return !!advancedSearchForm.filingNumber?.trim()

              default:

                return false

            }

            case 'high':

              switch (advancedSearchForm.highCourtFunction) {

                case 'cnr':

                  return !!advancedSearchForm.cnrNumber?.trim()

                case 'party':

                  return !!advancedSearchForm.partyName?.trim()

                case 'advocate':

                  return !!advancedSearchForm.advocateName?.trim()

                case 'filing':

                  return !!advancedSearchForm.filingNumber?.trim()

                default:

                  return false

              }

            case 'supreme':

              switch (advancedSearchForm.supremeCourtFunction) {

                case 'diary':

                  return !!advancedSearchForm.diaryNumber?.trim()

                case 'party':

                  return !!advancedSearchForm.partyName?.trim()

                case 'orders':

                  return !!advancedSearchForm.orderDate?.trim()

                case 'aor':

                  return !!advancedSearchForm.aorNumber?.trim()

                default:

          return false

              }

            case 'nclt':

              switch (advancedSearchForm.ncltFunction) {

                case 'caseNumber':

                  return !!advancedSearchForm.caseNumber?.trim()

                case 'filingNumber':

                  return !!advancedSearchForm.filingNumber?.trim()

                case 'party':

                  return !!advancedSearchForm.partyName?.trim()

                default:

                  return false

              }

            case 'cat':

              switch (advancedSearchForm.catFunction) {

                case 'caseNumber':

                  return !!advancedSearchForm.caseNumber?.trim()

                case 'diaryNumber':

                  return !!advancedSearchForm.diaryNumber?.trim()

                case 'party':

                  return !!advancedSearchForm.partyName?.trim()

                case 'advocate':

                  return !!advancedSearchForm.advocateName?.trim()

                default:

                  return false

              }

            case 'consumer':

              switch (advancedSearchForm.consumerFunction) {

                case 'caseDetails':

                  return !!advancedSearchForm.consumerCaseNumber?.trim()

                default:

                  return false

              }

            default:

              return false

          }

        }



  // Handle advanced search submission

  const handleAdvancedSearchSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setIsLoadingCNR(true)

    setSearchError(null)

    setSearchSuccess(null)



    try {

      const searchParams = new URLSearchParams()

      

      // Add court type

      searchParams.append('courtType', advancedSearchForm.courtType)

      

      // Handle different court types and their functions

      let searchType = ''

      switch (advancedSearchForm.courtType) {

        case 'district':

          searchType = advancedSearchForm.districtCourtFunction || 'cnr'

          break

        case 'high':

          searchType = advancedSearchForm.highCourtFunction || 'cnr'

          break

        case 'supreme':

          searchType = advancedSearchForm.supremeCourtFunction || 'diary'

          break

        case 'nclt':

          searchType = advancedSearchForm.ncltFunction || 'caseNumber'

          break

        case 'cat':

          searchType = advancedSearchForm.catFunction || 'caseNumber'

          break

        case 'consumer':

          searchType = advancedSearchForm.consumerFunction || 'caseDetails'

          break

      }

      searchParams.append('searchType', searchType)

      

      // Add parameters based on court type and search function

      switch (advancedSearchForm.courtType) {

        case 'district':

        switch (advancedSearchForm.districtCourtFunction) {

          case 'cnr':

            if (!advancedSearchForm.cnrNumber?.trim()) {

              throw new Error('CNR Number is required')

            }

            searchParams.append('cnrNumber', advancedSearchForm.cnrNumber)

            break

            

          case 'party':

            if (!advancedSearchForm.partyName?.trim()) {

              throw new Error('Party Name is required')

            }

            searchParams.append('partyName', advancedSearchForm.partyName)

            if (advancedSearchForm.state) searchParams.append('state', advancedSearchForm.state)

            if (advancedSearchForm.district) searchParams.append('district', advancedSearchForm.district)

            if (advancedSearchForm.complex) searchParams.append('complex', advancedSearchForm.complex)

            if (advancedSearchForm.caseStage) searchParams.append('caseStage', advancedSearchForm.caseStage)

            if (advancedSearchForm.year) searchParams.append('year', advancedSearchForm.year)

            break

            

          case 'advocate':

            if (!advancedSearchForm.advocateName?.trim()) {

              throw new Error('Advocate Name is required')

            }

            searchParams.append('advocateName', advancedSearchForm.advocateName)

            break

            

          case 'advocateNumber':

            if (!advancedSearchForm.advocateNumber?.trim()) {

              throw new Error('Advocate Number is required')

            }

            searchParams.append('advocateNumber', advancedSearchForm.advocateNumber)

            break

            

          case 'filing':

            if (!advancedSearchForm.filingNumber?.trim()) {

              throw new Error('Filing Number is required')

            }

            searchParams.append('filingNumber', advancedSearchForm.filingNumber)

            break

        }

          break

          

        case 'high':

          switch (advancedSearchForm.highCourtFunction) {

            case 'cnr':

              if (!advancedSearchForm.cnrNumber?.trim()) {

                throw new Error('CNR Number is required')

              }

              searchParams.append('cnrNumber', advancedSearchForm.cnrNumber)

              break

            case 'party':

              if (!advancedSearchForm.partyName?.trim()) {

                throw new Error('Party Name is required')

              }

              searchParams.append('partyName', advancedSearchForm.partyName)

              break

            case 'advocate':

              if (!advancedSearchForm.advocateName?.trim()) {

                throw new Error('Advocate Name is required')

              }

              searchParams.append('advocateName', advancedSearchForm.advocateName)

              break

            case 'filing':

              if (!advancedSearchForm.filingNumber?.trim()) {

                throw new Error('Filing Number is required')

              }

              searchParams.append('filingNumber', advancedSearchForm.filingNumber)

              break

          }

          break

          

        case 'supreme':

          switch (advancedSearchForm.supremeCourtFunction) {

            case 'diary':

              if (!advancedSearchForm.diaryNumber?.trim()) {

                throw new Error('Diary Number is required')

              }

              searchParams.append('diaryNumber', advancedSearchForm.diaryNumber)

              break

            case 'party':

              if (!advancedSearchForm.partyName?.trim()) {

                throw new Error('Party Name is required')

              }

              searchParams.append('partyName', advancedSearchForm.partyName)

              break

            case 'orders':

              if (!advancedSearchForm.orderDate?.trim()) {

                throw new Error('Order Date is required')

              }

              searchParams.append('orderDate', advancedSearchForm.orderDate)

              break

            case 'aor':

              if (!advancedSearchForm.aorNumber?.trim()) {

                throw new Error('AOR Number is required')

              }

              searchParams.append('aorNumber', advancedSearchForm.aorNumber)

              break

          }

          break

          

        case 'nclt':

          switch (advancedSearchForm.ncltFunction) {

            case 'caseNumber':

              if (!advancedSearchForm.caseNumber?.trim()) {

                throw new Error('Case Number is required')

              }

              searchParams.append('caseNumber', advancedSearchForm.caseNumber)

              break

            case 'filingNumber':

              if (!advancedSearchForm.filingNumber?.trim()) {

                throw new Error('Filing Number is required')

              }

              searchParams.append('filingNumber', advancedSearchForm.filingNumber)

              break

            case 'party':

              if (!advancedSearchForm.partyName?.trim()) {

                throw new Error('Party Name is required')

              }

              searchParams.append('partyName', advancedSearchForm.partyName)

              break

          }

          break

          

        case 'cat':

          switch (advancedSearchForm.catFunction) {

            case 'caseNumber':

              if (!advancedSearchForm.caseNumber?.trim()) {

                throw new Error('Case Number is required')

              }

              searchParams.append('caseNumber', advancedSearchForm.caseNumber)

              break

            case 'diaryNumber':

              if (!advancedSearchForm.diaryNumber?.trim()) {

                throw new Error('Diary Number is required')

              }

              searchParams.append('diaryNumber', advancedSearchForm.diaryNumber)

              break

            case 'party':

              if (!advancedSearchForm.partyName?.trim()) {

                throw new Error('Party Name is required')

              }

              searchParams.append('partyName', advancedSearchForm.partyName)

              break

            case 'advocate':

              if (!advancedSearchForm.advocateName?.trim()) {

                throw new Error('Advocate Name is required')

              }

              searchParams.append('advocateName', advancedSearchForm.advocateName)

              break

          }

          break

          

        case 'consumer':

          switch (advancedSearchForm.consumerFunction) {

            case 'caseDetails':

              if (!advancedSearchForm.consumerCaseNumber?.trim()) {

                throw new Error('Case Number is required')

              }

              searchParams.append('consumerCaseNumber', advancedSearchForm.consumerCaseNumber)

              break

          }

          break

      }



      const response = await fetch(`/api/ecourts/advanced-search?${searchParams.toString()}`, {

        method: 'GET',

        headers: {

          'Content-Type': 'application/json',

        },

      })



      if (!response.ok) {

        throw new Error(`Search failed: ${response.statusText}`)

      }



      const result = await response.json()

      

      if (result.success && result.data) {

        // Add the found case to the list

        const newCase = result.data

        setCases(prevCases => [...prevCases, newCase])

        

        // Show success message with case details

        setSearchSuccess(`✅ Case found and added successfully! 

        Case: ${newCase.title}

        CNR: ${newCase.cnrNumber}

        Court: ${newCase.court}`)

        

        // Close modal after a short delay

        setTimeout(() => {

          setIsAdvancedSearchOpen(false)

          setSearchSuccess(null)

        }, 3000)

        

        // Reset form

        setAdvancedSearchForm({

          courtType: 'district',

          districtCourtFunction: 'cnr',

          highCourtFunction: 'cnr',

          supremeCourtFunction: 'diary',

          ncltFunction: 'caseNumber',

          catFunction: 'caseNumber',

          consumerFunction: 'caseDetails',

          cnrNumber: '',

          state: '',

          district: '',

          complex: '',

          partyName: '',

          caseStage: 'both',

          year: '',

          advocateName: '',

          advocateNumber: '',

          filingNumber: '',

          diaryNumber: '',

          aorNumber: '',

          orderDate: '',

          caseNumber: '',

          benchId: '',

          typeId: '',

          caseYear: '',

          consumerCaseNumber: ''

        })

      } else {

        throw new Error(result.error || 'No case found')

      }

    } catch (error) {

      console.error('Advanced search error:', error)

      const errorMessage = error instanceof Error ? error.message : 'Search failed'

      

      // Provide more helpful error messages

      if (errorMessage.includes('advocate') || errorMessage.includes('Advocate')) {

        setSearchError(`Advocate search failed: ${errorMessage}. 

        

💡 Try these alternatives:

• Search by Party Name instead

• Use CNR Lookup if you have the case number

• Check if the advocate name is spelled correctly`)

      } else {

        setSearchError(errorMessage)

      }

    } finally {

      setIsLoadingCNR(false)

    }

  }



  // Refresh cases function - Enhanced to fetch real data from API

  const handleRefresh = async () => {

    setIsRefreshing(true)

    try {

      console.log('🔄 Starting refresh of cases with real API data...')

      

      // Get current cases from localStorage

      const storedCases = localStorage.getItem('legal-cases')

      if (!storedCases) {

        console.log('No cases found to refresh')

        return

      }

      

      const currentCases = JSON.parse(storedCases)

      console.log(`📊 Found ${currentCases.length} cases to refresh`)

      

      // Refresh each case with real API data

      const refreshedCases = []

      let successCount = 0

      let errorCount = 0

      

      for (const caseItem of currentCases) {

        if (caseItem.cnrNumber) {

          try {

            console.log(`🔄 Refreshing case: ${caseItem.cnrNumber}`)

            

            // Fetch fresh data from API

            const response = await fetch('/api/ecourts/cnr/', {

              method: 'POST',

              headers: {

                'Content-Type': 'application/json',

              },

              body: JSON.stringify({ cnr: caseItem.cnrNumber }),

            })

            

            if (response.ok) {

              const result = await response.json()

              if (result.success && result.data) {

                // Update the case with fresh data

                const refreshedCase = {

                  ...caseItem,

                  ...result.data,

                  id: caseItem.id, // Keep the original ID

                  lastRefreshed: new Date().toISOString()

                }

                refreshedCases.push(refreshedCase)

                successCount++

                console.log(`✅ Successfully refreshed: ${caseItem.cnrNumber}`)

              } else {

                // Keep original case if API fails

                refreshedCases.push(caseItem)

                errorCount++

                console.log(`⚠️ API failed for ${caseItem.cnrNumber}, keeping original data`)

              }

            } else {

              // Keep original case if API fails

              refreshedCases.push(caseItem)

              errorCount++

              console.log(`⚠️ API error for ${caseItem.cnrNumber}, keeping original data`)

            }

          } catch (error) {

            // Keep original case if API fails

            refreshedCases.push(caseItem)

            errorCount++

            console.log(`❌ Error refreshing ${caseItem.cnrNumber}:`, error instanceof Error ? error.message : 'Unknown error')

          }

        } else {

          // Keep cases without CNR as-is

          refreshedCases.push(caseItem)

        }

      }

      

      // Update cases state and localStorage

      setCases(refreshedCases)

      localStorage.setItem('legal-cases', JSON.stringify(refreshedCases))

      

      console.log(`🎉 Refresh completed: ${successCount} successful, ${errorCount} failed`)

      

      // Show success message

      if (successCount > 0) {

        setSearchSuccess(`Successfully refreshed ${successCount} cases with real API data!`)

        setTimeout(() => setSearchSuccess(null), 5000)

      }

      

    } catch (error) {

      console.error('Error refreshing cases:', error)

      setSearchError('Failed to refresh cases. Please try again.')

      setTimeout(() => setSearchError(null), 5000)

    } finally {

      setIsRefreshing(false)

    }

  }



  const handleEditCase = (caseToEdit: Case) => {

    setEditingCase(caseToEdit)

    setNewCase({

      caseNumber: caseToEdit.caseNumber,

      filingNumber: caseToEdit.filingNumber || '',

      title: caseToEdit.title,

      petitionerName: caseToEdit.petitionerName,

      respondentName: caseToEdit.respondentName,

      court: caseToEdit.court,

      priority: caseToEdit.priority,

      stage: caseToEdit.stage

    })

    setShowEditModal(true)

  }



  const handleViewDetails = (caseToView: Case) => {

    setSelectedCase(caseToView)

    setShowCaseDetails(true)

  }



  const handleUpdateCase = async () => {

    if (!editingCase || !newCase.caseNumber || !newCase.title || !newCase.petitionerName) {

      alert('Please fill in all required fields')

      return

    }



    const updatedCase: Case = {

      ...editingCase,

      caseNumber: newCase.caseNumber,

      filingNumber: newCase.filingNumber || undefined,

      title: newCase.title,

      petitionerName: newCase.petitionerName,

      respondentName: newCase.respondentName,

      court: newCase.court,

      priority: newCase.priority,

      stage: newCase.stage

    }



    try {

      // Convert Case to CloudCase format for update

      const cloudUpdates: Partial<CloudCase> = {

        title: updatedCase.title,

        caseNumber: updatedCase.caseNumber,

        cnrNumber: updatedCase.cnrNumber,

        petitionerName: updatedCase.petitionerName,

        respondentName: updatedCase.respondentName,

        court: updatedCase.court,

        courtLocation: updatedCase.courtLocation,

        subjectMatter: updatedCase.subjectMatter,

        reliefSought: updatedCase.reliefSought,

        stage: updatedCase.stage,

        caseStatus: updatedCase.caseStatus,

        priority: updatedCase.priority,

        filingDate: updatedCase.filingDate,

        nextHearingDate: updatedCase.nextHearingDate,

        lastHearingDate: updatedCase.lastHearingDate,

        caseValue: updatedCase.caseValue,

        assignedTo: updatedCase.assignedTo,

        notes: updatedCase.notes,

        documents: updatedCase.documents,

        // Additional eCourts data

        registrationNumber: updatedCase.registrationNumber,

        filingNumber: updatedCase.filingNumber,

        status: updatedCase.status,

        parties: updatedCase.parties,

        acts: updatedCase.acts,

        subMatters: updatedCase.subMatters,

        iaDetails: updatedCase.iaDetails,

        categoryDetails: updatedCase.categoryDetails,

        documentDetails: updatedCase.documentDetails,

        objections: updatedCase.objections,

        history: updatedCase.history,

        orders: updatedCase.orders,

        firstInformationReport: updatedCase.firstInformationReport,

        transfer: updatedCase.transfer

      }



      await cloudStorageService.updateCase(updatedCase.id, cloudUpdates)

      

      // Update local state

      setCases(cases.map(c => c.id === editingCase.id ? updatedCase : c))

      setShowEditModal(false)

      setEditingCase(null)

      setNewCase({

        caseNumber: '',

        filingNumber: '',

        title: '',

        petitionerName: '',

        respondentName: '',

        court: '',

        priority: 'MEDIUM',

        stage: ''

      })

    } catch (error) {

      console.error('Failed to update case in cloud storage:', error)

      // Fallback to local state

    setCases(cases.map(c => c.id === editingCase.id ? updatedCase : c))

    setShowEditModal(false)

    setEditingCase(null)

    setNewCase({

      caseNumber: '',

      filingNumber: '',

      title: '',

      petitionerName: '',

      respondentName: '',

      court: '',

      priority: 'MEDIUM',

      stage: ''

    })

    }

  }



  const handleDeleteCase = async (caseId: string) => {

    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {

      try {

        await cloudStorageService.deleteCase(caseId)

        setCases(cases.filter(c => c.id !== caseId))

      } catch (error) {

        console.error('Failed to delete case from cloud storage:', error)

        // Fallback to local state

      setCases(cases.filter(c => c.id !== caseId))

      }

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

    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Header */}

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center py-6">

            <div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cases</h1>

              <p className="text-gray-600 dark:text-gray-400">Manage your legal cases</p>

              

              {/* Cloud Sync Status */}

              <div className="mt-2 flex items-center space-x-2">

                <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${

                  cloudSyncStatus.isOnline 

                    ? 'bg-green-100 text-green-800' 

                    : 'bg-orange-100 text-orange-800'

                }`}>

                  <CloudIcon className="h-3 w-3" />

                  <span>{cloudSyncStatus.isOnline ? 'Cloud Connected' : 'Offline Mode'}</span>

                </div>

                

                {activeUsers > 0 && (

                  <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">

                    <UserIcon className="h-3 w-3" />

                    <span>{activeUsers} user{activeUsers !== 1 ? 's' : ''} online</span>

                  </div>

                )}

                

                {cloudSyncStatus.pendingChanges > 0 && (

                  <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">

                    <ExclamationTriangleIcon className="h-3 w-3" />

                    <span>{cloudSyncStatus.pendingChanges} pending</span>

                  </div>

                )}

                

                {cloudSyncStatus.syncErrors.length > 0 && (

                  <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">

                    <ExclamationTriangleIcon className="h-3 w-3" />

                    <span>{cloudSyncStatus.syncErrors.length} errors</span>

                  </div>

                )}

              </div>

            </div>

            <div className="flex space-x-3">

              <button

                onClick={handleRefresh}

                disabled={isRefreshing}

                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"

              >

                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />

                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>

              </button>

              <AnimatedButton

                onClick={() => setShowAddModal(true)}

                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"

              >

                Add Case

              </AnimatedButton>

              <AnimatedButton

                onClick={() => setShowCNRModal(true)}

                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"

              >

                Import by CNR

              </AnimatedButton>

              <AnimatedButton

                onClick={() => setIsAdvancedSearchOpen(true)}

                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"

              >

                <FunnelIcon className="h-5 w-5 mr-2" />

                Advanced Search

              </AnimatedButton>

              

              {/* Auto-Refresh Controls */}

              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">

                <label className="flex items-center space-x-2 text-sm">

                  <input

                    type="checkbox"

                    checked={autoRefreshEnabled}

                    onChange={(e) => handleAutoRefreshToggle(e.target.checked)}

                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"

                  />

                  <span className="text-gray-700">Auto-refresh</span>

                </label>

                

                {autoRefreshEnabled && (

                  <select

                    value={refreshInterval}

                    onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}

                    className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"

                  >

                    <option value={15}>Every 15 min</option>

                    <option value={30}>Every 30 min</option>

                    <option value={60}>Every 1 hour</option>

                    <option value={120}>Every 2 hours</option>

                    <option value={240}>Every 4 hours</option>

                  </select>

                )}

                

                <button

                  onClick={handleManualSync}

                  disabled={syncStatus.isRunning}

                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"

                >

                  {syncStatus.isRunning ? 'Syncing...' : 'Sync Now'}

              </button>

              </div>

            </div>

          </div>

        </div>

      </header>



      {/* Search Bar */}

      <div className="bg-white border-b">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          <div className="relative">

            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />

            </div>

            <input

              type="text"

              placeholder="Search cases by title, case number, CNR, parties, court, or any other field..."

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"

            />

            {searchQuery && (

              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">

                <button

                  onClick={() => setSearchQuery('')}

                  className="text-gray-400 hover:text-gray-600"

                >

                  <XMarkIcon className="h-5 w-5" />

                </button>

              </div>

            )}

          </div>

          {searchQuery && (

            <div className="mt-2 text-sm text-gray-600">

              Showing {filteredCases.length} of {cases.length} cases

            </div>

          )}

        </div>

      </div>



      {/* Real-time Activity Feed */}

      {recentActivities.length > 0 && (

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

            <div className="flex items-center justify-between mb-2">

              <h3 className="text-sm font-medium text-blue-900">Recent Activity</h3>

              <span className="text-xs text-blue-700">{activeUsers} user{activeUsers !== 1 ? 's' : ''} online</span>

            </div>

            <div className="space-y-1">

              {recentActivities.slice(0, 3).map((activity, index) => (

                <div key={index} className="text-xs text-blue-800 flex items-center space-x-2">

                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>

                  <span>

                    <strong>{activity.userName}</strong> {activity.action.toLowerCase()}d 

                    <strong> {activity.entityName}</strong>

                    {activity.details && ` - ${activity.details}`}

                  </span>

                  <span className="text-blue-600">

                    {new Date(activity.timestamp).toLocaleTimeString()}

                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

      )}



      {/* Background Sync Status */}

      {autoRefreshEnabled && (

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-3">

                <div className="flex items-center space-x-2">

                  <div className={`w-2 h-2 rounded-full ${syncStatus.isRunning ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>

                  <span className="text-sm font-medium text-blue-900">

                    {syncStatus.isRunning ? 'Syncing cases...' : 'Auto-refresh enabled'}

                  </span>

                </div>

                

                {syncStatus.lastSync && (

                  <span className="text-xs text-blue-700">

                    Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}

                  </span>

                )}

                

                {syncStatus.nextSync && (

                  <span className="text-xs text-blue-700">

                    Next sync: {new Date(syncStatus.nextSync).toLocaleTimeString()}

                  </span>

                )}

              </div>

              

              <div className="flex items-center space-x-2 text-xs text-blue-700">

                <span>Interval: {refreshInterval} min</span>

                <span>•</span>

                <span>Cases: {syncStatus.totalCases}</span>

                {syncStatus.updatedCases > 0 && (

                  <>

                    <span>•</span>

                    <span className="text-green-700">Updated: {syncStatus.updatedCases}</span>

                  </>

                )}

                {syncStatus.failedCases > 0 && (

                  <>

                    <span>•</span>

                    <span className="text-red-700">Failed: {syncStatus.failedCases}</span>

                  </>

                )}

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Main Content */}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        <div className="px-4 py-6 sm:px-0">

          <div className="bg-white shadow overflow-hidden sm:rounded-md">

            <div className="px-4 py-5 sm:px-6">

              <h3 className="text-lg leading-6 font-medium text-gray-900">Cases</h3>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">

                List of all legal cases

              </p>

            </div>

            <ul className="divide-y divide-gray-200">

              {filteredCases.map((caseItem) => (

                <li key={caseItem.id} className="hover:bg-gray-50">

                  <div className="px-4 py-4 flex items-center justify-between">

                    <div className="flex-1">

                      <div className="flex items-center justify-between">

                        <p

                          onClick={() => router.push(`/cases/${caseItem.id}`)}

                          className="text-sm font-medium text-blue-600 truncate cursor-pointer hover:underline"

                        >

                          {formatCaseNumber(caseItem)}

                        </p>

                        <div className="ml-2 flex-shrink-0 flex">

                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(caseItem.priority)}`}>

                            {caseItem.priority}

                          </span>

                        </div>

                      </div>

                      <div className="mt-2">

                        <div className="flex items-center text-sm text-gray-500">

                          <p className="truncate font-medium">{formatCaseTitle(caseItem.title)}</p>

                        </div>

                        <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-500">

                          <div>

                      <p><span className="font-medium">CNR:</span> {caseItem.cnrNumber || 'Not specified'}</p>

                      <p><span className="font-medium">Case No:</span> {formatCaseNumber(caseItem)}</p>

                      <p><span className="font-medium">Petitioner:</span> {caseItem.petitionerName || 'Not specified'}</p>

                      <p><span className="font-medium">Respondent:</span> {caseItem.respondentName || 'Not specified'}</p>

                            {caseItem.advocates && caseItem.advocates.length > 0 && (

                              <p><span className="font-medium">Advocate:</span> {caseItem.advocates[0].name}</p>

                            )}

                          </div>

                          <div>

                            <p><span className="font-medium">Court:</span> {caseItem.court || 'Not specified'}</p>

                            {caseItem.hallNumber && <p><span className="font-medium">Hall:</span> {caseItem.hallNumber}</p>}

                            <p><span className="font-medium">Type:</span> {caseItem.caseType || 'Not specified'}</p>

                            <p><span className="font-medium">Status:</span> 

                              <span className={`ml-1 px-2 py-1 text-xs rounded-full ${

                                caseItem.caseStatus && caseItem.caseStatus.includes('SUMMONS') ? 'bg-yellow-100 text-yellow-800' :

                                caseItem.caseStatus && caseItem.caseStatus.includes('HEARING') ? 'bg-blue-100 text-blue-800' :

                                caseItem.caseStatus && caseItem.caseStatus.includes('ORDERS') ? 'bg-green-100 text-green-800' :

                                'bg-gray-100 text-gray-800'

                              }`}>

                                {caseItem.caseStatus ? caseItem.caseStatus.replace(/<br>|<b>|<\/b>/g, ' ').trim() : 'Unknown'}

                              </span>

                            </p>

                          </div>

                        </div>

                        {caseItem.subjectMatter && (

                          <div className="mt-1 text-sm text-gray-500">

                            <p><span className="font-medium">Subject:</span> {caseItem.subjectMatter}</p>

                          </div>

                        )}

                        {/* Show additional eCourts data if available */}

                        {(caseItem.actsAndSections || (caseItem.orders && caseItem.orders.length > 0) || (caseItem.hearingHistory && caseItem.hearingHistory.length > 0)) && (

                          <div className="mt-2 flex flex-wrap gap-2">

                            {caseItem.actsAndSections && caseItem.actsAndSections.acts && (

                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">

                                📋 {caseItem.actsAndSections.acts}

                              </span>

                            )}

                            {caseItem.orders && caseItem.orders.length > 0 && (

                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">

                                📄 {caseItem.orders.length} Order{caseItem.orders.length > 1 ? 's' : ''}

                              </span>

                            )}

                            {caseItem.hearingHistory && caseItem.hearingHistory.length > 0 && (

                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">

                                ⚖️ {caseItem.hearingHistory.length} Hearing{caseItem.hearingHistory.length > 1 ? 's' : ''}

                              </span>

                            )}

                          </div>

                        )}

                      </div>

                    </div>

                    <div className="flex-shrink-0 text-right">

                      <p className="text-sm text-gray-500 mb-2">

                        {caseItem.nextHearingDate ? `Next Hearing: ${new Date(caseItem.nextHearingDate).toLocaleDateString()}` : 'No upcoming hearings'}

                      </p>

                      <div className="flex space-x-2">

                        <button

                          onClick={() => handleViewDetails(caseItem)}

                          className="text-green-600 hover:text-green-800 text-sm font-medium"

                        >

                          View Details

                        </button>

                        <button

                          onClick={() => handleEditCase(caseItem)}

                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"

                        >

                          Edit

                        </button>

                        <button

                          onClick={() => handleDeleteCase(caseItem.id)}

                          className="text-red-600 hover:text-red-800 text-sm font-medium"

                        >

                          Delete

                        </button>

                      </div>

                    </div>

                  </div>

                </li>

              ))}

            </ul>

          </div>

        </div>

      </main>



      {/* Add Case Modal */}

      {showAddModal && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

            <div className="mt-3">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-medium text-gray-900">Add New Case</h3>

                <button

                  onClick={() => setShowAddModal(false)}

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

                    Registration Number *

                  </label>

                  <input

                    type="text"

                    value={newCase.caseNumber}

                    onChange={(e) => setNewCase({...newCase, caseNumber: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., REG-2024-004"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Filing Number

                  </label>

                  <input

                    type="text"

                    value={newCase.filingNumber}

                    onChange={(e) => setNewCase({...newCase, filingNumber: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., FIL-2024-004 (optional)"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Case Title *

                  </label>

                  <input

                    type="text"

                    value={newCase.title}

                    onChange={(e) => setNewCase({...newCase, title: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., Contract Dispute Resolution"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Petitioner Name *

                  </label>

                  <input

                    type="text"

                    value={newCase.petitionerName}

                    onChange={(e) => setNewCase({...newCase, petitionerName: e.target.value})}

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

                    value={newCase.court}

                    onChange={(e) => setNewCase({...newCase, court: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., High Court of Delhi"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Priority

                  </label>

                  <select

                    value={newCase.priority}

                    onChange={(e) => setNewCase({...newCase, priority: e.target.value as any})}

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

                    value={newCase.stage}

                    onChange={(e) => setNewCase({...newCase, stage: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., Preliminary, Arguments, Evidence"

                  />

                </div>

              </div>

              

              <div className="flex justify-end space-x-3 mt-6">

                <button

                  onClick={() => setShowAddModal(false)}

                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"

                >

                  Cancel

                </button>

                <button

                  onClick={handleAddCase}

                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"

                >

                  Add Case

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* CNR Import Modal */}

      {showCNRModal && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

            <div className="mt-3">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-medium text-gray-900">Import Case by CNR</h3>

                <button

                  onClick={() => {

                    setShowCNRModal(false)

                    setCnrNumber('')

                  }}

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

                    CNR Number *

                  </label>

                  <input

                    type="text"

                    value={cnrNumber}

                    onChange={(e) => setCnrNumber(e.target.value.slice(0, 16))}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"

                    placeholder="e.g., KABC010106452025"

                    maxLength={16}

                  />

                  <p className="text-xs text-gray-500 mt-1">

                    Enter the 16-character CNR number from eCourts

                  </p>

                </div>

                

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">

                  <div className="flex">

                    <div className="flex-shrink-0">

                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">

                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />

                      </svg>

                    </div>

                    <div className="ml-3">

                      <p className="text-sm text-blue-800">

                        <strong>eCourts Integration Status:</strong> Real-time data integration with Kleopatra API is active. Your API key is configured and ready to fetch live case data from Indian courts.

                      </p>

                    </div>

                  </div>

                </div>

              </div>

              

              <div className="flex justify-end space-x-3 mt-6">

                <button

                  onClick={() => {

                    setShowCNRModal(false)

                    setCnrNumber('')

                  }}

                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"

                >

                  Cancel

                </button>

                <button

                  onClick={handleCNRImport}

                  disabled={isLoadingCNR || cnrNumber.length !== 16}

                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {isLoadingCNR ? 'Importing...' : 'Import Case'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Advanced Search Modal */}

      {isAdvancedSearchOpen && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">

            <div className="mt-3">

                     <div className="flex items-center justify-between mb-4">

                       <div>

                         <h3 className="text-lg font-medium text-gray-900">Advanced Case Search</h3>

                         <p className="text-sm text-gray-600 mt-1">Powered by Kleopatra API - Access comprehensive court data across multiple jurisdictions</p>

                       </div>

                       <button

                         onClick={() => setIsAdvancedSearchOpen(false)}

                         className="text-gray-400 hover:text-gray-600"

                       >

                         <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                         </svg>

                       </button>

                     </div>



                     {/* API Status Indicator */}

                     <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">

                       <div className="flex items-center">

                         <div className="flex-shrink-0">

                           <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">

                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                           </svg>

                         </div>

                         <div className="ml-3">

                           <h4 className="text-sm font-medium text-green-800">Official E-Courts API Connected</h4>

                           <p className="text-sm text-green-700">Real-time access via Official E-Courts v17.0, Kleopatra, Phoenix, and Surepass APIs. Supports all court types: District Court, High Court, Supreme Court, NCLT, CAT, and Consumer Forum.</p>

                         </div>

                       </div>

                     </div>



                     {/* Court Data Loading Indicator */}

                     {isLoadingCourtData && (

                       <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">

                         <div className="flex items-center">

                           <div className="flex-shrink-0">

                             <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                             </svg>

                           </div>

                           <div className="ml-3">

                             <h4 className="text-sm font-medium text-blue-800">Loading Court Data</h4>

                             <p className="text-sm text-blue-700">Fetching latest court information from Kleopatra API...</p>

                           </div>

                         </div>

                       </div>

                     )}



                     {/* Court Data Error Indicator */}

                     {courtDataError && (

                       <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">

                         <div className="flex items-center">

                           <div className="flex-shrink-0">

                             <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">

                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />

                             </svg>

                           </div>

                           <div className="ml-3">

                             <h4 className="text-sm font-medium text-yellow-800">Using Fallback Data</h4>

                             <p className="text-sm text-yellow-700">Court data loading failed: {courtDataError}. Using pre-loaded court information.</p>

                           </div>

                         </div>

                       </div>

                     )}



                     {/* Usage Guide */}

                     <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">

                       <div className="flex items-start">

                         <div className="flex-shrink-0">

                           <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                           </svg>

                         </div>

                         <div className="ml-3">

                           <h4 className="text-sm font-medium text-gray-900">How to Use Advanced Search</h4>

                           <div className="mt-2 text-sm text-gray-700">

                             <ol className="list-decimal list-inside space-y-1">

                               <li><strong>Select Court Type:</strong> Choose from District Court, High Court, Supreme Court, NCLT, CAT, or Consumer Forum</li>

                               <li><strong>Choose Search Function:</strong> Pick the appropriate search method based on your available information</li>

                               <li><strong>Enter Search Criteria:</strong> Fill in the required fields for your selected search function</li>

                               <li><strong>Submit Search:</strong> Click "Search Cases" to find and import case data</li>

                             </ol>

                             <p className="mt-2 text-xs text-gray-600">

                               💡 <strong>Tip:</strong> For District Court searches, you can use location filters to narrow down results by state, district, and complex.

                               <br />

                               🔄 <strong>Reliability:</strong> Our system automatically tries multiple API providers (Official E-Courts v17.0, Kleopatra, Phoenix, Surepass) to ensure the best results.

                             </p>

                           </div>

                         </div>

                       </div>

                     </div>



              <form onSubmit={handleAdvancedSearchSubmit} className="space-y-8">

                {/* Court Type Selection Section */}

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">

                  <div className="flex items-center mb-4">

                    <div className="flex-shrink-0">

                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />

                      </svg>

                    </div>

                    <div className="ml-3">

                      <h4 className="text-lg font-semibold text-green-900">Select Court Type</h4>

                      <p className="text-sm text-green-700">Choose the court jurisdiction for your search</p>

                    </div>

                  </div>

                  

                  <div className="grid grid-cols-3 gap-3">

                    {courtTypeOptions.map((option) => {

                      const Icon = option.icon

                      return (

                        <label key={option.value} className="relative">

                          <input

                            type="radio"

                            name="courtType"

                            value={option.value}

                            checked={advancedSearchForm.courtType === option.value}

                            onChange={(e) => handleAdvancedSearchChange('courtType', e.target.value)}

                            className="sr-only"

                          />

                          <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                            advancedSearchForm.courtType === option.value

                              ? 'border-green-500 bg-green-100'

                              : 'border-gray-300 hover:border-green-400 bg-white'

                          }`}>

                            <div className="flex items-center space-x-2">

                              <Icon className="h-5 w-5 text-gray-600" />

                              <span className="text-sm font-medium text-gray-900">{option.label}</span>

                            </div>

                          </div>

                        </label>

                      )

                    })}

                  </div>

                </div>



                {/* District Court Functions Section */}

                {advancedSearchForm.courtType === 'district' && (

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-blue-900">District Court Search Functions</h4>

                        <p className="text-sm text-blue-700">Available search methods for District Court</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {districtCourtFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="districtCourtFunction"

                              value={option.value}

                              checked={advancedSearchForm.districtCourtFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('districtCourtFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.districtCourtFunction === option.value

                                ? 'border-blue-500 bg-blue-100'

                                : 'border-gray-300 hover:border-blue-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* High Court Functions Section */}

                {advancedSearchForm.courtType === 'high' && (

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-purple-900">High Court Search Functions</h4>

                        <p className="text-sm text-purple-700">Available search methods for High Court</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {highCourtFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="highCourtFunction"

                              value={option.value}

                              checked={advancedSearchForm.highCourtFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('highCourtFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.highCourtFunction === option.value

                                ? 'border-purple-500 bg-purple-100'

                                : 'border-gray-300 hover:border-purple-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* Supreme Court Functions Section */}

                {advancedSearchForm.courtType === 'supreme' && (

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-red-900">Supreme Court Search Functions</h4>

                        <p className="text-sm text-red-700">Available search methods for Supreme Court</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {supremeCourtFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="supremeCourtFunction"

                              value={option.value}

                              checked={advancedSearchForm.supremeCourtFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('supremeCourtFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.supremeCourtFunction === option.value

                                ? 'border-red-500 bg-red-100'

                                : 'border-gray-300 hover:border-red-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* NCLT Functions Section */}

                {advancedSearchForm.courtType === 'nclt' && (

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-orange-900">NCLT Search Functions</h4>

                        <p className="text-sm text-orange-700">Available search methods for National Company Law Tribunal</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {ncltFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="ncltFunction"

                              value={option.value}

                              checked={advancedSearchForm.ncltFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('ncltFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.ncltFunction === option.value

                                ? 'border-orange-500 bg-orange-100'

                                : 'border-gray-300 hover:border-orange-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* CAT Functions Section */}

                {advancedSearchForm.courtType === 'cat' && (

                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-indigo-900">CAT Search Functions</h4>

                        <p className="text-sm text-indigo-700">Available search methods for Central Administrative Tribunal</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {catFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="catFunction"

                              value={option.value}

                              checked={advancedSearchForm.catFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('catFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.catFunction === option.value

                                ? 'border-indigo-500 bg-indigo-100'

                                : 'border-gray-300 hover:border-indigo-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* Consumer Forum Functions Section */}

                {advancedSearchForm.courtType === 'consumer' && (

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">

                    <div className="flex items-center mb-4">

                      <div className="flex-shrink-0">

                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h4 className="text-lg font-semibold text-yellow-900">Consumer Forum Search Functions</h4>

                        <p className="text-sm text-yellow-700">Available search methods for Consumer Forum</p>

                      </div>

                    </div>

                    

                    <div className="grid grid-cols-2 gap-3">

                      {consumerFunctions.map((option) => {

                        const Icon = option.icon

                        return (

                          <label key={option.value} className="relative">

                            <input

                              type="radio"

                              name="consumerFunction"

                              value={option.value}

                              checked={advancedSearchForm.consumerFunction === option.value}

                              onChange={(e) => handleAdvancedSearchChange('consumerFunction', e.target.value)}

                              className="sr-only"

                            />

                            <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${

                              advancedSearchForm.consumerFunction === option.value

                                ? 'border-yellow-500 bg-yellow-100'

                                : 'border-gray-300 hover:border-yellow-400 bg-white'

                            }`}>

                              <div className="flex items-center space-x-2">

                                <Icon className="h-5 w-5 text-gray-600" />

                                <div>

                                  <span className="text-sm font-medium text-gray-900">{option.label}</span>

                                  <p className="text-xs text-gray-600">{option.description}</p>

                                </div>

                              </div>

                            </div>

                          </label>

                        )

                      })}

                    </div>

                  </div>

                )}



                {/* Search Parameters Section */}

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">

                  <div className="flex items-center mb-4">

                    <div className="flex-shrink-0">

                      <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />

                      </svg>

                    </div>

                    <div className="ml-3">

                      <h4 className="text-lg font-semibold text-gray-900">Search Parameters</h4>

                      <p className="text-sm text-gray-700">Enter your search criteria based on selected function</p>

                    </div>

                  </div>



                  {/* CNR Lookup */}

                  {advancedSearchForm.courtType === 'district' && advancedSearchForm.districtCourtFunction === 'cnr' && (

                    <div className="mb-4">

                      <label htmlFor="cnr-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Case Number Reference (CNR) *

                      </label>

                      <input

                        id="cnr-number"

                        type="text"

                        value={advancedSearchForm.cnrNumber}

                        onChange={(e) => handleAdvancedSearchChange('cnrNumber', e.target.value)}

                        placeholder="Enter CNR number (e.g., KABC010153302024)"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                        required

                      />

                    </div>

                  )}



                  {/* Party Search */}

                  {advancedSearchForm.courtType === 'district' && advancedSearchForm.districtCourtFunction === 'party' && (

                    <div className="space-y-4">

                      {/* State Selection */}

                      <div>

                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">

                          State *

                        </label>

                        <select

                          id="state"

                          value={advancedSearchForm.state}

                          onChange={(e) => handleAdvancedSearchChange('state', e.target.value)}

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                          required

                          disabled={isLoadingCourtData}

                        >

                          <option value="">

                            {isLoadingCourtData ? 'Loading states...' : 'Select State'}

                          </option>

                          {(staticCourtData.states.length > 0 ? staticCourtData.states : fallbackStates.map(name => ({ id: name.toLowerCase(), name }))).map(state => (

                            <option key={state.id || (state as any)} value={state.name || (state as any)}>

                              {state.name || (state as any)}

                            </option>

                          ))}

                        </select>

                      </div>



                      {/* District Selection */}

                      {advancedSearchForm.state && (

                        <div>

                          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">

                            District *

                          </label>

                          <select

                            id="district"

                            value={advancedSearchForm.district}

                            onChange={(e) => handleAdvancedSearchChange('district', e.target.value)}

                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                            required

                            disabled={isLoadingCourtData}

                          >

                            <option value="">

                              {isLoadingCourtData ? 'Loading districts...' : 'Select District'}

                            </option>

                            {(staticCourtData.districts.length > 0 ? staticCourtData.districts : fallbackDistricts[advancedSearchForm.state as keyof typeof fallbackDistricts]?.map(name => ({ id: name.toLowerCase(), name })) || []).map(district => (

                              <option key={district.id || (district as any)} value={district.name || (district as any)}>

                                {district.name || (district as any)}

                              </option>

                            ))}

                          </select>

                        </div>

                      )}



                      {/* Complex Selection */}

                      {advancedSearchForm.district && (

                        <div>

                          <label htmlFor="complex" className="block text-sm font-medium text-gray-700 mb-2">

                            Complex

                          </label>

                          <select

                            id="complex"

                            value={advancedSearchForm.complex}

                            onChange={(e) => handleAdvancedSearchChange('complex', e.target.value)}

                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                            disabled={isLoadingCourtData}

                          >

                            <option value="">

                              {isLoadingCourtData ? 'Loading complexes...' : 'Entire District'}

                            </option>

                            {(staticCourtData.complexes.length > 0 ? staticCourtData.complexes : fallbackComplexes[advancedSearchForm.district as keyof typeof fallbackComplexes]?.map(name => ({ id: name.toLowerCase(), name })) || []).map(complex => (

                              <option key={complex.id || (complex as any)} value={complex.name || (complex as any)}>

                                {complex.name || (complex as any)}

                              </option>

                            ))}

                          </select>

                        </div>

                      )}



                      {/* Party Name */}

                      <div>

                        <label htmlFor="party-name" className="block text-sm font-medium text-gray-700 mb-2">

                          Party Name *

                        </label>

                        <input

                          id="party-name"

                          type="text"

                          value={advancedSearchForm.partyName}

                          onChange={(e) => handleAdvancedSearchChange('partyName', e.target.value)}

                          placeholder="Enter party name"

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                          required

                        />

                      </div>



                      {/* Case Stage */}

                      <div>

                        <label htmlFor="case-stage" className="block text-sm font-medium text-gray-700 mb-2">

                          Case Stage

                        </label>

                        <select

                          id="case-stage"

                          value={advancedSearchForm.caseStage}

                          onChange={(e) => handleAdvancedSearchChange('caseStage', e.target.value)}

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                        >

                          <option value="both">Both (Pending & Disposed)</option>

                          <option value="pending">Pending</option>

                          <option value="disposed">Disposed</option>

                        </select>

                      </div>



                      {/* Year */}

                      <div>

                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">

                          Year

                        </label>

                        <input

                          id="year"

                          type="text"

                          value={advancedSearchForm.year}

                          onChange={(e) => handleAdvancedSearchChange('year', e.target.value)}

                          placeholder="e.g., 2024, 2025"

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                        />

                      </div>

                    </div>

                  )}



                  {/* Advocate Search */}

                  {advancedSearchForm.courtType === 'district' && advancedSearchForm.districtCourtFunction === 'advocate' && (

                    <div className="mb-4">

                      <label htmlFor="advocate-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Advocate Name *

                      </label>

                      <input

                        id="advocate-name"

                        type="text"

                        value={advancedSearchForm.advocateName}

                        onChange={(e) => handleAdvancedSearchChange('advocateName', e.target.value)}

                        placeholder="Enter advocate name (e.g., John Doe, Smith Kumar)"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                        required

                      />

                      <div className="mt-1 text-xs text-gray-500">

                        💡 Test with Karnataka state code (KAR) and year 2021

                      </div>

                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">

                        <div className="flex">

                          <div className="flex-shrink-0">

                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">

                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />

                            </svg>

                          </div>

                          <div className="ml-3">

                            <h3 className="text-sm font-medium text-blue-800">Advocate Search Note</h3>

                            <div className="mt-2 text-sm text-blue-700">

                              <p>Advocate search may have limited results. If no cases are found, try:</p>

                              <ul className="mt-1 list-disc list-inside">

                                <li>Searching by Party Name instead</li>

                                <li>Using CNR Lookup if you have the case number</li>

                                <li>Checking the spelling of the advocate name</li>

                              </ul>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  )}



                  {/* Advocate Number */}

                  {advancedSearchForm.courtType === 'district' && advancedSearchForm.districtCourtFunction === 'advocateNumber' && (

                    <div className="space-y-4">

                      <div>

                        <label htmlFor="advocate-number" className="block text-sm font-medium text-gray-700 mb-2">

                          Advocate Number *

                        </label>

                        <input

                          id="advocate-number"

                          type="text"

                          value={advancedSearchForm.advocateNumber}

                          onChange={(e) => handleAdvancedSearchChange('advocateNumber', e.target.value)}

                          placeholder="Enter advocate registration number (e.g., 2271)"

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                          required

                        />

                        <div className="mt-1 text-xs text-gray-500">

                          💡 Test with registration number 2271, Karnataka (KAR), year 2021

                        </div>

                      </div>

                      

                      <div>

                        <label htmlFor="advocate-state" className="block text-sm font-medium text-gray-700 mb-2">

                          State Code *

                        </label>

                        <select

                          id="advocate-state"

                          value={advancedSearchForm.state}

                          onChange={(e) => handleAdvancedSearchChange('state', e.target.value)}

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                          required

                        >

                          <option value="">Select State</option>

                          {fallbackStates.map((state: string) => (

                            <option key={state} value={state}>

                              {state}

                            </option>

                          ))}

                        </select>

                      </div>

                      

                      <div>

                        <label htmlFor="advocate-year" className="block text-sm font-medium text-gray-700 mb-2">

                          Year *

                        </label>

                        <input

                          id="advocate-year"

                          type="number"

                          value={advancedSearchForm.year}

                          onChange={(e) => handleAdvancedSearchChange('year', e.target.value)}

                          placeholder="Enter year (e.g., 2024)"

                          min="2000"

                          max="2030"

                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                          required

                        />

                      </div>

                    </div>

                  )}



                  {/* Filing Search */}

                  {advancedSearchForm.courtType === 'district' && advancedSearchForm.districtCourtFunction === 'filing' && (

                    <div className="mb-4">

                      <label htmlFor="filing-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Filing Number *

                      </label>

                      <input

                        id="filing-number"

                        type="text"

                        value={advancedSearchForm.filingNumber}

                        onChange={(e) => handleAdvancedSearchChange('filingNumber', e.target.value)}

                        placeholder="Enter filing number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                        required

                      />

                    </div>

                  )}



                  {/* High Court Search Parameters */}

                  {advancedSearchForm.courtType === 'high' && advancedSearchForm.highCourtFunction === 'cnr' && (

                    <div className="mb-4">

                      <label htmlFor="high-cnr-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Case Number Reference (CNR) *

                      </label>

                      <input

                        id="high-cnr-number"

                        type="text"

                        value={advancedSearchForm.cnrNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('cnrNumber', e.target.value)}

                        placeholder="Enter CNR number (e.g., DLHC010153302024)"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"

                        required

                      />

                      </div>

                  )}



                  {advancedSearchForm.courtType === 'high' && advancedSearchForm.highCourtFunction === 'party' && (

                    <div className="mb-4">

                      <label htmlFor="high-party-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Party Name *

                      </label>

                      <input

                        id="high-party-name"

                        type="text"

                        value={advancedSearchForm.partyName || ''}

                        onChange={(e) => handleAdvancedSearchChange('partyName', e.target.value)}

                        placeholder="Enter party name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'high' && advancedSearchForm.highCourtFunction === 'advocate' && (

                    <div className="mb-4">

                      <label htmlFor="high-advocate-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Advocate Name *

                      </label>

                      <input

                        id="high-advocate-name"

                        type="text"

                        value={advancedSearchForm.advocateName || ''}

                        onChange={(e) => handleAdvancedSearchChange('advocateName', e.target.value)}

                        placeholder="Enter advocate name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'high' && advancedSearchForm.highCourtFunction === 'filing' && (

                    <div className="mb-4">

                      <label htmlFor="high-filing-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Filing Number *

                      </label>

                      <input

                        id="high-filing-number"

                        type="text"

                        value={advancedSearchForm.filingNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('filingNumber', e.target.value)}

                        placeholder="Enter filing number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"

                        required

                      />

                    </div>

                  )}



                  {/* Supreme Court Search Parameters */}

                  {advancedSearchForm.courtType === 'supreme' && advancedSearchForm.supremeCourtFunction === 'diary' && (

                    <div className="mb-4">

                      <label htmlFor="supreme-diary-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Diary Number *

                      </label>

                      <input

                        id="supreme-diary-number"

                        type="text"

                        value={advancedSearchForm.diaryNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('diaryNumber', e.target.value)}

                        placeholder="Enter diary number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'supreme' && advancedSearchForm.supremeCourtFunction === 'party' && (

                    <div className="mb-4">

                      <label htmlFor="supreme-party-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Party Name *

                      </label>

                      <input

                        id="supreme-party-name"

                        type="text"

                        value={advancedSearchForm.partyName || ''}

                        onChange={(e) => handleAdvancedSearchChange('partyName', e.target.value)}

                        placeholder="Enter party name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'supreme' && advancedSearchForm.supremeCourtFunction === 'orders' && (

                    <div className="mb-4">

                      <label htmlFor="supreme-order-date" className="block text-sm font-medium text-gray-700 mb-2">

                        Order Date *

                      </label>

                      <input

                        id="supreme-order-date"

                        type="date"

                        value={advancedSearchForm.orderDate || ''}

                        onChange={(e) => handleAdvancedSearchChange('orderDate', e.target.value)}

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'supreme' && advancedSearchForm.supremeCourtFunction === 'aor' && (

                    <div className="mb-4">

                      <label htmlFor="supreme-aor-number" className="block text-sm font-medium text-gray-700 mb-2">

                        AOR Number *

                      </label>

                      <input

                        id="supreme-aor-number"

                        type="text"

                        value={advancedSearchForm.aorNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('aorNumber', e.target.value)}

                        placeholder="Enter AOR number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"

                        required

                      />

                    </div>

                  )}



                  {/* NCLT Search Parameters */}

                  {advancedSearchForm.courtType === 'nclt' && advancedSearchForm.ncltFunction === 'caseNumber' && (

                    <div className="mb-4">

                      <label htmlFor="nclt-case-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Case Number *

                      </label>

                      <input

                        id="nclt-case-number"

                        type="text"

                        value={advancedSearchForm.caseNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('caseNumber', e.target.value)}

                        placeholder="Enter case number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'nclt' && advancedSearchForm.ncltFunction === 'filingNumber' && (

                    <div className="mb-4">

                      <label htmlFor="nclt-filing-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Filing Number *

                      </label>

                      <input

                        id="nclt-filing-number"

                        type="text"

                        value={advancedSearchForm.filingNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('filingNumber', e.target.value)}

                        placeholder="Enter filing number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'nclt' && advancedSearchForm.ncltFunction === 'party' && (

                    <div className="mb-4">

                      <label htmlFor="nclt-party-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Party Name *

                      </label>

                      <input

                        id="nclt-party-name"

                        type="text"

                        value={advancedSearchForm.partyName || ''}

                        onChange={(e) => handleAdvancedSearchChange('partyName', e.target.value)}

                        placeholder="Enter party name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"

                        required

                      />

                    </div>

                  )}



                  {/* CAT Search Parameters */}

                  {advancedSearchForm.courtType === 'cat' && advancedSearchForm.catFunction === 'caseNumber' && (

                    <div className="mb-4">

                      <label htmlFor="cat-case-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Case Number *

                      </label>

                      <input

                        id="cat-case-number"

                        type="text"

                        value={advancedSearchForm.caseNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('caseNumber', e.target.value)}

                        placeholder="Enter case number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'cat' && advancedSearchForm.catFunction === 'diaryNumber' && (

                    <div className="mb-4">

                      <label htmlFor="cat-diary-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Diary Number *

                      </label>

                      <input

                        id="cat-diary-number"

                        type="text"

                        value={advancedSearchForm.diaryNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('diaryNumber', e.target.value)}

                        placeholder="Enter diary number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'cat' && advancedSearchForm.catFunction === 'party' && (

                    <div className="mb-4">

                      <label htmlFor="cat-party-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Party Name *

                      </label>

                      <input

                        id="cat-party-name"

                        type="text"

                        value={advancedSearchForm.partyName || ''}

                        onChange={(e) => handleAdvancedSearchChange('partyName', e.target.value)}

                        placeholder="Enter party name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

                        required

                      />

                    </div>

                  )}



                  {advancedSearchForm.courtType === 'cat' && advancedSearchForm.catFunction === 'advocate' && (

                    <div className="mb-4">

                      <label htmlFor="cat-advocate-name" className="block text-sm font-medium text-gray-700 mb-2">

                        Advocate Name *

                      </label>

                      <input

                        id="cat-advocate-name"

                        type="text"

                        value={advancedSearchForm.advocateName || ''}

                        onChange={(e) => handleAdvancedSearchChange('advocateName', e.target.value)}

                        placeholder="Enter advocate name"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

                        required

                      />

                    </div>

                  )}



                  {/* Consumer Forum Search Parameters */}

                  {advancedSearchForm.courtType === 'consumer' && advancedSearchForm.consumerFunction === 'caseDetails' && (

                    <div className="mb-4">

                      <label htmlFor="consumer-case-number" className="block text-sm font-medium text-gray-700 mb-2">

                        Case Number *

                      </label>

                      <input

                        id="consumer-case-number"

                        type="text"

                        value={advancedSearchForm.consumerCaseNumber || ''}

                        onChange={(e) => handleAdvancedSearchChange('consumerCaseNumber', e.target.value)}

                        placeholder="Enter case number"

                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"

                        required

                      />

                    </div>

                  )}

                </div>



                {/* Search Messages */}

                {searchError && (

                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">

                    <div className="flex">

                      <div className="flex-shrink-0">

                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">

                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h3 className="text-sm font-medium text-red-800">Search Error</h3>

                        <div className="mt-2 text-sm text-red-700">{searchError}</div>

                      </div>

                    </div>

                  </div>

                )}



                {searchSuccess && (

                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">

                    <div className="flex">

                      <div className="flex-shrink-0">

                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">

                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                        </svg>

                      </div>

                      <div className="ml-3">

                        <h3 className="text-sm font-medium text-green-800">Search Successful</h3>

                        <div className="mt-2 text-sm text-green-700 whitespace-pre-line">{searchSuccess}</div>

                      </div>

                    </div>

                  </div>

                )}



                {/* Submit Button */}

                <div className="flex justify-end space-x-3">

                  <button

                    type="button"

                    onClick={() => setIsAdvancedSearchOpen(false)}

                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"

                  >

                    Cancel

                  </button>

                         <button

                           type="submit"

                           disabled={isLoadingCNR || !isFormValid() || isLoadingCourtData}

                           className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"

                         >

                    {isLoadingCNR ? (

                      <>

                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                        </svg>

                        Searching...

                      </>

                    ) : isLoadingCourtData ? (

                      <>

                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                        </svg>

                        Loading Data...

                      </>

                    ) : (

                      <>

                        <MagnifyingGlassIcon className="h-4 w-4 mr-2" />

                        Search Cases

                      </>

                    )}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}



      {/* Edit Case Modal */}

      {showEditModal && editingCase && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

            <div className="mt-3">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-medium text-gray-900">Edit Case</h3>

                <button

                  onClick={() => {

                    setShowEditModal(false)

                    setEditingCase(null)

                    setNewCase({

                      caseNumber: '',

                      filingNumber: '',

                      title: '',

                      petitionerName: '',

                      respondentName: '',

                      court: '',

                      priority: 'MEDIUM',

                      stage: ''

                    })

                  }}

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

                    Registration Number *

                  </label>

                  <input

                    type="text"

                    value={newCase.caseNumber}

                    onChange={(e) => setNewCase({...newCase, caseNumber: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., REG-2024-004"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Filing Number

                  </label>

                  <input

                    type="text"

                    value={newCase.filingNumber}

                    onChange={(e) => setNewCase({...newCase, filingNumber: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., FIL-2024-004 (optional)"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Case Title *

                  </label>

                  <input

                    type="text"

                    value={newCase.title}

                    onChange={(e) => setNewCase({...newCase, title: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., Contract Dispute Resolution"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Petitioner Name *

                  </label>

                  <input

                    type="text"

                    value={newCase.petitionerName}

                    onChange={(e) => setNewCase({...newCase, petitionerName: e.target.value})}

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

                    value={newCase.court}

                    onChange={(e) => setNewCase({...newCase, court: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., High Court of Delhi"

                  />

                </div>

                

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">

                    Priority

                  </label>

                  <select

                    value={newCase.priority}

                    onChange={(e) => setNewCase({...newCase, priority: e.target.value as any})}

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

                    value={newCase.stage}

                    onChange={(e) => setNewCase({...newCase, stage: e.target.value})}

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    placeholder="e.g., Preliminary, Arguments, Evidence"

                  />

                </div>

              </div>

              

              <div className="flex justify-end space-x-3 mt-6">

                <button

                  onClick={() => {

                    setShowEditModal(false)

                    setEditingCase(null)

                    setNewCase({

                      caseNumber: '',

                      filingNumber: '',

                      title: '',

                      petitionerName: '',

                      respondentName: '',

                      court: '',

                      priority: 'MEDIUM',

                      stage: ''

                    })

                  }}

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



      {/* Advanced Search Modal */}

      {showAdvancedSearch && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">

            <div className="mt-3">

              <div className="flex items-center justify-between mb-4">

                <h3 className="text-lg font-medium text-gray-900">Advanced Case Search</h3>

                <button

                  onClick={() => setShowAdvancedSearch(false)}

                  className="text-gray-400 hover:text-gray-600"

                >

                  <span className="sr-only">Close</span>

                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                  </svg>

                </button>

              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                {/* Basic Information */}

                <div className="space-y-4">

                  <h4 className="font-medium text-gray-900">Basic Information</h4>

                  

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Case Number

                    </label>

                    <input

                      type="text"

                      value={searchFilters.caseNumber}

                      onChange={(e) => setSearchFilters({...searchFilters, caseNumber: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      placeholder="e.g., CASE-2024-001"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Party Name

                    </label>

                    <input

                      type="text"

                      value={searchFilters.partyName}

                      onChange={(e) => setSearchFilters({...searchFilters, partyName: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      placeholder="e.g., ABC Corporation"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Advocate Name

                    </label>

                    <input

                      type="text"

                      value={searchFilters.advocateName}

                      onChange={(e) => setSearchFilters({...searchFilters, advocateName: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      placeholder="e.g., Adv. John Doe"

                    />

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Court Name

                    </label>

                    <input

                      type="text"

                      value={searchFilters.court}

                      onChange={(e) => setSearchFilters({...searchFilters, court: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      placeholder="e.g., High Court of Delhi"

                    />

                  </div>

                </div>



                {/* Court Type and Status */}

                <div className="space-y-4">

                  <h4 className="font-medium text-gray-900">Court & Status</h4>

                  

                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Court Type

                    </label>

                    <select

                      value={searchFilters.courtType}

                      onChange={(e) => setSearchFilters({...searchFilters, courtType: e.target.value as any})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    >

                      <option value="district">District Court</option>

                      <option value="high">High Court</option>

                      <option value="supreme">Supreme Court</option>

                      <option value="nclt">NCLT</option>

                      <option value="cat">CAT</option>

                      <option value="consumer">Consumer Forum</option>

                    </select>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Case Type

                    </label>

                    <select

                      value={searchFilters.caseType}

                      onChange={(e) => setSearchFilters({...searchFilters, caseType: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    >

                      <option value="">All Types</option>

                      <option value="CIVIL">Civil</option>

                      <option value="CRIMINAL">Criminal</option>

                      <option value="WRIT_PETITION">Writ Petition</option>

                      <option value="FAMILY">Family</option>

                      <option value="CONSUMER">Consumer</option>

                      <option value="INSOLVENCY">Insolvency</option>

                    </select>

                  </div>



                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">

                      Case Status

                    </label>

                    <select

                      value={searchFilters.caseStatus}

                      onChange={(e) => setSearchFilters({...searchFilters, caseStatus: e.target.value})}

                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                    >

                      <option value="">All Status</option>

                      <option value="PENDING">Pending</option>

                      <option value="DISPOSED">Disposed</option>

                      <option value="ADJOURNED">Adjourned</option>

                      <option value="HEARD">Heard</option>

                    </select>

                  </div>

                </div>

              </div>



              {/* Date Range Filters */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                <div className="space-y-4">

                  <h4 className="font-medium text-gray-900">Filing Date Range</h4>

                  <div className="grid grid-cols-2 gap-2">

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">

                        From Date

                      </label>

                      <input

                        type="date"

                        value={searchFilters.filingDateFrom}

                        onChange={(e) => setSearchFilters({...searchFilters, filingDateFrom: e.target.value})}

                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">

                        To Date

                      </label>

                      <input

                        type="date"

                        value={searchFilters.filingDateTo}

                        onChange={(e) => setSearchFilters({...searchFilters, filingDateTo: e.target.value})}

                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                  </div>

                </div>



                <div className="space-y-4">

                  <h4 className="font-medium text-gray-900">Hearing Date Range</h4>

                  <div className="grid grid-cols-2 gap-2">

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">

                        From Date

                      </label>

                      <input

                        type="date"

                        value={searchFilters.hearingDateFrom}

                        onChange={(e) => setSearchFilters({...searchFilters, hearingDateFrom: e.target.value})}

                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">

                        To Date

                      </label>

                      <input

                        type="date"

                        value={searchFilters.hearingDateTo}

                        onChange={(e) => setSearchFilters({...searchFilters, hearingDateTo: e.target.value})}

                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                      />

                    </div>

                  </div>

                </div>

              </div>



              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">

                <div className="flex">

                  <div className="flex-shrink-0">

                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">

                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />

                    </svg>

                  </div>

                  <div className="ml-3">

                    <p className="text-sm text-blue-800">

                      <strong>Advanced Search:</strong> Search across all Indian courts using multiple criteria. Results will be fetched from the Kleopatra API and added to your cases list.

                    </p>

                  </div>

                </div>

              </div>



              <div className="flex justify-end space-x-3">

                <button

                  onClick={() => setShowAdvancedSearch(false)}

                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"

                >

                  Cancel

                </button>

                <button

                  onClick={handleAdvancedSearch}

                  disabled={isLoadingSearch}

                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"

                >

                  {isLoadingSearch ? 'Searching...' : 'Search Cases'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Case Details Modal */}

      {showCaseDetails && selectedCase && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">

            <div className="mt-3">

              <div className="flex items-center justify-between mb-6">

                <h3 className="text-2xl font-bold text-gray-900">Case Details</h3>

                <button

                  onClick={() => setShowCaseDetails(false)}

                  className="text-gray-400 hover:text-gray-600"

                >

                  <span className="sr-only">Close</span>

                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                  </svg>

                </button>

              </div>



              {/* Case Header */}

              <div className="bg-gray-50 rounded-lg p-6 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Case Information</h4>

                    <div className="space-y-2 text-sm">

                      <p><span className="font-medium">CNR:</span> {selectedCase.cnrNumber || 'Not specified'}</p>

                      <p><span className="font-medium">Case No:</span> {formatCaseNumber(selectedCase)}</p>

                      {selectedCase.filingNumber && (

                        <p><span className="font-medium">Filing No:</span> {selectedCase.filingNumber}</p>

                      )}

                      <p><span className="font-medium">Title:</span> {formatCaseTitle(selectedCase.title) || 'Not specified'}</p>

                      <p><span className="font-medium">Court:</span> {selectedCase.court || 'Not specified'}</p>

                      <p><span className="font-medium">Court Location:</span> {selectedCase.courtLocation || 'Not specified'}</p>

                      {selectedCase.hallNumber && <p><span className="font-medium">Hall Number:</span> {selectedCase.hallNumber}</p>}

                      {selectedCase.registrationDate && (

                        <p><span className="font-medium">Registration Date:</span> {new Date(selectedCase.registrationDate).toLocaleDateString()}</p>

                      )}

                      {selectedCase.firstHearingDate && (

                        <p><span className="font-medium">First Hearing Date:</span> {new Date(selectedCase.firstHearingDate).toLocaleDateString()}</p>

                      )}

                      {selectedCase.decisionDate && selectedCase.decisionDate !== '1970-01-01T00:00:00.000Z' && (

                        <p><span className="font-medium">Decision Date:</span> {new Date(selectedCase.decisionDate).toLocaleDateString()}</p>

                      )}

                      {selectedCase.natureOfDisposal && (

                        <p><span className="font-medium">Nature of Disposal:</span> {selectedCase.natureOfDisposal}</p>

                      )}

                    </div>

                  </div>

                  <div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Case Status</h4>

                    <div className="space-y-2 text-sm">

                      <p><span className="font-medium">Type:</span> {selectedCase.caseType || 'Not specified'}</p>

                      <p><span className="font-medium">Status:</span> 

                        <span className={`ml-2 px-3 py-1 text-xs rounded-full ${

                          selectedCase.caseStatus && selectedCase.caseStatus.includes('SUMMONS') ? 'bg-yellow-100 text-yellow-800' :

                          selectedCase.caseStatus && selectedCase.caseStatus.includes('HEARING') ? 'bg-blue-100 text-blue-800' :

                          selectedCase.caseStatus && selectedCase.caseStatus.includes('ORDERS') ? 'bg-green-100 text-green-800' :

                          'bg-gray-100 text-gray-800'

                        }`}>

                          {selectedCase.caseStatus ? selectedCase.caseStatus.replace(/<br>|<b>|<\/b>/g, ' ').trim() : 'Unknown'}

                        </span>

                      </p>

                      <p><span className="font-medium">Priority:</span> 

                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedCase.priority)}`}>

                          {selectedCase.priority}

                        </span>

                      </p>

                      <p><span className="font-medium">Filing Date:</span> {selectedCase.filingDate ? new Date(selectedCase.filingDate).toLocaleDateString() : 'Not specified'}</p>

                      <p><span className="font-medium">Next Hearing:</span> {selectedCase.nextHearingDate ? new Date(selectedCase.nextHearingDate).toLocaleDateString() : 'Not scheduled'}</p>

                    </div>

                  </div>

                </div>

              </div>



              {/* Tabs */}

              <div className="border-b border-gray-200 mb-6">

                <nav className="-mb-px flex space-x-8">

                  <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">

                    Parties

                  </button>

                  <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">

                    Advocates

                  </button>

                  <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">

                    Hearing History

                  </button>

                  <button className="py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">

                    Orders

                  </button>

                </nav>

              </div>



              {/* Parties Section */}

              <div className="mb-8">

                <h4 className="text-lg font-semibold text-gray-900 mb-4">Parties</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>

                    <h5 className="font-medium text-gray-700 mb-3">Petitioners/Plaintiffs</h5>

                    <div className="space-y-2">

                      {selectedCase.parties && selectedCase.parties.filter(p => p.type === 'PLAINTIFF' || p.type === 'PETITIONER').map((party, index) => (

                        <div key={index} className="p-3 bg-green-50 rounded-lg">

                          <p className="text-sm font-medium text-green-800">{party.name}</p>

                          <p className="text-xs text-green-600">{party.type}</p>

                        </div>

                      ))}

                      {(!selectedCase.parties || selectedCase.parties.filter(p => p.type === 'PLAINTIFF' || p.type === 'PETITIONER').length === 0) && (

                        <p className="text-sm text-gray-500 italic">No petitioners found</p>

                      )}

                    </div>

                  </div>

                  <div>

                    <h5 className="font-medium text-gray-700 mb-3">Respondents/Defendants</h5>

                    <div className="space-y-2">

                      {selectedCase.parties && selectedCase.parties.filter(p => p.type === 'DEFENDANT' || p.type === 'RESPONDENT').map((party, index) => (

                        <div key={index} className="p-3 bg-red-50 rounded-lg">

                          <p className="text-sm font-medium text-red-800">{party.name}</p>

                          <p className="text-xs text-red-600">{party.type}</p>

                        </div>

                      ))}

                      {(!selectedCase.parties || selectedCase.parties.filter(p => p.type === 'DEFENDANT' || p.type === 'RESPONDENT').length === 0) && (

                        <p className="text-sm text-gray-500 italic">No respondents found</p>

                      )}

                    </div>

                  </div>

                </div>

              </div>



              {/* Advocates Section */}

              {selectedCase.advocates && selectedCase.advocates.length > 0 && (

                <div className="mb-8">

                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Advocates</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {selectedCase.advocates.map((advocate, index) => (

                      <div key={index} className="p-4 bg-blue-50 rounded-lg">

                        <p className="text-sm font-medium text-blue-800">{advocate.name}</p>

                        <p className="text-xs text-blue-600">Type: {advocate.type || 'Not specified'}</p>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {/* Hearing History Section */}

              {selectedCase.hearingHistory && selectedCase.hearingHistory.length > 0 && (

                <div className="mb-8">

                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Hearing History</h4>

                  <div className="space-y-3">

                    {selectedCase.hearingHistory.slice(0, 5).map((hearing, index) => (

                      <div key={index} className="p-4 bg-gray-50 rounded-lg">

                        <div className="flex justify-between items-start">

                          <div>

                            <p className="text-sm font-medium text-gray-900">{hearing.purpose}</p>

                            <p className="text-xs text-gray-600">Judge: {hearing.judge}</p>

                          </div>

                          <p className="text-xs text-gray-500">{hearing.date ? new Date(hearing.date).toLocaleDateString() : 'Date not available'}</p>

                        </div>

                      </div>

                    ))}

                    {selectedCase.hearingHistory.length > 5 && (

                      <p className="text-sm text-gray-500">... and {selectedCase.hearingHistory.length - 5} more hearings</p>

                    )}

                  </div>

                </div>

              )}



              {/* Acts and Sections Section */}

              {selectedCase.actsAndSections && (

                <div className="mb-8">

                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Acts and Sections</h4>

                  <div className="bg-blue-50 rounded-lg p-4">

                    <div className="space-y-2">

                      {selectedCase.actsAndSections.acts && (

                        <div>

                          <p className="text-sm font-medium text-blue-800">Acts:</p>

                          <p className="text-sm text-blue-700">{selectedCase.actsAndSections.acts}</p>

                        </div>

                      )}

                      {selectedCase.actsAndSections.sections && selectedCase.actsAndSections.sections !== ',' && (

                        <div>

                          <p className="text-sm font-medium text-blue-800">Sections:</p>

                          <p className="text-sm text-blue-700">{selectedCase.actsAndSections.sections}</p>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              )}



              {/* Orders Section */}

              {selectedCase.orders && selectedCase.orders.length > 0 && (

                <div className="mb-8">

                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Court Orders</h4>

                  <div className="space-y-3">

                    {selectedCase.orders.map((order, index) => (

                      <div key={index} className="p-4 bg-green-50 rounded-lg">

                        <div className="flex justify-between items-start">

                          <div>

                            <p className="text-sm font-medium text-green-800">Order #{order.number}</p>

                            <p className="text-xs text-green-600">{order.name}</p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs text-green-500">{order.date ? new Date(order.date).toLocaleDateString() : 'Date not available'}</p>

                            {order.url && (

                              <a href={order.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800">

                                View PDF

                              </a>

                            )}

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                </div>

              )}



              {/* Action Buttons */}

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">

                <button

                  onClick={() => setShowCaseDetails(false)}

                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"

                >

                  Close

                </button>

                <button

                  onClick={() => {

                    setShowCaseDetails(false)

                    handleEditCase(selectedCase)

                  }}

                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"

                >

                  Edit Case

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Migration Modal */}

      {showMigrationModal && (

        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

            <div className="mt-3 text-center">

              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">

                <CloudIcon className="h-6 w-6 text-blue-600" />

              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">Migrate to Cloud Storage</h3>

              <div className="mt-2 px-7 py-3">

                <p className="text-sm text-gray-500 mb-4">

                  We found {migrationService.getMigrationSummary().localCasesCount} cases in your local storage. 

                  Would you like to migrate them to cloud storage so all users can access them?

                </p>

                

                {isMigrating && (

                  <div className="mb-4">

                    <div className="bg-gray-200 rounded-full h-2 mb-2">

                      <div 

                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"

                        style={{ width: `${migrationStatus.progress}%` }}

                      ></div>

                    </div>

                    <p className="text-sm text-gray-600">

                      {migrationStatus.progress}% complete ({migrationStatus.migratedCases}/{migrationStatus.totalCases} cases)

                    </p>

                    {migrationStatus.errors.length > 0 && (

                      <div className="mt-2 text-xs text-red-600">

                        {migrationStatus.errors[migrationStatus.errors.length - 1]}

                      </div>

                    )}

                  </div>

                )}

              </div>

              

              <div className="items-center px-4 py-3">

                <div className="flex space-x-3">

                  <button

                    onClick={handleStartMigration}

                    disabled={isMigrating}

                    className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"

                  >

                    {isMigrating ? 'Migrating...' : 'Migrate Now'}

                  </button>

                  <button

                    onClick={handleSkipMigration}

                    disabled={isMigrating}

                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 disabled:opacity-50"

                  >

                    Skip

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  )

}
