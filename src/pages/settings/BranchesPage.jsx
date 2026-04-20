import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'

export default function BranchesPage() {
  const toast = useToast()
  const [brands, setBrands] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null) // `${branchId}:${brandId}`

  const load = useCallback(async () => {
    try {
      const [b, br] = await Promise.all([api.getBrands(), api.getAllBranches()])
      setBrands(b.brands || [])
      setBranches(br.branches || [])
    } catch (e) {
      toast.error(e.message)
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [load])

  async function toggle(branch, brand) {
    const key = `${branch.id}:${brand.id}`
    setBusy(key)
    const assigned = branch.brand_ids.includes(brand.id)
    try {
      if (assigned) await api.unassignBranch(branch.id, brand.id)
      else          await api.assignBranch(branch.id, brand.id)
      setBranches((bs) => bs.map((b) => b.id === branch.id
        ? { ...b, brand_ids: assigned ? b.brand_ids.filter((x) => x !== brand.id) : [...b.brand_ids, brand.id] }
        : b
      ))
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 16 }}>
      <Link to="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}>
        <ArrowLeft size={16} /> Back to settings
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Branches</h1>
      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        Tap a brand chip to assign or unassign a branch.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {branches.map((branch) => (
          <div
            key={branch.id}
            style={{
              padding: 14,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
              {branch.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {brands.map((brand) => {
                const assigned = branch.brand_ids.includes(brand.id)
                const thisBusy = busy === `${branch.id}:${brand.id}`
                return (
                  <button
                    key={brand.id}
                    onClick={() => !thisBusy && toggle(branch, brand)}
                    disabled={thisBusy}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: assigned ? '#FFFFFF' : brand.color,
                      background: assigned ? brand.color : 'transparent',
                      border: `1px solid ${brand.color}`,
                      borderRadius: 999,
                      opacity: thisBusy ? 0.6 : 1,
                    }}
                  >
                    {assigned && <Check size={12} />} {brand.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
