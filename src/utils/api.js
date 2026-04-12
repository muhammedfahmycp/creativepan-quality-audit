const API_URL = import.meta.env.VITE_API_URL || 'https://vasko-kpi-production.up.railway.app'
const TOKEN_KEY = 'qa_token'

class ApiClient {
  getToken() { return localStorage.getItem(TOKEN_KEY) }
  setToken(t) { localStorage.setItem(TOKEN_KEY, t) }
  clearToken() { localStorage.removeItem(TOKEN_KEY) }

  async request(endpoint, options = {}) {
    const token = this.getToken()
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers })

    if (res.status === 401) {
      this.clearToken()
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  async upload(endpoint, formData) {
    const token = this.getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers, body: formData })
    if (res.status === 401) { this.clearToken(); window.location.href = '/login'; throw new Error('Unauthorized') }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  }

  // ── Auth ──
  async loginWithGoogle(idToken) {
    const data = await this.request('/api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) })
    if (data.token) this.setToken(data.token)
    return data
  }
  async getMe() { return this.request('/api/auth/me') }

  // ── Brands ──
  async getBrands() { return this.request('/api/quality/brands') }
  async getBrandForm(brandId) { return this.request(`/api/quality/brands/${brandId}/form`) }

  // ── Form design ──
  async addSection(brandId, title) {
    return this.request(`/api/quality/brands/${brandId}/sections`, { method: 'POST', body: JSON.stringify({ title }) })
  }
  async updateSection(sectionId, title) {
    return this.request(`/api/quality/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify({ title }) })
  }
  async deleteSection(sectionId) {
    return this.request(`/api/quality/sections/${sectionId}`, { method: 'DELETE' })
  }
  async reorderSections(brandId, order) {
    return this.request(`/api/quality/brands/${brandId}/sections/reorder`, { method: 'PUT', body: JSON.stringify({ order }) })
  }
  async addPoint(sectionId, description, max_score) {
    return this.request(`/api/quality/sections/${sectionId}/points`, { method: 'POST', body: JSON.stringify({ description, max_score }) })
  }
  async updatePoint(pointId, data) {
    return this.request(`/api/quality/points/${pointId}`, { method: 'PUT', body: JSON.stringify(data) })
  }
  async deletePoint(pointId) {
    return this.request(`/api/quality/points/${pointId}`, { method: 'DELETE' })
  }
  async reorderPoints(sectionId, order) {
    return this.request(`/api/quality/sections/${sectionId}/points/reorder`, { method: 'PUT', body: JSON.stringify({ order }) })
  }

  // ── Branches ──
  async getBrandBranches(brandId, month) {
    return this.request(`/api/quality/brands/${brandId}/branches?month=${month}`)
  }
  async assignBranch(branchId, brand_id) {
    return this.request(`/api/quality/branches/${branchId}/assign`, { method: 'POST', body: JSON.stringify({ brand_id }) })
  }
  async unassignBranch(branchId, brandId) {
    return this.request(`/api/quality/branches/${branchId}/assign/${brandId}`, { method: 'DELETE' })
  }
  async getAllBranches() { return this.request('/api/branches') }

  // ── Audits ──
  async getAudits(params = {}) {
    const q = new URLSearchParams(params).toString()
    return this.request(`/api/quality/audits${q ? `?${q}` : ''}`)
  }
  async startAudit(branch_id, brand_id, month) {
    return this.request('/api/quality/audits', { method: 'POST', body: JSON.stringify({ branch_id, brand_id, month }) })
  }
  async getAudit(auditId) { return this.request(`/api/quality/audits/${auditId}`) }
  async saveAudit(auditId, responses) {
    return this.request(`/api/quality/audits/${auditId}`, { method: 'PATCH', body: JSON.stringify({ responses }) })
  }
  async deleteAudit(auditId) {
    return this.request(`/api/quality/audits/${auditId}`, { method: 'DELETE' })
  }
  async submitAudit(auditId) {
    return this.request(`/api/quality/audits/${auditId}/submit`, { method: 'POST' })
  }
  async approveAudit(auditId) {
    return this.request(`/api/quality/audits/${auditId}/approve`, { method: 'POST' })
  }
  async requestEdit(auditId, manager_comments) {
    return this.request(`/api/quality/audits/${auditId}/request-edit`, { method: 'POST', body: JSON.stringify({ manager_comments }) })
  }

  // ── Photos ──
  async uploadPhoto(auditId, responseId, file) {
    const fd = new FormData()
    fd.append('photo', file)
    return this.upload(`/api/quality/audits/${auditId}/responses/${responseId}/photos`, fd)
  }
  async deletePhoto(photoId) {
    return this.request(`/api/quality/photos/${photoId}`, { method: 'DELETE' })
  }

  // ── Summaries ──
  async getBranchSummary(branchId, year) {
    return this.request(`/api/quality/branches/${branchId}/summary?year=${year}`)
  }
  async getAuditorHistory() { return this.request('/api/quality/auditor/history') }
  async getBrandSummary(brandId, month) {
    return this.request(`/api/quality/brands/${brandId}/summary?month=${month}`)
  }

  // ── Branch managers ──
  async getBranchManagers() { return this.request('/api/quality/branch-managers') }
  async assignBranchManager(user_id, branch_id) {
    return this.request('/api/quality/branch-managers', { method: 'POST', body: JSON.stringify({ user_id, branch_id }) })
  }
  async removeBranchManager(id) {
    return this.request(`/api/quality/branch-managers/${id}`, { method: 'DELETE' })
  }

  // ── QA Users ──
  async getQAUsers() { return this.request('/api/quality/users') }
  async createQAUser(data) {
    return this.request('/api/quality/users', { method: 'POST', body: JSON.stringify(data) })
  }
  async updateQAUserRole(userId, role) {
    return this.request(`/api/quality/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) })
  }
  async removeQAUser(userId) {
    return this.request(`/api/quality/users/${userId}`, { method: 'DELETE' })
  }

  // ── Export ──
  async exportPdf(auditId) {
    const token = this.getToken()
    const res = await fetch(`${API_URL}/api/quality/audits/${auditId}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('PDF export failed')
    return res.blob()
  }
}

export const api = new ApiClient()
export default api
