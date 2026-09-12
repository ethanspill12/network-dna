import type { CaptureContract } from '../types/network'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export async function uploadCapture(file: File): Promise<CaptureContract> {
  const formData = new FormData()
  formData.append('file', file)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/captures`, { method: 'POST', body: formData })
  } catch {
    throw new Error('The local analysis service is unavailable. Start the FastAPI backend and try again.')
  }

  const body = await response.json().catch(() => null) as CaptureContract | { detail?: string } | null
  if (!response.ok) {
    const detail = body && 'detail' in body ? body.detail : undefined
    throw new Error(detail || 'The capture could not be processed.')
  }

  return body as CaptureContract
}
