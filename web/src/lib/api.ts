import axios from 'axios'

const ORGANIZATION_STORAGE_KEY = 'ptm-active-organization-id'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  timeout: 10000,
})

export function setApiAccessToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export function setActiveOrganizationId(
  organizationId: string | null,
) {
  if (organizationId) {
    localStorage.setItem(
      ORGANIZATION_STORAGE_KEY,
      organizationId,
    )
  } else {
    localStorage.removeItem(ORGANIZATION_STORAGE_KEY)
  }
}

export function getActiveOrganizationId(): string | null {
  return localStorage.getItem(ORGANIZATION_STORAGE_KEY)
}

api.interceptors.request.use((config) => {
  const organizationId = getActiveOrganizationId()

  if (organizationId) {
    config.headers.set('X-Organization-Id', organizationId)
  } else {
    config.headers.delete('X-Organization-Id')
  }

  return config
})