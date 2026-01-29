export async function getApiKey(): Promise<string> {
  const response = await fetch('/api/api-keys')
  if (!response.ok) {
    return ''
  }

  const payload = (await response.json()) as { apiKey?: string }
  return payload.apiKey ?? ''
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const response = await fetch('/api/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to save API key')
  }
}

export async function deleteApiKey(): Promise<void> {
  const response = await fetch('/api/api-keys', {
    method: 'DELETE',
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error || 'Failed to delete API key')
  }
}
