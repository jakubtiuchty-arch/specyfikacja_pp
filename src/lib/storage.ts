// Storage abstraction - działa lokalnie i na Vercel Blob
import { RequirementsData, AnalysisReport, UploadedFile } from '@/types'

// W trybie dev używamy pamięci, na produkcji Vercel Blob
const isProduction = process.env.NODE_ENV === 'production'

// In-memory storage dla developmentu
const memoryStorage: {
  requirements: RequirementsData | null
  devices: Map<string, { name: string; content: string }>
  reports: AnalysisReport[]
} = {
  requirements: null,
  devices: new Map(),
  reports: []
}

export async function saveRequirements(data: RequirementsData): Promise<void> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    // Vercel Blob
    const { put } = await import('@vercel/blob')
    await put('requirements.json', JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false
    })
  } else {
    memoryStorage.requirements = data
  }
}

export async function getRequirements(): Promise<RequirementsData | null> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: 'requirements' })
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url)
        return await response.json()
      }
    } catch {
      return null
    }
  }
  return memoryStorage.requirements
}

export async function saveDevicePDF(
  id: string,
  name: string,
  content: string
): Promise<string> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`devices/${id}.txt`, content, { access: 'public' })
    return blob.url
  } else {
    memoryStorage.devices.set(id, { name, content })
    return `/api/devices/${id}`
  }
}

export async function getDevicePDF(id: string): Promise<{ name: string; content: string } | null> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: `devices/${id}` })
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url)
        const content = await response.text()
        return { name: id, content }
      }
    } catch {
      return null
    }
  }
  return memoryStorage.devices.get(id) || null
}

export async function listDevices(): Promise<UploadedFile[]> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: 'devices/' })
      return blobs.map(blob => ({
        id: blob.pathname.replace('devices/', '').replace('.txt', ''),
        name: blob.pathname.replace('devices/', '').replace('.txt', ''),
        type: 'device' as const,
        uploadedAt: blob.uploadedAt.toISOString(),
        url: blob.url
      }))
    } catch {
      return []
    }
  }

  return Array.from(memoryStorage.devices.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    type: 'device' as const,
    uploadedAt: new Date().toISOString()
  }))
}

export async function deleteDevice(id: string): Promise<boolean> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del, list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: `devices/${id}` })
      if (blobs.length > 0) {
        await del(blobs[0].url)
        return true
      }
    } catch {
      return false
    }
  }
  return memoryStorage.devices.delete(id)
}

export async function saveReport(report: AnalysisReport): Promise<void> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const id = `${report.nazwa_urzadzenia}_${Date.now()}`
    await put(`reports/${id}.json`, JSON.stringify(report), { access: 'public' })
  } else {
    memoryStorage.reports.push(report)
  }
}

export async function getReports(): Promise<AnalysisReport[]> {
  if (isProduction && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import('@vercel/blob')
      const { blobs } = await list({ prefix: 'reports/' })
      const reports: AnalysisReport[] = []
      for (const blob of blobs) {
        const response = await fetch(blob.url)
        reports.push(await response.json())
      }
      return reports
    } catch {
      return []
    }
  }
  return memoryStorage.reports
}
