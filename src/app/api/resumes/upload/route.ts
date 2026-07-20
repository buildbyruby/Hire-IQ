import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const PDFParser = (await import('pdf2json')).default
    
    const text = await new Promise<string>((resolve, reject) => {
      const parser = new PDFParser()
      
      parser.on('pdfParser_dataReady', (data: any) => {
        try {
          const extractedText = data.Pages
            .map((page: any) =>
              page.Texts
                .map((t: any) => decodeURIComponent(t.R.map((r: any) => r.T).join('')))
                .join(' ')
            )
            .join('\n')
          resolve(extractedText)
        } catch (e) {
          reject(new Error('Failed to extract text from PDF'))
        }
      })

      parser.on('pdfParser_dataError', (err: any) => {
        reject(new Error(err.parserError || 'PDF parsing failed'))
      })

      parser.parseBuffer(buffer)
    })

    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text — PDF may be image-based' }, { status: 400 })
    }

    return NextResponse.json({ text, filename: file.name })
  } catch (error: any) {
    console.error('PDF parse error:', error)
    return NextResponse.json({ error: 'Failed to parse PDF: ' + error.message }, { status: 500 })
  }
}
