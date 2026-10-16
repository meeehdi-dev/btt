import { expect, type Page } from '@playwright/test'

export async function createApiRecord<Data>(
  page: Page,
  path: string,
  data: unknown,
): Promise<Data> {
  const response = await page.request.post(path, { data })
  expect(response.ok(), `POST ${path} should succeed: ${await response.text()}`).toBe(true)
  return response.json() as Promise<Data>
}

export type ApiHierarchy = {
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  releaseId: string
  releaseName: string
}

export async function createApiHierarchy(
  page: Page,
  names: Pick<ApiHierarchy, 'clientName' | 'projectName' | 'releaseName'>,
): Promise<ApiHierarchy> {
  const client = await createApiRecord<{ id: string }>(page, '/api/clients', {
    name: names.clientName,
  })
  const project = await createApiRecord<{ id: string }>(page, '/api/projects', {
    clientId: client.id,
    name: names.projectName,
    color: '#abcdef',
  })
  const release = await createApiRecord<{ id: string }>(page, '/api/releases', {
    projectId: project.id,
    name: names.releaseName,
  })
  return {
    clientId: client.id,
    clientName: names.clientName,
    projectId: project.id,
    projectName: names.projectName,
    releaseId: release.id,
    releaseName: names.releaseName,
  }
}
