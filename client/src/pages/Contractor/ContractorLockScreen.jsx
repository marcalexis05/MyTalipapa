import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  LogOut, 
  ShieldAlert, 
  Store, 
  Search, 
  Check, 
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react'
import { getUser } from '../../utils/auth'

export default function ContractorLockScreen({ children }) {
  const navigate = useNavigate()
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [status, setStatus] = useState('pending') // 'pending' | 'rejected' | 'approved'
  const [application, setApplication] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Re-submission state
  const [showResubmitModal, setShowResubmitModal] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [stalls, setStalls] = useState([])
  const [selectedStalls, setSelectedStalls] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedZone, setSelectedZone] = useState('All')
  const [loadingStalls, setLoadingStalls] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const user = getUser()
  const userEmail = user?.email || ''

  // Fetch the latest application status for this email
  const fetchStatus = async (isManual = false) => {
    if (!userEmail) return
    if (isManual) setRefreshing(true)
    setError(null)
    try {
      const response = await fetch(`/api/contractor/contractor-applications?email=${userEmail}`)
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      
      if (data && data.length > 0) {
        const app = data[0] // Latest application
        setApplication(app)
        setStatus(app.status)
        
        // Update user status in localStorage if different
        const storedUser = getUser()
        if (storedUser && storedUser.status !== app.status) {
          storedUser.status = app.status
          localStorage.setItem('user', JSON.stringify(storedUser))
        }
      } else {
        // Fallback: If no application found but user role is contractor, treat as pending
        setStatus('pending')
      }
    } catch (err) {
      console.error(err)
      setError('Could not verify status. Please refresh.')
    } finally {
      setLoadingStatus(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [userEmail])

  // Fetch available stalls for the re-submission modal
  const fetchAvailableStalls = async () => {
    setLoadingStalls(true)
    setSubmitError(null)
    try {
      const response = await fetch('/api/contractor/stalls?unmanaged=true')
      if (!response.ok) throw new Error('Failed to fetch stalls')
      const data = await response.json()
      setStalls(data)
    } catch (err) {
      console.error(err)
      setSubmitError('Failed to load available stalls.')
    } finally {
      setLoadingStalls(false)
    }
  }

  // Handle opening resubmit modal
  const handleOpenResubmit = () => {
    if (application) {
      setBusinessName(application.businessName || '')
      setSelectedStalls(application.selectedStalls || [])
    }
    fetchAvailableStalls()
    setShowResubmitModal(true)
  }

  // Handle re-submission submit
  const handleResubmit = async (e) => {
    e.preventDefault()
    if (!businessName.trim()) {
      setSubmitError('Please enter your business name.')
      return
    }
    if (selectedStalls.length === 0) {
      setSubmitError('Please select at least one stall.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/contractor/register-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user?.full_name || user?.name || application?.fullName,
          businessName,
          email: userEmail,
          password: 'UPDATED_PASSWORD_RETAINED', // Safe password bypass since email is already registered and status is rejected
          contactNumber: application?.contactNumber || user?.contact_number || '09000000000',
          selectedStalls,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Resubmission failed')
      }

      // Reset states
      setShowResubmitModal(false)
      fetchStatus()
    } catch (err) {
      console.error(err)
      setSubmitError(err.message || 'Error occurred during submission. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Calculations for re-submit modal
  const totalMonthlyRate = useMemo(() => {
    return selectedStalls.reduce((sum, stallNum) => {
      const stall = stalls.find(s => s.location === stallNum)
      return sum + (stall?.monthlyRate || 0)
    }, 0)
  }, [selectedStalls, stalls])

  const zones = useMemo(() => {
    const sections = stalls.map(s => s.section).filter(Boolean)
    return ['All', ...new Set(sections)]
  }, [stalls])

  const filteredStalls = useMemo(() => {
    return stalls.filter(stall => {
      // Include stall if it's available OR if it was already selected in their previous application
      const isSelectable = stall.status === 'available' || selectedStalls.includes(stall.location)
      if (!isSelectable) return false

      const matchesSearch = 
        stall.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stall.section.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesZone = 
        selectedZone === 'All' || 
        stall.section.toLowerCase() === selectedZone.toLowerCase()
        
      return matchesSearch && matchesZone
    })
  }, [stalls, searchQuery, selectedZone, selectedStalls])

  // If approved, bypass lock screen and render children directly
  if (status === 'approved' && !loadingStatus) {
    return children
  }

  // Loading spinner
  if (loadingStatus) {
    return (
      <div className="lockscreen-root flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-green-700 w-10 h-10" />
          <span className="text-sm font-semibold text-gray-500">Checking your application status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="lockscreen-root min-h-screen flex items-center justify-center p-4">
      {/* Decorative gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-green-200/40 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-200/30 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl p-8 relative overflow-hidden text-center">
        
        {/* Header Branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-3xl">🏪</span>
          <span className="text-xl font-black text-green-800 tracking-tight">MyTalipapa Contractor Portal</span>
        </div>

        {/* Status Indicator Screen */}
        {status === 'pending' ? (
          <div>
            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-sm animate-pulse">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mb-2">Application Under Review</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto">
              Welcome, <strong className="text-gray-700">{user?.full_name || 'Contractor'}</strong>. Your application is currently pending admin verification. You will gain full dashboard access once approved.
            </p>

            {/* Live Progress Timeline */}
            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 text-left mb-6 space-y-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Application Timeline</span>
              
              <div className="relative pl-6 border-l-2 border-green-200 space-y-5">
                {/* Step 1: Submitted */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 bg-green-600 text-white rounded-full p-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white fill-green-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Application Submitted</h4>
                    <p className="text-[10px] text-gray-400">Your profile and selected stalls are saved.</p>
                  </div>
                </div>

                {/* Step 2: Verification */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 bg-amber-500 text-white rounded-full p-0.5 animate-pulse">
                    <Clock className="w-4 h-4 text-white fill-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-600">Verification in Progress</h4>
                    <p className="text-[10px] text-gray-400">Our administrators are reviewing your request details.</p>
                  </div>
                </div>

                {/* Step 3: Activation */}
                <div className="relative opacity-40">
                  <div className="absolute -left-[31px] top-0.5 bg-gray-300 text-white rounded-full p-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white fill-gray-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500">Supervisor Portal Activated</h4>
                    <p className="text-[10px] text-gray-400">Manage rates, occupancies, and vendor records.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">Application Rejected</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto">
              Your application was not approved by the administrator. Please read the reason below and submit a revised registration.
            </p>

            {/* Rejection Notice Banner */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-left mb-6">
              <div className="flex gap-2">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block mb-1">Feedback from Admin</span>
                  <p className="text-xs text-red-800 font-semibold leading-relaxed">
                    {application?.rejectionReason || 'No specific comments provided. Please review your stall selections and resubmit.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Stalls Overview */}
        {application && application.selectedStalls && (
          <div className="bg-white/50 border border-gray-100 p-4 rounded-2xl text-left mb-6">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Applied Stalls</span>
            <div className="flex flex-wrap gap-1 mb-2">
              {application.selectedStalls.map(num => (
                <span key={num} className="text-[10px] font-extrabold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md">
                  #{num}
                </span>
              ))}
            </div>
            <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5 flex justify-between">
              <span>Selected Stalls: {application.selectedStalls.length}</span>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 order-2 sm:order-1"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
          
          {status === 'rejected' ? (
            <button
              onClick={handleOpenResubmit}
              className="flex-[2] py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm order-1 sm:order-2"
            >
              <FileText className="w-4 h-4" />
              Modify & Re-submit Application
            </button>
          ) : (
            <button
              disabled={refreshing}
              onClick={() => fetchStatus(true)}
              className="flex-[2] py-3 px-4 rounded-xl bg-green-700 hover:bg-green-800 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 order-1 sm:order-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Check Status'}
            </button>
          )}
        </div>
      </div>

      {/* Re-submission Modal */}
      {showResubmitModal && (
        <div className="resubmit-modal-overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-gray-800 mb-1">Modify Contractor Application</h3>
            <p className="text-xs text-gray-500 mb-4">Adjust your business name or update your selected stalls list below.</p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">{submitError}</div>
            )}

            <form onSubmit={handleResubmit} className="space-y-4 overflow-y-auto pr-1 pb-4 flex-1 scrollbar-thin">
              
              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business Name</label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                  <Store size={15} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder=""
                    required
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Stall Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Stalls</label>
                
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 mb-2">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search stall or section..."
                    className="flex-1 bg-transparent text-xs focus:outline-none"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none">
                  {zones.map(zone => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setSelectedZone(zone)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap border ${
                        selectedZone === zone
                          ? 'bg-green-700 border-green-700 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>

                {/* Stall Grid Selector */}
                {loadingStalls ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-1">
                    <Loader2 className="animate-spin text-green-700 w-6 h-6" />
                    <span className="text-[10px] text-gray-400">Loading stalls...</span>
                  </div>
                ) : filteredStalls.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    No available stalls found.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                    {filteredStalls.map(stall => {
                      const isSelected = selectedStalls.includes(stall.location)
                      return (
                        <button
                          key={stall._id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStalls(selectedStalls.filter(s => s !== stall.location))
                            } else {
                              setSelectedStalls([...selectedStalls, stall.location])
                            }
                          }}
                          className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative ${
                            isSelected
                              ? 'border-green-700 bg-green-50/50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="font-extrabold text-[11px] text-gray-800">#{stall.location}</span>
                            <span className="text-[8px] bg-gray-100 border border-gray-200 px-1 py-0.2 rounded text-gray-500 font-bold uppercase">
                              {stall.section}
                            </span>
                          </div>
                          <div className="flex justify-between items-end mt-1 text-[9px] w-full">
                            <span className="text-gray-400">{stall.size} sqm</span>
                            <span className="font-bold text-green-700">₱{stall.monthlyRate}/mo</span>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-green-700 text-white rounded-full p-0.5">
                              <Check size={8} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </form>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  {selectedStalls.length} selected
                </span>
                <span className="text-sm font-extrabold text-gray-800">₱{totalMonthlyRate.toLocaleString()}/mo</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResubmitModal(false)}
                  className="px-3 py-2 border border-gray-200 text-gray-600 font-bold text-[11px] rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || selectedStalls.length === 0}
                  onClick={handleResubmit}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-extrabold text-[11px] rounded-lg disabled:opacity-60 flex items-center gap-1 shadow-sm"
                >
                  {submitting ? 'Submitting...' : <>Submit <ArrowRight size={11} /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lockscreen Styling */}
      <style>{`
        .lockscreen-root {
          background-color: #f5f2ec;
          position: relative;
          z-index: 10;
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
