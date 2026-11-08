import { AsyncLocalStorage } from 'node:async_hooks'

interface OrganizationRequestContext {
  organizationId: string | null
}

const organizationStorage =
  new AsyncLocalStorage<OrganizationRequestContext>()

export function runWithOrganizationContext<T>(
  organizationId: string | null,
  callback: () => T,
): T {
  return organizationStorage.run(
    { organizationId },
    callback,
  )
}

export function getRequestedOrganizationId() {
  return organizationStorage.getStore()?.organizationId ?? null
}