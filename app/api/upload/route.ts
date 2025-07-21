import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { v4 as uuidv4 } from 'uuid'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

interface DocumentChunk {
  user_id: string
  doc_id: string
  content: string
  embedding: number[]
  chunk_index: number
}

export async function POST(request: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout

  try {
    // Initialize Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for server-side operations
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log(`Processing file: ${file.name} (${file.type})`)

    // Extract text based on file type
    let extractedText = ''
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === 'application/pdf') {
      try {
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } catch (error) {
        console.error('PDF parsing error:', error)
        return NextResponse.json(
          { error: 'Failed to parse PDF. The file might be corrupted or password-protected.' },
          { status: 400 }
        )
      }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
      } catch (error) {
        console.error('DOCX parsing error:', error)
        return NextResponse.json(
          { error: 'Failed to parse DOCX file. The file might be corrupted.' },
          { status: 400 }
        )
      }
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Document appears to be empty or contains insufficient text for analysis.' },
        { status: 400 }
      )
    }

    console.log(`Extracted text length: ${extractedText.length} characters`)

    // Create semantic text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '],
    })

    // Split text into chunks
    const chunks = await textSplitter.splitText(extractedText)
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create text chunks from document.' },
        { status: 400 }
      )
    }

    console.log(`Created ${chunks.length} text chunks`)

    // Generate document ID
    const docId = uuidv4()

    // Process chunks in batches to avoid rate limits
    const batchSize = 5
    const documentChunks: DocumentChunk[] = []

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        try {
          // Generate embedding
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: chunk,
          })

          return {
            user_id: user.id,
            doc_id: docId,
            content: chunk,
            embedding,
            chunk_index: i + batchIndex,
          }
        } catch (error) {
          console.error(`Failed to generate embedding for chunk ${i + batchIndex}:`, error)
          throw error
        }
      })

      const batchResults = await Promise.all(batchPromises)
      documentChunks.push(...batchResults)

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`)
    }

    // Insert chunks into Supabase
    const { data: insertedChunks, error: insertError } = await supabase
      .from('document_chunks')
      .insert(documentChunks)
      .select('id, chunk_index')

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save document chunks to database.' },
        { status: 500 }
      )
    }

    clearTimeout(timeoutId)

    console.log(`Successfully processed document: ${file.name}`)
    console.log(`Document ID: ${docId}`)
    console.log(`Chunks created: ${documentChunks.length}`)

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        docId,
        fileName: file.name,
        fileType: file.type,
        textLength: extractedText.length,
        chunksCreated: documentChunks.length,
        chunksInserted: insertedChunks?.length || 0,
      }
    })

  } catch (error) {
    clearTimeout(timeoutId)
    console.error('Upload processing error:', error)
    
    let errorMessage = 'An unexpected error occurred while processing your document.'
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Processing timeout. Please try with a smaller document or try again later.'
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (error.message.includes('embedding')) {
        errorMessage = 'Failed to generate embeddings. Please try again.'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 