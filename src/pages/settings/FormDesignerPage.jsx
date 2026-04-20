import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../context/ToastContext'

function IconBtn({ icon: Icon, onClick, color, title, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || 'var(--color-text-muted)',
        background: 'transparent',
        opacity: disabled ? 0.4 : 1,
      }}
      aria-label={title}
    >
      <Icon size={16} />
    </button>
  )
}

function InlineEdit({ value, onSave, onCancel, placeholder, type = 'text', min }) {
  const [val, setVal] = useState(value ?? '')
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        autoFocus
        type={type}
        value={val}
        min={min}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(val)
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          padding: '6px 10px',
          fontSize: 14,
          color: 'var(--color-text)',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
        }}
      />
      <IconBtn icon={Check} onClick={() => onSave(val)} color="var(--color-success)" title="Save" />
      <IconBtn icon={X}     onClick={onCancel}          color="var(--color-text-muted)" title="Cancel" />
    </div>
  )
}

function PointRow({ point, onUpdate, onDelete, onMove, isFirst, isLast }) {
  const [editDesc, setEditDesc] = useState(false)
  const [editScore, setEditScore] = useState(false)

  return (
    <div
      style={{
        padding: 10,
        background: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <IconBtn icon={ChevronUp}   onClick={() => onMove(-1)} disabled={isFirst} title="Move up" />
        <IconBtn icon={ChevronDown} onClick={() => onMove(1)}  disabled={isLast}  title="Move down" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editDesc ? (
          <InlineEdit
            value={point.description}
            onSave={(v) => { if (v.trim()) { onUpdate({ description: v.trim() }); setEditDesc(false) } }}
            onCancel={() => setEditDesc(false)}
            placeholder="Point description"
          />
        ) : (
          <button
            onClick={() => setEditDesc(true)}
            style={{
              textAlign: 'left',
              fontSize: 13,
              color: 'var(--color-text)',
              lineHeight: 1.45,
              padding: '2px 0',
              background: 'transparent',
              width: '100%',
            }}
          >
            {point.description}
          </button>
        )}
      </div>
      <div style={{ width: 72, flexShrink: 0 }}>
        {editScore ? (
          <InlineEdit
            value={point.max_score}
            type="number"
            min={0}
            onSave={(v) => {
              const n = parseInt(v, 10)
              if (!Number.isNaN(n) && n >= 0) { onUpdate({ max_score: n }); setEditScore(false) }
            }}
            onCancel={() => setEditScore(false)}
          />
        ) : (
          <button
            onClick={() => setEditScore(true)}
            className="font-mono"
            style={{
              fontSize: 13,
              color: 'var(--color-primary)',
              fontWeight: 700,
              padding: '2px 0',
              background: 'transparent',
              width: '100%',
              textAlign: 'right',
            }}
          >
            {point.max_score} pt
          </button>
        )}
      </div>
      <IconBtn icon={Trash2} onClick={onDelete} color="var(--color-danger)" title="Delete" />
    </div>
  )
}

function SectionCard({ section, onUpdate, onDelete, onMove, onAddPoint, onUpdatePoint, onDeletePoint, onReorderPoints, isFirst, isLast }) {
  const [editTitle, setEditTitle] = useState(false)
  const [addingPoint, setAddingPoint] = useState(false)
  const [newPointDesc, setNewPointDesc] = useState('')
  const [newPointScore, setNewPointScore] = useState(5)

  const totalScore = section.points.reduce((s, p) => s + (p.max_score || 0), 0)

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 14,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <IconBtn icon={ChevronUp}   onClick={() => onMove(-1)} disabled={isFirst} title="Move up" />
          <IconBtn icon={ChevronDown} onClick={() => onMove(1)}  disabled={isLast}  title="Move down" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editTitle ? (
            <InlineEdit
              value={section.title}
              onSave={(v) => { if (v.trim()) { onUpdate({ title: v.trim() }); setEditTitle(false) } }}
              onCancel={() => setEditTitle(false)}
              placeholder="Section title"
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', flex: 1, minWidth: 0 }}>
                {section.title}
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {section.points.length} · {totalScore} pt
              </div>
            </div>
          )}
        </div>
        <IconBtn icon={Pencil} onClick={() => setEditTitle(true)} title="Rename" />
        <IconBtn icon={Trash2} onClick={onDelete} color="var(--color-danger)" title="Delete section" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {section.points.map((p, idx) => (
          <PointRow
            key={p.id}
            point={p}
            isFirst={idx === 0}
            isLast={idx === section.points.length - 1}
            onUpdate={(patch) => onUpdatePoint(p.id, patch)}
            onDelete={() => onDeletePoint(p.id)}
            onMove={(dir) => {
              const next = [...section.points]
              const to = idx + dir
              ;[next[idx], next[to]] = [next[to], next[idx]]
              onReorderPoints(next.map((x) => x.id))
            }}
          />
        ))}
      </div>

      {addingPoint ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input
            autoFocus
            value={newPointDesc}
            onChange={(e) => setNewPointDesc(e.target.value)}
            placeholder="Point description"
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: 14,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
          <input
            type="number"
            min={0}
            value={newPointScore}
            onChange={(e) => setNewPointScore(e.target.value)}
            style={{
              width: 64,
              padding: '8px 10px',
              fontSize: 14,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
          <button
            onClick={() => {
              const score = parseInt(newPointScore, 10)
              if (!newPointDesc.trim() || Number.isNaN(score)) return
              onAddPoint(newPointDesc.trim(), score)
              setNewPointDesc(''); setNewPointScore(5); setAddingPoint(false)
            }}
            style={{
              padding: '0 12px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
            }}
          >Add</button>
          <button
            onClick={() => { setAddingPoint(false); setNewPointDesc('') }}
            style={{ padding: '0 10px', color: 'var(--color-text-muted)' }}
          ><X size={18} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAddingPoint(true)}
          style={{
            marginTop: 10,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--color-primary)',
            background: 'var(--color-bg-hover)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> Add point
        </button>
      )}
    </div>
  )
}

export default function FormDesignerPage() {
  const { brandId } = useParams()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [brand, setBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try {
      const [f, brandsResp] = await Promise.all([api.getBrandForm(brandId), api.getBrands()])
      setForm(f)
      setBrand(brandsResp.brands.find((b) => b.id === brandId) || null)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [brandId, toast])

  useEffect(() => { load() }, [load])

  async function addSection() {
    if (!newTitle.trim()) return
    try {
      await api.addSection(brandId, newTitle.trim())
      setNewTitle(''); setAdding(false)
      await load()
    } catch (e) { toast.error(e.message) }
  }

  async function updateSection(sectionId, patch) {
    try { await api.updateSection(sectionId, patch.title); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function deleteSection(sectionId) {
    try { await api.deleteSection(sectionId); setConfirm(null); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function reorderSections(orderedIds) {
    setForm((f) => ({
      ...f,
      sections: orderedIds.map((id) => f.sections.find((s) => s.id === id)),
    }))
    try { await api.reorderSections(brandId, orderedIds) }
    catch (e) { toast.error(e.message); load() }
  }

  async function addPoint(sectionId, description, max_score) {
    try { await api.addPoint(sectionId, description, max_score); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function updatePoint(pointId, patch) {
    try { await api.updatePoint(pointId, patch); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function deletePoint(pointId) {
    try { await api.deletePoint(pointId); await load() }
    catch (e) { toast.error(e.message) }
  }

  async function reorderPoints(sectionId, orderedIds) {
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s) =>
        s.id === sectionId ? { ...s, points: orderedIds.map((id) => s.points.find((p) => p.id === id)) } : s
      ),
    }))
    try { await api.reorderPoints(sectionId, orderedIds) }
    catch (e) { toast.error(e.message); load() }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>
  if (!form) return <div style={{ padding: 24, color: 'var(--color-text-muted)', textAlign: 'center' }}>No template for this brand.</div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <Link
        to="/settings"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}
      >
        <ArrowLeft size={16} /> Back to settings
      </Link>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        {brand && <span style={{ width: 10, height: 10, borderRadius: 999, background: brand.color }} />}
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{brand?.name} form</h1>
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Version {form.template.version} · {form.sections.length} sections ·{' '}
        {form.sections.reduce((s, sec) => s + sec.points.length, 0)} points
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {form.sections.map((section, idx) => (
          <SectionCard
            key={section.id}
            section={section}
            isFirst={idx === 0}
            isLast={idx === form.sections.length - 1}
            onUpdate={(patch) => updateSection(section.id, patch)}
            onDelete={() => setConfirm({ type: 'section', id: section.id, title: section.title })}
            onMove={(dir) => {
              const next = [...form.sections]
              const to = idx + dir
              ;[next[idx], next[to]] = [next[to], next[idx]]
              reorderSections(next.map((s) => s.id))
            }}
            onAddPoint={(d, s) => addPoint(section.id, d, s)}
            onUpdatePoint={updatePoint}
            onDeletePoint={deletePoint}
            onReorderPoints={(ids) => reorderPoints(section.id, ids)}
          />
        ))}
      </div>

      {adding ? (
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addSection(); if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
            placeholder="Section title"
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}
          />
          <button onClick={addSection} style={{ padding: '0 14px', background: 'var(--color-primary)', color: '#FFF', fontWeight: 700, borderRadius: 'var(--radius-md)' }}>Add</button>
          <button onClick={() => { setAdding(false); setNewTitle('') }} style={{ padding: '0 10px', color: 'var(--color-text-muted)' }}><X size={18} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            marginTop: 16,
            padding: '12px 14px',
            fontSize: 14,
            color: 'var(--color-primary)',
            background: 'var(--color-bg-card)',
            border: '1px dashed var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} /> Add section
        </button>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteSection(confirm.id)}
        title="Delete section?"
        message={`"${confirm?.title}" and all its points will be removed.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
