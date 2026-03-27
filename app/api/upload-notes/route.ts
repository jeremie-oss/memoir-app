import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (5MB max)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    let text = ''

    if (ext === 'txt') {
      text = await file.text()
    } else if (ext === 'pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await pdfParse(buffer)
      text = result.text
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth')
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    return NextResponse.json({ ok: true, text, fileName: file.name, wordCount })
  } catch (err) {
    console.error('[upload-notes]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
