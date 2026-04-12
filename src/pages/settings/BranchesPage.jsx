import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import api from '../../utils/api'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'

export default function BranchesPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [brands, setBrands] = useState([])
  const [allBranches, setAllBranches] = useState([])
  const [assignments, setAssignments] = useState([]) // { branch_id, brand_id }
  const [loading, setLoading] = useState(true)
  const [activeBrandIdx, setActiveBrandIdx] = useState(0)
  const [assigning, setAssigning] = useState(null)

  const load = useCallback(async () => {
    try {
      const [brandsData, branchesData] = await Promise.all([
        api.getBrands(),
        api.getAllBranches(),
      ])
      setBrands(brandsData.brands || [])
      setAllBranches(branchesData.branches || [])

      // Fetch assignments for all brands
      const all = await Promise.all(
        (brandsData.brands || []).map(b =>
          api.getBrandBranches(b.id, new Date().toISOString().slice(0, 7))
            .then(d => (d.branches || []).map(br => ({ branch_id: br.branch_id, brand_id: b.id })))
        )
      )
      setAssignments(all.flat())
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const activeBrand = brands[activeBrandIdx]

  const assignedBranchIds = new Set(
    assignments.filter(a => a.brand_id === activeBrand?.id).map(a => a.branch_id)
  )

  const assigned = allBranches.filter(b => assignedBranchIds.has(b.id))
  const unassigned = allBranches.filter(b => !assignedBranchIds.has(b.id))

  const handleAssign = async (branchId) => {
    setAssigning(branchId)
    try {
      await api.assignBranch(branchId, activeBrand.id)
      setAssignments(prev => [...prev, { branch_id: branchId, brand_id: activeBrand.id }])
    } catch (e) { toast.error(e.message) }
    finally { setAssigning(null) }
  }

  const handleUnassign = async (branchId) => {
    setAssigning(branchId)
    try {
      await api.unassignBranch(branchId, activeBrand.id)
      setAssignments(prev => prev.filter(a => !(a.branch_id === branchId && a.brand_id === activeBrand.id)))
    } catch (e) { toast.error(e.message) }
    finally { setAssigning(null) }
  }

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-sm font-semibold text-white">Branch Assignments</h1>
      </div>

      {/* Brand tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900 overflow-x-auto">
        {brands.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setActiveBrandIdx(i)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              i === activeBrandIdx ? 'text-white' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
            style={i === activeBrandIdx ? { borderColor: b.color, color: b.color } : {}}
          >
            {b.name}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Assigned branches */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Assigned ({assigned.length})
          </h2>
          {assigned.length === 0
            ? <p className="text-sm text-gray-600">None assigned yet.</p>
            : (
              <div className="flex flex-col gap-1">
                {assigned.map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
                    <span className="text-sm text-white">{b.name}</span>
                    <button
                      onClick={() => handleUnassign(b.id)}
                      disabled={assigning === b.id}
                      className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Unassigned branches */}
        {unassigned.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Available to assign ({unassigned.length})
            </h2>
            <div className="flex flex-col gap-1">
              {unassigned.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-2.5">
                  <span className="text-sm text-gray-400">{b.name}</span>
                  <button
                    onClick={() => handleAssign(b.id)}
                    disabled={assigning === b.id}
                    className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={14} /> Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
