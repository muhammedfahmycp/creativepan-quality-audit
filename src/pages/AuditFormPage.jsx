import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Trash2, Send, ChevronDown, ChevronUp, AlertTriangle, Download, CheckCircle, X } from 'lucide-react'
import api from '../utils/api'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'
import Spinner from '../components/ui/Spinner'
import ConfirmModal from '../components/ui/ConfirmModal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// ── Helpers ───────────────────────────────────────────────────────────────────

function lsKey(auditId) { return `qa_responses_${auditId}` }

function getAnswer(response) {
  if (!response) return null
  if (!response.is_applicable) return 'na'
  if (response.awarded_score === null || response.awarded_score === undefined) return null
  return parseFloat(response.awarded_score) > 0 ? 'yes' : 'no'
}

// ── Point Row ────────────────────────────────────────────────────────────────

function PointRow({ point, response, photos, onResponseChange, onPhotoAdd, onPhotoRemove, auditId, canEdit }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef()
  const toast = useToast()

  const answer = getAnswer(response)
  const isNA = answer === 'na'
  const comments = response?.comments ?? ''

  const handleAnswer = (val) => {
    if (val === 'yes')  onResponseChange(point.id, { is_applicable: true,  awarded_score: parseFloat(point.max_score) })
    if (val === 'no')   onResponseChange(point.id, { is_applicable: true,  awarded_score: 0 })
    if (val === 'na')   onResponseChange(point.id, { is_applicable: false, awarded_score: 0 })
  }

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !response?.id) return
    setUploading(true)
    try {
      const data = await api.uploadPhoto(auditId, response.id, file)
      onPhotoAdd(response.id, data.photo)
    } catch (err) {
      toast.error('Photo upload failed: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (photoId) => {
    try {
      await api.deletePhoto(photoId)
      onPhotoRemove(response.id, photoId)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className={`border rounded-xl p-4 transition-all ${isNA ? 'border-gray-800 opacity-40' : 'border-gray-700 bg-gray-900/50'}`}>
      {/* Description + max score */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={`text-sm flex-1 leading-relaxed ${isNA ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
          {point.description}
        </p>
        <span className="text-xs text-gray-500 shrink-0">{point.max_score} pts</span>
      </div>

      {/* Yes / No / N/A buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => canEdit && handleAnswer('yes')}
          disabled={!canEdit}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
            answer === 'yes'
              ? 'bg-green-600 border-green-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400'
          } disabled:cursor-default`}
        >
          Yes
        </button>
        <button
          onClick={() => canEdit && handleAnswer('no')}
          disabled={!canEdit}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
            answer === 'no'
              ? 'bg-red-700 border-red-600 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400'
          } disabled:cursor-default`}
        >
          No
        </button>
        <button
          onClick={() => canEdit && handleAnswer('na')}
          disabled={!canEdit}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
            answer === 'na'
              ? 'bg-gray-600 border-gray-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
          } disabled:cursor-default`}
        >
          N/A
        </button>
      </div>

      {/* Score display */}
      {answer && !isNA && (
        <p className={`mt-2 text-xs font-medium ${answer === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
          {answer === 'yes' ? `+${point.max_score} pts` : '0 pts'}
        </p>
      )}

      {/* Comments — only when yes or no */}
      {!isNA && (
        <textarea
          value={comments}
          onChange={e => onResponseChange(point.id, { comments: e.target.value })}
          disabled={!canEdit}
          placeholder="Comments (optional)"
          rows={2}
          className="mt-3 w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500 resize-none disabled:opacity-50"
        />
      )}

      {/* Photos — show when not N/A and response exists */}
      {!isNA && response && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 items-start">
            {photos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.signed_url}
                  alt="violation"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                />
                {canEdit && (
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}

            {canEdit && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || !response?.id}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-500 hover:border-amber-500 hover:text-amber-400 active:scale-95 transition-all disabled:opacity-40"
                >
                  {uploading ? <Spinner size={5} /> : <Camera size={22} />}
                  {!uploading && <span className="text-xs mt-1">Photo</span>}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section Panel ─────────────────────────────────────────────────────────────

function SectionPanel({ section, responses, photos, onResponseChange, onPhotoAdd, onPhotoRemove, auditId, canEdit }) {
  const [open, setOpen] = useState(true)
  const sectionPoints = section.qa_form_points || []

  const applicable = sectionPoints.filter(p => responses[p.id]?.is_applicable !== false)
  const totalMax = applicable.reduce((s, p) => s + parseFloat(p.max_score || 0), 0)
  const totalAwarded = applicable.reduce((s, p) => s + (parseFloat(responses[p.id]?.awarded_score) || 0), 0)
  const answered = sectionPoints.filter(p => getAnswer(responses[p.id]) !== null).length
  const pct = totalMax > 0 ? Math.round((totalAwarded / totalMax) * 100) : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h3 className="font-semibold text-white text-sm">{section.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {answered}/{sectionPoints.length} answered · {totalAwarded}/{totalMax} pts ({pct}%)
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          {sectionPoints.map(point => (
            <PointRow
              key={point.id}
              point={point}
              response={responses[point.id]}
              photos={photos[responses[point.id]?.id] || []}
              onResponseChange={onResponseChange}
              onPhotoAdd={onPhotoAdd}
              onPhotoRemove={onPhotoRemove}
              auditId={auditId}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const SAVE_DEBOUNCE_MS = 1200

export default function AuditFormPage() {
  const { auditId } = useParams()
  const navigate = useNavigate()
  const { user, isQualityManager } = useAuth()
  const toast = useToast()

  const [audit, setAudit] = useState(null)
  const [sections, setSections] = useState([])
  const [responses, setResponses] = useState({})
  const [photos, setPhotos] = useState({})
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('saved')
  const [showDelete, setShowDelete] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const dirtyRef = useRef({})
  const responsesRef = useRef({})
  const saveTimerRef = useRef(null)

  // Keep responsesRef in sync for use in beforeunload
  useEffect(() => { responsesRef.current = responses }, [responses])

  useEffect(() => {
    api.getAudit(auditId)
      .then(data => {
        const a = data.audit
        setAudit(a)
        setSections(a.sections || [])

        const rMap = {}
        const pMap = {}
        for (const s of a.sections || []) {
          for (const p of s.qa_form_points || []) {
            if (p.response) {
              rMap[p.id] = p.response
              pMap[p.response.id] = p.photos || []
            }
          }
        }

        // Merge localStorage over server data (handles back/reload mid-edit)
        try {
          const saved = localStorage.getItem(lsKey(auditId))
          if (saved) {
            const local = JSON.parse(saved)
            for (const [pointId, changes] of Object.entries(local)) {
              if (rMap[pointId]) rMap[pointId] = { ...rMap[pointId], ...changes }
            }
            // Mark merged local changes as dirty so they get flushed to server
            dirtyRef.current = local
            setSaveState('dirty')
          }
        } catch {}

        setResponses(rMap)
        setPhotos(pMap)
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [auditId])

  // Save dirty responses to localStorage on every change (synchronous — survives reload/back)
  const persistLocal = useCallback((dirty) => {
    try {
      if (Object.keys(dirty).length > 0) {
        localStorage.setItem(lsKey(auditId), JSON.stringify(dirty))
      }
    } catch {}
  }, [auditId])

  const flushSave = useCallback(async (dirty) => {
    if (Object.keys(dirty).length === 0) return
    setSaveState('saving')
    try {
      const payload = Object.entries(dirty).map(([pointId, changes]) => ({
        point_id: pointId,
        ...changes,
      }))
      await api.saveAudit(auditId, payload)
      dirtyRef.current = {}
      localStorage.removeItem(lsKey(auditId))
      setSaveState('saved')
    } catch (err) {
      setSaveState('dirty')
      toast.error('Autosave failed — changes kept locally')
    }
  }, [auditId])

  // beforeunload: persist to localStorage synchronously
  useEffect(() => {
    const handler = () => persistLocal(dirtyRef.current)
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [persistLocal])

  // Flush on unmount (React navigation via back button)
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
      persistLocal(dirtyRef.current)
      if (Object.keys(dirtyRef.current).length > 0) {
        api.saveAudit(auditId, Object.entries(dirtyRef.current).map(([pointId, changes]) => ({
          point_id: pointId, ...changes
        }))).then(() => localStorage.removeItem(lsKey(auditId))).catch(() => {})
      }
    }
  }, [auditId, persistLocal])

  const canEdit = audit && ['in_progress', 'edit_requested'].includes(audit.status) &&
    (audit.auditor_id === user?.id || isQualityManager)

  const handleResponseChange = useCallback((pointId, changes) => {
    setResponses(prev => ({ ...prev, [pointId]: { ...prev[pointId], ...changes } }))

    dirtyRef.current[pointId] = {
      ...(dirtyRef.current[pointId] || {}),
      ...changes,
    }

    setSaveState('dirty')
    persistLocal(dirtyRef.current)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => flushSave({ ...dirtyRef.current }), SAVE_DEBOUNCE_MS)
  }, [flushSave, persistLocal])

  const handlePhotoAdd = (responseId, photo) => {
    setPhotos(prev => ({ ...prev, [responseId]: [...(prev[responseId] || []), photo] }))
  }
  const handlePhotoRemove = (responseId, photoId) => {
    setPhotos(prev => ({ ...prev, [responseId]: (prev[responseId] || []).filter(p => p.id !== photoId) }))
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await api.deleteAudit(auditId)
      localStorage.removeItem(lsKey(auditId))
      toast.success('Audit deleted')
      navigate(-2)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
      setShowDelete(false)
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true)
    clearTimeout(saveTimerRef.current)
    await flushSave({ ...dirtyRef.current })
    try {
      const data = await api.submitAudit(auditId)
      setAudit(data.audit)
      localStorage.removeItem(lsKey(auditId))
      toast.success('Audit submitted for review')
      setShowSubmit(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const data = await api.approveAudit(auditId)
      setAudit(data.audit)
      toast.success('Audit approved and pushed to KPI system')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      const blob = await api.exportPdf(auditId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-${audit?.branches?.name}-${audit?.month}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>
  if (!audit) return <div className="text-center text-gray-500 pt-20">Audit not found</div>

  const pct = audit.score_percentage

  // Count answered points for progress
  const allPoints = sections.flatMap(s => s.qa_form_points || [])
  const answeredCount = allPoints.filter(p => getAnswer(responses[p.id]) !== null).length

  return (
    <div className="max-w-2xl mx-auto pb-36 md:pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white shrink-0">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">{audit.branches?.name}</h1>
              <p className="text-xs text-gray-500">{audit.month}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={audit.status} />
            {canEdit && (
              <span className={`text-xs ${
                saveState === 'saved' ? 'text-green-500' :
                saveState === 'saving' ? 'text-amber-400' : 'text-gray-500'
              }`}>
                {saveState === 'saving' ? 'Saving...' : saveState === 'dirty' ? '●' : '✓'}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {canEdit && allPoints.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{answeredCount}/{allPoints.length} answered</span>
            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(answeredCount / allPoints.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Score bar — after submit/approve */}
        {pct != null && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <span>Score: {audit.total_awarded_score}/{audit.total_max_score} pts</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-amber-400 font-medium">{pct}%</span>
          </div>
        )}
      </div>

      {/* Edit requested banner */}
      {audit.status === 'edit_requested' && (
        <div className="mx-4 mt-4 p-4 bg-orange-900/30 border border-orange-700 rounded-xl">
          <div className="flex items-center gap-2 text-orange-400 font-medium text-sm mb-1">
            <AlertTriangle size={16} />
            Edit Requested by Quality Manager
          </div>
          <p className="text-sm text-orange-200">{audit.manager_comments}</p>
        </div>
      )}

      {/* Sections */}
      <div className="p-4 flex flex-col gap-4">
        {sections.map(section => (
          <SectionPanel
            key={section.id}
            section={section}
            responses={responses}
            photos={photos}
            onResponseChange={handleResponseChange}
            onPhotoAdd={handlePhotoAdd}
            onPhotoRemove={handlePhotoRemove}
            auditId={auditId}
            canEdit={canEdit}
          />
        ))}
      </div>

      {/* Action bar — sits ABOVE bottom nav on mobile (bottom-16), normal on desktop */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3 flex gap-3">
        {canEdit && audit.auditor_id === user?.id && (
          <>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-800 text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors shrink-0"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              onClick={() => setShowSubmit(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 text-sm font-semibold transition-colors"
            >
              <Send size={16} />
              Submit for Review
            </button>
          </>
        )}

        {isQualityManager && audit.status === 'submitted' && (
          <>
            <RequestEditButton auditId={auditId} onDone={setAudit} />
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {actionLoading ? 'Approving...' : 'Approve'}
            </button>
          </>
        )}

        {['submitted', 'approved'].includes(audit.status) && (
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <Download size={16} />
            PDF
          </button>
        )}
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Audit"
        message={`Delete this audit for ${audit.branches?.name}? This cannot be undone and all photos will be permanently removed.`}
        confirmLabel="Delete Audit"
        danger
      />
      <ConfirmModal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        onConfirm={handleSubmit}
        loading={actionLoading}
        title="Submit for Review"
        message="Submit this audit for the quality manager to review? You won't be able to edit it after submission unless edits are requested."
        confirmLabel="Submit"
      />
    </div>
  )
}

// ── Request Edit ──────────────────────────────────────────────────────────────

function RequestEditButton({ auditId, onDone }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async () => {
    if (!comments.trim()) { toast.error('Please describe what needs to be fixed'); return }
    setLoading(true)
    try {
      const data = await api.requestEdit(auditId, comments)
      onDone(data.audit)
      toast.success('Edit requested')
      setOpen(false)
      setComments('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-700 text-orange-400 hover:bg-orange-900/20 text-sm font-medium transition-colors shrink-0"
      >
        Request Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Request Edit">
        <p className="text-sm text-gray-400 mb-3">Describe what the auditor needs to fix:</p>
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={4}
          placeholder="e.g. Section 2, Point 3 — please re-evaluate and add a photo."
          className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </Modal>
    </>
  )
}
