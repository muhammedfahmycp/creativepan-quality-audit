import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Camera, Trash2, Send, CheckCircle, X, AlertTriangle, MessageSquare } from 'lucide-react'
import api from '../utils/api'
import Spinner from '../components/ui/Spinner'
import StatusBadge from '../components/ui/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const AUTOSAVE_MS = 800

function answerOf(r) {
  if (!r) return null
  if (!r.is_applicable) return 'na'
  if (r.awarded_score == null) return null
  return r.awarded_score > 0 ? 'yes' : 'no'
}

function scoreFromAnswer(answer, max) {
  if (answer === 'na')  return { is_applicable: false, awarded_score: null }
  if (answer === 'yes') return { is_applicable: true,  awarded_score: max }
  if (answer === 'no')  return { is_applicable: true,  awarded_score: 0 }
  return { is_applicable: true, awarded_score: null }
}

function PhotoThumb({ photo, onDelete, canDelete }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    api.getPhotoUrl(photo.id).then((d) => setUrl(d.url)).catch(() => {})
  }, [photo.id])
  return (
    <div
      style={{
        position: 'relative',
        width: 72,
        height: 72,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'var(--color-bg-hover)',
        flexShrink: 0,
      }}
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Spinner size={16} />
        </div>
      )}
      {canDelete && (
        <button
          onClick={() => onDelete(photo.id)}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Delete photo"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

function PointRow({ point, response, photos, editable, onAnswer, onComment, onUploadPhoto, onDeletePhoto }) {
  const ans = answerOf(response)
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-uploading same file
    if (!file) return
    setUploading(true)
    try {
      await onUploadPhoto(response.id, file)
    } finally {
      setUploading(false)
    }
  }

  const btn = (value, label, color) => {
    const active = ans === value
    return (
      <button
        key={value}
        onClick={() => editable && onAnswer(point.id, value)}
        disabled={!editable}
        style={{
          flex: 1,
          padding: '10px 8px',
          fontSize: 13,
          fontWeight: 600,
          color: active ? '#FFFFFF' : color,
          background: active ? color : 'var(--color-bg-card)',
          border: `1px solid ${active ? color : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.12s',
          cursor: editable ? 'pointer' : 'not-allowed',
          opacity: editable ? 1 : 0.7,
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      style={{
        padding: '14px 14px',
        borderBottom: '1px solid var(--color-border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, flex: 1 }}>
          {point.description}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0, paddingTop: 2 }}
        >
          {point.max_score} pt
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {btn('yes', 'Yes', 'var(--color-success)')}
        {btn('no',  'No',  'var(--color-danger)')}
        {btn('na',  'N/A', 'var(--color-text-muted)')}
      </div>

      {editable && (
        <textarea
          value={response?.comments || ''}
          onChange={(e) => onComment(point.id, e.target.value)}
          placeholder="Comment (optional)"
          rows={2}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '8px 10px',
            fontSize: 13,
            color: 'var(--color-text)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            resize: 'vertical',
          }}
        />
      )}
      {!editable && response?.comments && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {response.comments}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
        {photos.map((p) => (
          <PhotoThumb key={p.id} photo={p} onDelete={onDeletePhoto} canDelete={editable} />
        ))}
        {editable && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: 72,
                height: 72,
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-card)',
                cursor: 'pointer',
              }}
            >
              {uploading ? <Spinner size={18} /> : (
                <>
                  <Camera size={20} />
                  <span style={{ fontSize: 11 }}>Photo</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuditFormPage() {
  const { auditId } = useParams()
  const navigate = useNavigate()
  const { user, isQualityManager } = useAuth()
  const toast = useToast()

  const [audit, setAudit] = useState(null)
  const [responses, setResponses] = useState([])
  const [photos, setPhotos] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const pendingSave = useRef(new Map())   // point_id -> response patch
  const saveTimer = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await api.getAudit(auditId)
      setAudit(resp.audit)
      setResponses(resp.responses)
      setPhotos(resp.photos)
      const formResp = await api.getBrandForm(resp.audit.brand_id)
      setForm(formResp)
      if (formResp?.sections?.length) setExpandedSection(formResp.sections[0].id)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [auditId, toast])

  useEffect(() => { load() }, [load])

  const responseByPoint = useMemo(() => {
    const m = new Map()
    for (const r of responses) m.set(r.point_id, r)
    return m
  }, [responses])

  const photosByResponse = useMemo(() => {
    const m = new Map()
    for (const p of photos) {
      if (!m.has(p.response_id)) m.set(p.response_id, [])
      m.get(p.response_id).push(p)
    }
    return m
  }, [photos])

  const isMine = audit && audit.auditor_id === user?.id
  const editable = audit && isMine && ['in_progress', 'edits_requested'].includes(audit.status)

  const { answered, total, percent } = useMemo(() => {
    const applicable = responses.filter((r) => r.is_applicable)
    const answered = responses.filter((r) => !r.is_applicable || r.awarded_score != null).length
    const maxScore = applicable.reduce((s, r) => s + (r.max_score_snapshot || 0), 0)
    const awarded = applicable.reduce((s, r) => s + (r.awarded_score || 0), 0)
    const percent = maxScore > 0 ? (awarded / maxScore) * 100 : 0
    return { answered, total: responses.length, percent }
  }, [responses])

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flushSave, AUTOSAVE_MS)
  }

  async function flushSave() {
    if (pendingSave.current.size === 0) return
    const payload = Array.from(pendingSave.current.values())
    pendingSave.current.clear()
    try {
      await api.saveAudit(auditId, payload)
    } catch (err) {
      toast.error(`Autosave failed: ${err.message}`)
    }
  }

  function patchResponse(pointId, patch) {
    setResponses((rs) => rs.map((r) => (r.point_id === pointId ? { ...r, ...patch } : r)))
    const existing = pendingSave.current.get(pointId) || { point_id: pointId }
    pendingSave.current.set(pointId, { ...existing, ...patch })
    scheduleSave()
  }

  function handleAnswer(pointId, answer) {
    const r = responseByPoint.get(pointId)
    if (!r) return
    const patch = scoreFromAnswer(answer, r.max_score_snapshot)
    patchResponse(pointId, patch)
  }

  function handleComment(pointId, comments) {
    patchResponse(pointId, { comments })
  }

  async function handleUploadPhoto(responseId, file) {
    try {
      await flushSave()
      const resp = await api.uploadPhoto(auditId, responseId, file)
      setPhotos((ps) => [...ps, resp.photo])
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDeletePhoto(photoId) {
    try {
      await api.deletePhoto(photoId)
      setPhotos((ps) => ps.filter((p) => p.id !== photoId))
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleSubmit() {
    await flushSave()
    const unanswered = responses.filter((r) => r.is_applicable && r.awarded_score == null)
    if (unanswered.length > 0) {
      toast.error(`${unanswered.length} point(s) still unanswered`)
      return
    }
    setSubmitting(true)
    try {
      const resp = await api.submitAudit(auditId)
      setAudit(resp.audit)
      toast.success('Submitted for review')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApprove() {
    setSubmitting(true)
    try {
      const resp = await api.approveAudit(auditId)
      setAudit(resp.audit)
      toast.success('Approved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRequestEdit() {
    if (!rejectReason.trim()) {
      toast.error('Please describe what needs editing')
      return
    }
    setSubmitting(true)
    try {
      const resp = await api.requestEdit(auditId, rejectReason.trim())
      setAudit(resp.audit)
      setShowReject(false)
      setRejectReason('')
      toast.success('Edits requested')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <Spinner size={32} />
      </div>
    )
  }
  if (!audit || !form) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Audit not found
      </div>
    )
  }

  const canReview = isQualityManager && audit.status === 'submitted'

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '12px 16px' }}>
        <Link
          to={`/brands/${audit.brand_id}/${audit.month}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-text-muted)',
            fontSize: 13,
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Audit · {audit.month}</h1>
          <StatusBadge status={audit.status} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Auditor: {audit.auditor_name}
        </div>
      </div>

      {/* Edits-requested banner */}
      {audit.status === 'edits_requested' && audit.manager_comments && (
        <div
          style={{
            margin: '0 16px 12px',
            padding: 12,
            background: '#FFEDD5',
            color: '#9A3412',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            fontSize: 13,
          }}
        >
          <MessageSquare size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Manager requested edits</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{audit.manager_comments}</div>
          </div>
        </div>
      )}

      {/* Progress card */}
      <div
        style={{
          margin: '0 16px 16px',
          padding: 14,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Progress</div>
          <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
            {answered}/{total}
          </div>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--color-bg-hover)',
            borderRadius: 999,
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(answered / Math.max(total, 1)) * 100}%`,
              background: 'var(--color-primary)',
              transition: 'width 0.2s',
            }}
          />
        </div>
        {audit.score_percentage != null && audit.status !== 'in_progress' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Score</span>
            <span className="font-mono" style={{ fontWeight: 700 }}>
              {Number(audit.score_percentage).toFixed(2)}%
            </span>
          </div>
        )}
        {audit.status === 'in_progress' && answered > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Current</span>
            <span className="font-mono" style={{ fontWeight: 700 }}>{percent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Sections */}
      <div style={{ padding: '0 16px' }}>
        {form.sections.map((section) => {
          const sectionResponses = section.points.map((p) => responseByPoint.get(p.id))
          const answeredInSection = sectionResponses.filter(
            (r) => r && (!r.is_applicable || r.awarded_score != null)
          ).length
          const isOpen = expandedSection === section.id
          return (
            <div
              key={section.id}
              style={{
                marginBottom: 12,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <button
                onClick={() => setExpandedSection(isOpen ? null : section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 14,
                  background: 'transparent',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                  {section.title}
                </div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {answeredInSection}/{section.points.length}
                </div>
              </button>
              {isOpen && (
                <div>
                  {section.points.map((point) => (
                    <PointRow
                      key={point.id}
                      point={point}
                      response={responseByPoint.get(point.id)}
                      photos={photosByResponse.get(responseByPoint.get(point.id)?.id) || []}
                      editable={editable}
                      onAnswer={handleAnswer}
                      onComment={handleComment}
                      onUploadPhoto={handleUploadPhoto}
                      onDeletePhoto={handleDeletePhoto}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action bar */}
      {(editable || canReview) && (
        <div
          className="safe-bottom"
          style={{
            position: 'fixed',
            bottom: 56,
            left: 0,
            right: 0,
            background: 'var(--color-bg-card)',
            borderTop: '1px solid var(--color-border)',
            padding: '10px 16px',
            display: 'flex',
            gap: 10,
            zIndex: 20,
          }}
        >
          {editable && (
            <button
              onClick={handleSubmit}
              disabled={submitting || answered < total}
              style={{
                flex: 1,
                padding: '12px 16px',
                background:
                  answered < total ? 'var(--color-bg-hover)' : 'var(--color-primary)',
                color: answered < total ? 'var(--color-text-muted)' : '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: answered < total || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? <Spinner size={16} color="#FFFFFF" /> : <Send size={16} />}
              Submit for review
            </button>
          )}
          {canReview && (
            <>
              <button
                onClick={() => setShowReject(true)}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'transparent',
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Request edits
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--color-success)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {submitting ? <Spinner size={16} color="#FFFFFF" /> : <CheckCircle size={16} />}
                Approve
              </button>
            </>
          )}
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 29, 46, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setShowReject(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-xl)',
              padding: 20,
              width: '100%',
              maxWidth: 420,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={20} color="var(--color-warning)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Request edits</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Tell the auditor what needs to change.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 14,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                resize: 'vertical',
              }}
              placeholder="e.g. Re-upload photo for the dairy storage point, cleaner angle."
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReject(false)}
                style={{
                  padding: '10px 14px',
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestEdit}
                disabled={submitting}
                style={{
                  padding: '10px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'var(--color-warning)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
