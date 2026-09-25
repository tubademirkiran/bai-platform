import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { callGroqJSON, GroqError, type ChatMessage } from '@/lib/groq'
import { buildSystemPrompt, maxTokensFor } from '@/lib/atlas/prompts'
import { createDoc } from '@/lib/atlas/config'
import type { ActionKind, AtlasAction, AtlasDoc, AtlasResponse, DocType } from '@/lib/atlas/types'

/**
 * Atlas Studio (BMAD-METHOD™) uç noktası.
 *
 * Akış kontrolü istemcidedir; buraya "ne üretilecek" bilgisi `action` ile gelir.
 * Route yalnızca action'ı doğrular, ona uygun sistem prompt'unu ve token bütçesini
 * seçip modeli çağırır.
 */

const ACTION_KINDS: ActionKind[] = [
  'draft-section',
  'elicit-section',
  'advanced-elicit',
  'yolo-fill',
  'gen-doc',
  'brainstorm-setup',
  'brainstorm-produce',
  'chat',
]

const DOC_TYPES: DocType[] = ['brief', 'brainstorm', 'competitor', 'market', 'research-prompt']

/** Süreklilik `doc`'tan geldiği için sohbet geçmişini son N mesajla sınırlıyoruz. */
const MAX_HISTORY = 12

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseAction(raw: unknown): AtlasAction | null {
  if (!isRecord(raw)) return null
  const kind = raw.kind
  if (typeof kind !== 'string' || !ACTION_KINDS.includes(kind as ActionKind)) return null

  switch (kind) {
    case 'draft-section':
      return typeof raw.sectionId === 'string' && raw.sectionId
        ? { kind, sectionId: raw.sectionId }
        : null
    case 'elicit-section':
      return typeof raw.sectionId === 'string' && raw.sectionId && typeof raw.optionId === 'string'
        ? { kind, sectionId: raw.sectionId, optionId: raw.optionId }
        : null
    case 'advanced-elicit':
      return typeof raw.optionId === 'string' ? { kind, optionId: raw.optionId } : null
    case 'gen-doc':
      return typeof raw.docType === 'string' && DOC_TYPES.includes(raw.docType as DocType)
        ? { kind, docType: raw.docType as DocType }
        : null
    default:
      return { kind } as AtlasAction
  }
}

/** İstemciden gelen dokümanı güvenli bir şekle indirger; bozuksa boş şablona düşer. */
function parseDoc(raw: unknown): AtlasDoc {
  if (!isRecord(raw)) return createDoc('brief')
  const type = DOC_TYPES.includes(raw.type as DocType) ? (raw.type as DocType) : 'brief'
  if (!Array.isArray(raw.sections)) return createDoc(type)

  const sections = raw.sections.filter(isRecord).map((s) => ({
    id: String(s.id ?? ''),
    heading: String(s.heading ?? ''),
    content: typeof s.content === 'string' ? s.content : '',
    status: (s.status === 'draft' || s.status === 'refined' ? s.status : 'empty') as AtlasDoc['sections'][number]['status'],
    inScope: Array.isArray(s.inScope) ? (s.inScope as AtlasDoc['sections'][number]['inScope']) : undefined,
    outOfScope: Array.isArray(s.outOfScope) ? (s.outOfScope as string[]) : undefined,
    risks: Array.isArray(s.risks) ? (s.risks as AtlasDoc['sections'][number]['risks']) : undefined,
    techStack: Array.isArray(s.techStack) ? (s.techStack as string[]) : undefined,
  }))

  return {
    type,
    title: typeof raw.title === 'string' && raw.title ? raw.title : createDoc(type).title,
    sections: sections.filter((s) => s.id),
  }
}

function parseMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(isRecord)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }))
}

export async function POST(req: NextRequest) {
  const gate = await guard('bmad')
  if (gate.error) return gate.error

  try {
    const body = await req.json()

    const action = parseAction(body?.action)
    if (!action) {
      return NextResponse.json({ error: 'Geçersiz veya eksik işlem (action).' }, { status: 400 })
    }

    const messages = parseMessages(body?.messages)
    if (messages.length === 0) {
      return NextResponse.json({ error: 'Mesaj geçmişi gerekli.' }, { status: 400 })
    }

    const doc = parseDoc(body?.doc)

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(action, doc) },
      ...messages,
    ]

    const result = await callGroqJSON<AtlasResponse>({
      messages: chatMessages,
      maxTokens: maxTokensFor(action),
      temperature: 0.4,
    })

    // Model "reply" üretmezse istemci boş balon göstermesin.
    if (!result.reply || typeof result.reply !== 'string') {
      result.reply = 'Dokümanı güncelledim. Sağ panelden inceleyebilirsiniz.'
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Atlas API hatası:', error)
    return NextResponse.json({ error: 'İşlem başarısız, lütfen tekrar deneyin.' }, { status: 500 })
  }
}
