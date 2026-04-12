import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'

// ── Inline editable text ──────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = () => {
    if (draft.trim() && draft !== value) onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 px-2 py-1 rounded bg-gray-800 border border-amber-500 text-sm text-white focus:outline-none"
        />
        <button onClick={commit} className="text-green-400 hover:text-green-300"><Check size={15} /></button>
        <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-300"><X size={15} /></button>
      </div>
    )
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true) }} className={`text-left hover:text-amber-400 transition-colors ${className}`}>
      {value || <span className="text-gray-600 italic">{placeholder}</span>}
    </button>
  )
}

// ── Point row ─────────────────────────────────────────────────────────────────
function PointItem({ point, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(point.id) }
    catch (e) { toast.error(e.message) }
    finally { setDeleting(false); setConfirmDel(false) }
  }

  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-gray-800/50 last:border-0">
      {/* Reorder */}
      <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
        <button onClick={onMoveUp} disabled={isFirst} className="text-gray-700 hover:text-gray-400 disabled:opacity-20"><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} disabled={isLast} className="text-gray-700 hover:text-gray-400 disabled:opacity-20"><ChevronDown size={14} /></button>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <InlineEdit
          value={point.description}
          onSave={v => onUpdate(point.id, { description: v })}
          placeholder="Point description"
          className="text-sm text-gray-200 block w-full"
        />
      </div>

      {/* Max score */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="text-xs text-gray-600">out of</span>
        <input
          type="number"
          min="1"
          defaultValue={point.max_score}
          onBlur={e => {
            const v = parseFloat(e.target.value)
            if (v > 0 && v !== parseFloat(point.max_score)) onUpdate(point.id, { max_score: v })
          }}
          className="w-14 px-1.5 py-1 rounded bg-gray-800 border border-gray-700 text-sm text-white text-center focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Delete */}
      <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-400 shrink-0 transition-colors">
        <Trash2 size={14} />
      </button>

      <ConfirmModal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Point"
        message={`Delete "${point.description}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ section, brandId, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, onPointsChange }) {
  const [open, setOpen] = useState(true)
  const [points, setPoints] = useState(section.qa_form_points || [])
  const [addingPoint, setAddingPoint] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newMax, setNewMax] = useState(10)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const totalMax = points.reduce((s, p) => s + parseFloat(p.max_score), 0)

  const handleAddPoint = async () => {
    if (!newDesc.trim()) return
    try {
      const data = await api.addPoint(section.id, newDesc.trim(), newMax)
      const updated = [...points, data.point]
      setPoints(updated)
      onPointsChange(section.id, updated)
      setNewDesc(''); setNewMax(10); setAddingPoint(false)
    } catch (e) { toast.error(e.message) }
  }

  const handleUpdatePoint = async (pointId, changes) => {
    try {
      const data = await api.updatePoint(pointId, changes)
      const updated = points.map(p => p.id === pointId ? { ...p, ...data.point } : p)
      setPoints(updated)
      onPointsChange(section.id, updated)
    } catch (e) { toast.error(e.message) }
  }

  const handleDeletePoint = async (pointId) => {
    await api.deletePoint(pointId)
    const updated = points.filter(p => p.id !== pointId)
    setPoints(updated)
    onPointsChange(section.id, updated)
  }

  const movePoint = async (idx, dir) => {
    const newArr = [...points]
    const swap = idx + dir
    ;[newArr[idx], newArr[swap]] = [newArr[swap], newArr[idx]]
    setPoints(newArr)
    onPointsChange(section.id, newArr)
    await api.reorderPoints(section.id, newArr.map(p => p.id))
  }

  const handleDeleteSection = async () => {
    setDeleting(true)
    try { await onDelete(section.id) }
    catch (e) { toast.error(e.message) }
    finally { setDeleting(false); setConfirmDel(false) }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={isFirst} className="text-gray-700 hover:text-gray-400 disabled:opacity-20"><ChevronUp size={14} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="text-gray-700 hover:text-gray-400 disabled:opacity-20"><ChevronDown size={14} /></button>
        </div>

        <InlineEdit
          value={section.title}
          onSave={v => onUpdate(section.id, v)}
          placeholder="Section title"
          className="flex-1 font-semibold text-white"
        />

        <span className="text-xs text-gray-500 shrink-0">{totalMax} pts</span>

        <button onClick={() => setConfirmDel(true)} className="text-gray-700 hover:text-red-400 shrink-0">
          <Trash2 size={15} />
        </button>
        <button onClick={() => setOpen(o => !o)} className="text-gray-500 shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {open && (
        <div className="px-4 py-2">
          {points.map((p, i) => (
            <PointItem
              key={p.id}
              point={p}
              onUpdate={handleUpdatePoint}
              onDelete={handleDeletePoint}
              onMoveUp={() => movePoint(i, -1)}
              onMoveDown={() => movePoint(i, 1)}
              isFirst={i === 0}
              isLast={i === points.length - 1}
            />
          ))}

          {/* Add point */}
          {addingPoint ? (
            <div className="flex items-center gap-2 py-2">
              <input
                autoFocus
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddPoint(); if (e.key === 'Escape') setAddingPoint(false) }}
                placeholder="Point description"
                className="flex-1 px-2 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-gray-600 shrink-0">out of</span>
              <input
                type="number"
                min="1"
                value={newMax}
                onChange={e => setNewMax(e.target.value)}
                className="w-14 px-1.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white text-center focus:outline-none focus:border-amber-500"
              />
              <button onClick={handleAddPoint} className="text-green-400 hover:text-green-300"><Check size={16} /></button>
              <button onClick={() => setAddingPoint(false)} className="text-gray-500 hover:text-gray-300"><X size={16} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingPoint(true)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-amber-400 py-2 transition-colors"
            >
              <Plus size={13} /> Add point
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={handleDeleteSection}
        loading={deleting}
        title="Delete Section"
        message={`Delete section "${section.title}" and all its points? This cannot be undone.`}
        confirmLabel="Delete Section"
        danger
      />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FormDesignerPage() {
  const { brandId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [brand, setBrand] = useState(null)
  const [template, setTemplate] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')

  const load = useCallback(async () => {
    try {
      const [brandsData, formData] = await Promise.all([
        api.getBrands(),
        api.getBrandForm(brandId),
      ])
      const b = brandsData.brands?.find(b => b.id === brandId)
      setBrand(b)
      setTemplate(formData.template)
      setSections(formData.template?.qa_form_sections || [])
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [brandId])

  useEffect(() => { load() }, [load])

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return
    try {
      const data = await api.addSection(brandId, newSectionTitle.trim())
      setSections(s => [...s, { ...data.section, qa_form_points: [] }])
      setNewSectionTitle(''); setAddingSection(false)
    } catch (e) { toast.error(e.message) }
  }

  const handleUpdateSection = async (sectionId, title) => {
    try {
      await api.updateSection(sectionId, title)
      setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, title } : sec))
    } catch (e) { toast.error(e.message) }
  }

  const handleDeleteSection = async (sectionId) => {
    await api.deleteSection(sectionId)
    setSections(s => s.filter(sec => sec.id !== sectionId))
  }

  const moveSection = async (idx, dir) => {
    const newArr = [...sections]
    const swap = idx + dir
    ;[newArr[idx], newArr[swap]] = [newArr[swap], newArr[idx]]
    setSections(newArr)
    await api.reorderSections(brandId, newArr.map(s => s.id))
  }

  const handlePointsChange = (sectionId, points) => {
    setSections(s => s.map(sec => sec.id === sectionId ? { ...sec, qa_form_points: points } : sec))
  }

  const totalMaxScore = sections.reduce((s, sec) => s + (sec.qa_form_points || []).reduce((a, p) => a + parseFloat(p.max_score), 0), 0)

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: brand?.color }} />
            <h1 className="text-sm font-semibold text-white">{brand?.name} — Audit Form</h1>
          </div>
          <p className="text-xs text-gray-500">{sections.length} sections · {totalMaxScore} total points</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {sections.length === 0 && !addingSection && (
          <div className="text-center text-gray-600 py-10 text-sm">
            No sections yet. Add your first section below.
          </div>
        )}

        {sections.map((sec, i) => (
          <SectionCard
            key={sec.id}
            section={sec}
            brandId={brandId}
            onUpdate={handleUpdateSection}
            onDelete={handleDeleteSection}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onPointsChange={handlePointsChange}
          />
        ))}

        {/* Add section */}
        {addingSection ? (
          <div className="flex items-center gap-2 bg-gray-900 border border-amber-500 rounded-xl px-4 py-3">
            <input
              autoFocus
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSection(); if (e.key === 'Escape') setAddingSection(false) }}
              placeholder="Section title"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button onClick={handleAddSection} className="text-green-400 hover:text-green-300"><Check size={16} /></button>
            <button onClick={() => setAddingSection(false)} className="text-gray-500 hover:text-gray-300"><X size={16} /></button>
          </div>
        ) : (
          <button
            onClick={() => setAddingSection(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-800 text-gray-600 hover:border-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Section
          </button>
        )}
      </div>
    </div>
  )
}
