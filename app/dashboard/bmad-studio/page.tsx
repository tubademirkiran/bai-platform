'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/theme-context'
import { saveToHistory } from '@/lib/history'
import { CopyButton } from '@/components/ui/copy-button'
import { Prose } from '@/components/ui/prose'
import {
  Terminal, Send, Bot, User, Command, CheckCircle2, AlertTriangle,
  Layers, ServerCrash, Download, RotateCcw, Zap, FileText,
} from 'lucide-react'

import {
  ATLAS_COMMANDS, ADVANCED_ELICIT_OPTIONS, BRIEF_ELICIT_OPTIONS, BRIEF_SECTIONS,
  DOC_LABELS, createAllDocs, createDoc, isDocStarted, resolveCommand,
  type ElicitOption,
} from '@/lib/atlas/config'
import { docFileName, docToMarkdown } from '@/lib/atlas/markdown'
import type {
  AtlasAction, AtlasDoc, AtlasResponse, AtlasSession, DocType, DocUpdate,
} from '@/lib/atlas/types'

// ---------------------------------------------------------------------------
// SABİTLER & TİPLER
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bai-atlas-state-v1'

/** Sohbet balonunun altında buton olarak çizilen menü. */
type MenuKind = 'mode' | 'brief-elicit' | 'advanced-elicit'

interface Msg {
  id: string
  role: 'user' | 'agent'
  text: string
  variant?: 'welcome' | 'error'
  menu?: MenuKind
  time: string
}

const MODE_OPTIONS: ElicitOption[] = [
  { id: '1', label: 'Interactive Mode — bölüm bölüm birlikte ilerleyelim', instruction: '' },
  { id: '2', label: 'YOLO Mode — tüm taslağı tek seferde üret', instruction: '' },
]

const INITIAL_SESSION: AtlasSession = {
  phase: 'idle',
  docType: 'brief',
  currentSectionIndex: 0,
  yolo: false,
  topic: null,
}

const WELCOME_TEXT =
  'Merhaba! Ben Atlas, sizin BMAD İş Analistinizim. Kanıtlanmış BMAD-METHOD™ metodolojilerinde eğitim almış bir uzman olarak amacım, sizi yapılandırılmış bir keşif sürecinden geçirerek kapsamlı ve denetime hazır proje dokümantasyonu üretmek.'

let msgCounter = 0
function nextId() {
  msgCounter += 1
  return `m${Date.now().toString(36)}-${msgCounter}`
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function makeMsg(role: Msg['role'], text: string, extra: Partial<Msg> = {}): Msg {
  return { id: nextId(), role, text, time: now(), ...extra }
}

function welcomeMsg(): Msg {
  return makeMsg('agent', WELCOME_TEXT, { variant: 'welcome' })
}

/**
 * Atlas serbest metin beklerken (proje anlatımı, beyin fırtınası cevabı) girdiyi
 * yalnızca AÇIK bir komut ise komut sayarız: "/doc-out", "*elicit" veya çıplak tek rakam.
 * Böylece "3 farklı kullanıcı tipi var..." gibi bir anlatım komuta dönüşmez.
 */
function isExplicitCommand(raw: string): boolean {
  return /^[/*]/.test(raw) || /^[1-9]$/.test(raw)
}

// ---------------------------------------------------------------------------
// DOKÜMAN YAMASI
// ---------------------------------------------------------------------------

/** LLM'den gelen kısmi yamayı dokümana işler. Bilinmeyen id'ler sona eklenir. */
function applyDocUpdate(doc: AtlasDoc, update: DocUpdate | undefined, refined: boolean): AtlasDoc {
  if (!update) return doc
  const sections = [...doc.sections]

  for (const patch of update.sections ?? []) {
    if (!patch?.id) continue
    const idx = sections.findIndex((s) => s.id === patch.id)
    const hasContent = typeof patch.content === 'string' && patch.content.trim() !== ''
    const status = patch.status ?? (hasContent ? (refined ? 'refined' : 'draft') : undefined)

    if (idx === -1) {
      sections.push({
        id: patch.id,
        heading: patch.heading || patch.id,
        content: patch.content ?? '',
        status: status ?? 'empty',
        inScope: patch.inScope,
        outOfScope: patch.outOfScope,
        risks: patch.risks,
        techStack: patch.techStack,
      })
    } else {
      const cur = sections[idx]
      sections[idx] = {
        ...cur,
        heading: patch.heading || cur.heading,
        content: patch.content ?? cur.content,
        status: status ?? cur.status,
        inScope: patch.inScope ?? cur.inScope,
        outOfScope: patch.outOfScope ?? cur.outOfScope,
        risks: patch.risks ?? cur.risks,
        techStack: patch.techStack ?? cur.techStack,
      }
    }
  }

  return { ...doc, title: update.title?.trim() || doc.title, sections }
}

// ---------------------------------------------------------------------------
// BİLEŞEN
// ---------------------------------------------------------------------------

export default function AtlasStudioPage() {
  const { colors, accent, isDark } = useTheme()

  const [docs, setDocs] = useState<Record<DocType, AtlasDoc>>(createAllDocs)
  const [session, setSession] = useState<AtlasSession>(INITIAL_SESSION)
  const [activeDocType, setActiveDocType] = useState<DocType>('brief')
  const [messages, setMessages] = useState<Msg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showCommands, setShowCommands] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('Atlas çalışıyor...')
  const [hydrated, setHydrated] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeDoc = docs[activeDocType]

  // --- Kalıcılık: sayfa yenilense de oturum kaybolmasın -------------------

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.docs) setDocs({ ...createAllDocs(), ...saved.docs })
        if (saved.session) setSession({ ...INITIAL_SESSION, ...saved.session })
        if (saved.activeDocType) setActiveDocType(saved.activeDocType)
        setMessages(Array.isArray(saved.messages) && saved.messages.length ? saved.messages : [welcomeMsg()])
      } else {
        setMessages([welcomeMsg()])
      }
    } catch {
      setMessages([welcomeMsg()])
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs, session, activeDocType, messages }))
    } catch {
      // Kota dolmuşsa sessizce geç; oturum bellekte çalışmaya devam eder.
    }
  }, [docs, session, activeDocType, messages, hydrated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // --- Yardımcılar ---------------------------------------------------------

  const pushAgent = useCallback((text: string, extra: Partial<Msg> = {}) => {
    setMessages((prev) => [...prev, makeMsg('agent', text, extra)])
  }, [])

  const exportDoc = useCallback((doc: AtlasDoc) => {
    const blob = new Blob([docToMarkdown(doc)], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = docFileName(doc)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  /**
   * Atlas'ı çağırır ve dokümanı günceller.
   * @param history Kullanıcının bu turdaki girdisinden ÖNCEKİ sohbet geçmişi.
   * @param intent  Modele gönderilen, bu turda ne istendiğini anlatan metin.
   */
  const callAtlas = useCallback(
    async (
      action: AtlasAction,
      intent: string,
      doc: AtlasDoc,
      history: Msg[],
      label: string
    ): Promise<AtlasResponse | null> => {
      setIsLoading(true)
      setLoadingLabel(label)
      try {
        const apiMessages = [
          ...history
            .filter((m) => m.text.trim())
            .map((m) => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.text })),
          { role: 'user', content: intent },
        ]

        const res = await fetch('/api/bmad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, session, doc, action }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || `Sunucu yanıt vermedi (HTTP ${res.status}).`)
        }
        // 200 döndü ama gövde okunamadıysa null dönme: çağıranlar `if (!data) return`
        // yaptığı için akış sessizce duruyor, kullanıcı hiçbir şey görmüyordu.
        if (!data) {
          throw new Error('Sunucudan okunamayan bir yanıt geldi. Lütfen tekrar deneyin.')
        }
        return data as AtlasResponse
      } catch (error) {
        const message =
          error instanceof TypeError
            ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
            : error instanceof Error
              ? error.message
              : 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.'
        pushAgent(message, { variant: 'error' })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [session, pushAgent]
  )

  const updateDoc = useCallback((type: DocType, update: DocUpdate | undefined, refined: boolean) => {
    if (!update) return
    setDocs((prev) => ({ ...prev, [type]: applyDocUpdate(prev[type], update, refined) }))
  }, [])

  // --- Akış adımları -------------------------------------------------------

  /** Brief'te bir bölümün ilk taslağını yazdırır ve elicitation menüsünü açar. */
  const draftSection = useCallback(
    async (sectionIndex: number, intent: string, history: Msg[]) => {
      const def = BRIEF_SECTIONS[sectionIndex]
      if (!def) return

      const data = await callAtlas(
        { kind: 'draft-section', sectionId: def.id },
        intent,
        docs.brief,
        history,
        `Bölüm ${sectionIndex + 1} (${def.heading}) yazılıyor...`
      )
      if (!data) return

      updateDoc('brief', data.docUpdate, false)
      setSession((s) => ({ ...s, phase: 'section-draft', docType: 'brief', currentSectionIndex: sectionIndex }))
      setActiveDocType('brief')
      pushAgent(data.reply, { menu: 'brief-elicit' })
    },
    [callAtlas, docs.brief, updateDoc, pushAgent]
  )

  /** Bölüm elicitation seçeneği (0-8) — aynı bölümü rafine eder. */
  const elicitSection = useCallback(
    async (optionId: string, history: Msg[]) => {
      const def = BRIEF_SECTIONS[session.currentSectionIndex]
      const opt = BRIEF_ELICIT_OPTIONS.find((o) => o.id === optionId)
      if (!def || !opt) return

      const data = await callAtlas(
        { kind: 'elicit-section', sectionId: def.id, optionId },
        `"${def.heading}" bölümüne ${optionId} numaralı tekniği uygula: ${opt.label}`,
        docs.brief,
        history,
        `${opt.label} uygulanıyor...`
      )
      if (!data) return

      updateDoc('brief', data.docUpdate, true)
      pushAgent(data.reply, { menu: 'brief-elicit' })
    },
    [callAtlas, docs.brief, session.currentSectionIndex, updateDoc, pushAgent]
  )

  /** Bölüm menüsünde "9" — sonraki bölüme geç ya da dokümanı tamamla. */
  const advanceSection = useCallback(
    async (history: Msg[]) => {
      const next = session.currentSectionIndex + 1
      if (next >= BRIEF_SECTIONS.length) {
        setSession((s) => ({ ...s, phase: 'complete' }))
        pushAgent(
          `11 bölümün tamamı tamamlandı. Dokümanı 5 (elicit) ile bütünsel olarak denetleyebilir, 4 (doc-out) ile .md olarak dışa aktarabilirsiniz.`
        )
        void saveToHistory('Atlas Studio', 'create-project-brief (tamamlandı)', docToMarkdown(docs.brief))
        return
      }
      await draftSection(next, `Bölüm ${next + 1}: "${BRIEF_SECTIONS[next].heading}" bölümünü yaz.`, history)
    },
    [session.currentSectionIndex, draftSection, pushAgent, docs.brief]
  )

  /** *elicit menüsünden seçim (0-8) — tüm dokümana uygulanır. */
  const runAdvancedElicit = useCallback(
    async (optionId: string, history: Msg[]) => {
      const opt = ADVANCED_ELICIT_OPTIONS.find((o) => o.id === optionId)
      if (!opt) return

      const target = docs[session.docType]
      const data = await callAtlas(
        { kind: 'advanced-elicit', optionId },
        `Dokümanın tamamına ${optionId} numaralı ileri seviye elicitation tekniğini uygula: ${opt.label}`,
        target,
        history,
        `${opt.label} uygulanıyor...`
      )
      if (!data) return

      updateDoc(session.docType, data.docUpdate, true)
      setActiveDocType(session.docType)
      pushAgent(data.reply, { menu: 'advanced-elicit' })
    },
    [callAtlas, docs, session.docType, updateDoc, pushAgent]
  )

  /** YOLO: 11 bölümü tek seferde doldurur. */
  const runYolo = useCallback(
    async (intent: string, history: Msg[]) => {
      const data = await callAtlas(
        { kind: 'yolo-fill' },
        intent,
        docs.brief,
        history,
        'YOLO modu: 11 bölümün tamamı üretiliyor...'
      )
      if (!data) return

      updateDoc('brief', data.docUpdate, false)
      setSession((s) => ({ ...s, phase: 'complete', docType: 'brief', currentSectionIndex: BRIEF_SECTIONS.length - 1 }))
      setActiveDocType('brief')
      pushAgent(data.reply)
      void saveToHistory('Atlas Studio', `create-project-brief / YOLO — ${intent}`, JSON.stringify(data.docUpdate, null, 2))
    },
    [callAtlas, docs.brief, updateDoc, pushAgent]
  )

  /** competitor / market / research-prompt dokümanlarını üretir. */
  const runGenDoc = useCallback(
    async (docType: DocType, topic: string | null, history: Msg[]) => {
      const fresh = createDoc(docType)
      const intent = `${DOC_LABELS[docType]} dokümanını üret.${topic ? ` Konu: ${topic}` : ''}`

      const data = await callAtlas(
        { kind: 'gen-doc', docType },
        intent,
        fresh,
        history,
        `${DOC_LABELS[docType]} hazırlanıyor...`
      )
      if (!data) return

      setDocs((prev) => ({ ...prev, [docType]: applyDocUpdate(fresh, data.docUpdate, false) }))
      setSession((s) => ({ ...s, phase: 'complete', docType, topic }))
      setActiveDocType(docType)
      pushAgent(data.reply)
      void saveToHistory('Atlas Studio', intent, JSON.stringify(data.docUpdate, null, 2))
    },
    [callAtlas, pushAgent]
  )

  /** brainstorm: önce 3 kurulum sorusu. */
  const runBrainstormSetup = useCallback(
    async (topic: string, history: Msg[]) => {
      const fresh = createDoc('brainstorm')
      const data = await callAtlas(
        { kind: 'brainstorm-setup' },
        `Beyin fırtınası oturumu başlat. Konu: ${topic}`,
        fresh,
        history,
        'Oturum kuruluyor...'
      )
      if (!data) return

      setDocs((prev) => ({ ...prev, brainstorm: applyDocUpdate(fresh, data.docUpdate, false) }))
      setSession((s) => ({ ...s, phase: 'brainstorm-setup', docType: 'brainstorm', topic }))
      setActiveDocType('brainstorm')
      pushAgent(data.reply)
    },
    [callAtlas, pushAgent]
  )

  /** brainstorm: kurulum cevaplarından fazlı planı üretir. */
  const runBrainstormProduce = useCallback(
    async (answer: string, history: Msg[]) => {
      const data = await callAtlas(
        { kind: 'brainstorm-produce' },
        answer,
        docs.brainstorm,
        history,
        'Fazlı plan üretiliyor...'
      )
      if (!data) return

      updateDoc('brainstorm', data.docUpdate, false)
      setSession((s) => ({ ...s, phase: 'complete' }))
      setActiveDocType('brainstorm')
      pushAgent(data.reply)
      void saveToHistory('Atlas Studio', `brainstorm — ${session.topic ?? answer}`, JSON.stringify(data.docUpdate, null, 2))
    },
    [callAtlas, docs.brainstorm, updateDoc, pushAgent, session.topic]
  )

  // --- Komut yönlendirici --------------------------------------------------

  const resetSession = useCallback(
    (hard: boolean) => {
      setSession(INITIAL_SESSION)
      setActiveDocType('brief')
      if (hard) {
        setDocs(createAllDocs())
        setMessages([welcomeMsg()])
      }
    },
    []
  )

  const runCommand = useCallback(
    async (commandId: string, topic: string | null, history: Msg[]) => {
      switch (commandId) {
        case '1': // brainstorm {topic}
          if (!topic) {
            pushAgent('Beyin fırtınası için bir konu belirtin. Örnek: `1 ödeme altyapısı seçimi`')
            return
          }
          await runBrainstormSetup(topic, history)
          return

        case '2': // create-competitor-analysis
          await runGenDoc('competitor', topic, history)
          return

        case '3': // create-project-brief
          if (session.yolo) {
            setSession((s) => ({ ...s, phase: 'awaiting-brief-input', docType: 'brief', currentSectionIndex: 0 }))
            setActiveDocType('brief')
            pushAgent('YOLO modu açık — soru sormadan ilerleyeceğim. Projenizi birkaç cümleyle anlatın, 11 bölümü tek seferde dolduracağım.')
            return
          }
          setSession((s) => ({ ...s, phase: 'awaiting-mode', docType: 'brief', currentSectionIndex: 0 }))
          setActiveDocType('brief')
          pushAgent(
            'Standart BMAD şablonuyla yeni bir proje özeti oluşturacağım. Önce nasıl ilerlemek istediğinizi seçin:',
            { menu: 'mode' }
          )
          return

        case '4': // doc-out
          exportDoc(activeDoc)
          pushAgent(`"${activeDoc.title}" dokümanı Markdown olarak indiriliyor. İşlem tamamlandı.`)
          void saveToHistory('Atlas Studio', 'doc-out (doküman çıktısı alındı)', docToMarkdown(activeDoc))
          return

        case '5': // elicit
          if (!isDocStarted(docs[session.docType])) {
            pushAgent('Henüz üzerinde çalışılacak bir doküman yok. Önce 3 (create-project-brief) ile bir proje özeti oluşturun.')
            return
          }
          setSession((s) => ({ ...s, phase: 'advanced-elicit' }))
          pushAgent(
            `"${docs[session.docType].title}" dokümanını bütünsel olarak denetleyeceğim. Hangi ileri seviye tekniği uygulayalım?`,
            { menu: 'advanced-elicit' }
          )
          return

        case '6': // perform-market-research
          await runGenDoc('market', topic, history)
          return

        case '7': // research-prompt {topic}
          if (!topic && !isDocStarted(docs.brief)) {
            pushAgent('Araştırma komutu için bir konu belirtin. Örnek: `7 TikTok trend verisi toplama yöntemleri`')
            return
          }
          await runGenDoc('research-prompt', topic, history)
          return

        case '8': { // yolo toggle
          const next = !session.yolo
          setSession((s) => ({ ...s, yolo: next }))
          pushAgent(
            next
              ? 'YOLO modu AÇIK. Bundan sonra 3 (create-project-brief) komutunda mod sormadan tüm taslağı tek seferde üreteceğim.'
              : 'YOLO modu KAPALI. Proje özetinde bölüm bölüm, kalite güvence menüsüyle ilerleyeceğiz.'
          )
          return
        }

        case '9': // exit
          resetSession(false)
          pushAgent(
            'Atlas personasından çıkıyorum. Dokümanlarınız sağ panelde duruyor — istediğiniz an bir komutla geri dönebilirsiniz. Tamamen sıfırlamak için üstteki "Yeni Oturum" düğmesini kullanın.'
          )
          return

        default:
          return
      }
    },
    [session.yolo, session.docType, docs, activeDoc, pushAgent, exportDoc, resetSession, runBrainstormSetup, runGenDoc]
  )

  const handleSubmit = useCallback(
    async (rawInput: string) => {
      const raw = rawInput.trim()
      if (!raw || isLoading) return

      const history = messages
      setMessages((prev) => [...prev, makeMsg('user', raw)])
      setInputValue('')
      setShowCommands(false)

      const isBareDigit = /^[0-9]$/.test(raw)

      // 1) Açık bir menü varsa çıplak rakamlar önce menüye gider.
      //    (Örn. bölüm menüsünde "9" = sonraki bölüm, "exit" değil.)
      if (isBareDigit) {
        if (session.phase === 'awaiting-mode' && (raw === '1' || raw === '2')) {
          const yolo = raw === '2'
          setSession((s) => ({ ...s, phase: 'awaiting-brief-input', yolo }))
          pushAgent(
            yolo
              ? 'YOLO Mode seçildi. Projenizi birkaç cümleyle anlatın; 11 bölümün tamamını tek seferde dolduracağım.'
              : 'Interactive Mode seçildi. Projenizi birkaç cümleyle anlatın; Bölüm 1 (Yönetici Özeti) ile başlayıp her bölümde kalite güvence seçenekleri sunacağım.'
          )
          return
        }

        if (session.phase === 'section-draft') {
          if (raw === '9') await advanceSection(history)
          else await elicitSection(raw, history)
          return
        }

        if (session.phase === 'advanced-elicit') {
          if (raw === '9') {
            setSession((s) => ({ ...s, phase: isDocStarted(docs[s.docType]) ? 'complete' : 'idle' }))
            pushAgent('Elicitation oturumunu kapattım. 4 (doc-out) ile dokümanı dışa aktarabilirsiniz.')
          } else {
            await runAdvancedElicit(raw, history)
          }
          return
        }
      }

      // 2) Proje anlatımı bekleniyorsa serbest metin brief akışını başlatır.
      if (session.phase === 'awaiting-brief-input' && !isExplicitCommand(raw)) {
        if (session.yolo) await runYolo(raw, history)
        else await draftSection(0, raw, history)
        return
      }

      // 3) Beyin fırtınası kurulum cevabı.
      if (session.phase === 'brainstorm-setup' && !isExplicitCommand(raw)) {
        await runBrainstormProduce(raw, history)
        return
      }

      // 4) Komut çözümü.
      const resolved = resolveCommand(raw)
      if (resolved) {
        await runCommand(resolved.command.id, resolved.topic, history)
        return
      }

      // 5) Serbest sohbet.
      const data = await callAtlas({ kind: 'chat' }, raw, docs[session.docType], history, 'Atlas düşünüyor...')
      if (!data) return
      updateDoc(session.docType, data.docUpdate, false)
      pushAgent(data.reply)
    },
    [
      isLoading, messages, session, docs, pushAgent, advanceSection, elicitSection,
      runAdvancedElicit, runYolo, draftSection, runBrainstormProduce, runCommand,
      callAtlas, updateDoc,
    ]
  )

  const handleMenuClick = (value: string) => {
    if (isLoading) return
    void handleSubmit(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    if (val.endsWith('/')) setShowCommands(true)
    else if (val.trim() === '') setShowCommands(false)
  }

  const handleCommandSelect = (signature: string) => {
    setInputValue(`/${signature.replace(' {topic}', '')} `)
    setShowCommands(false)
    inputRef.current?.focus()
  }

  // --- Görsel yardımcılar --------------------------------------------------

  const severityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return { bg: '#ef444422', text: '#ef4444' }
      case 'medium': return { bg: '#f59e0b22', text: '#f59e0b' }
      case 'low': return { bg: '#10b98122', text: '#10b981' }
      default: return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' }
    }
  }

  const effortColor = (effort?: string) => {
    switch (effort?.toUpperCase()) {
      case 'S': return '#10b981'
      case 'M': return '#3b82f6'
      case 'L': return '#f59e0b'
      case 'XL': return '#ef4444'
      default: return accent
    }
  }

  const terminalBg = isDark ? '#09090b' : '#1e293b'
  const terminalHeader = isDark ? '#18181b' : '#0f172a'
  const terminalBorder = isDark ? '#27272a' : '#334155'

  const menuOptions = (kind: MenuKind): ElicitOption[] =>
    kind === 'mode' ? MODE_OPTIONS : kind === 'brief-elicit' ? BRIEF_ELICIT_OPTIONS : ADVANCED_ELICIT_OPTIONS

  const menuTitle = (kind: MenuKind) =>
    kind === 'mode'
      ? 'MOD SEÇİMİ'
      : kind === 'brief-elicit'
        ? `BÖLÜM ${session.currentSectionIndex + 1} — KALİTE GÜVENCE SEÇENEKLERİ`
        : 'İLERİ SEVİYE ELICITATION'

  const visibleDocTypes = (Object.keys(DOC_LABELS) as DocType[]).filter(
    (t) => isDocStarted(docs[t]) || t === activeDocType
  )

  const filledCount = activeDoc.sections.filter((s) => s.content.trim()).length
  const totalCount = activeDoc.sections.length

  // -------------------------------------------------------------------------

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>

      {/* SOL PANEL: ATLAS TERMİNALİ */}
      <div style={{ width: '40%', minWidth: '360px', display: 'flex', flexDirection: 'column', background: terminalBg, borderRadius: '16px', border: `1px solid ${terminalBorder}`, overflow: 'hidden' }}>

        <div style={{ background: terminalHeader, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${terminalBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color={accent} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              ATLAS <span style={{ opacity: 0.5 }}>(BMAD Business Analyst)</span>
            </span>
            {session.yolo && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b55', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 800 }}>
                <Zap size={10} /> YOLO
              </span>
            )}
          </div>
          <button
            onClick={() => resetSession(true)}
            title="Tüm dokümanları ve sohbeti sıfırla"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: `1px solid ${terminalBorder}`, color: '#94a3b8', padding: '4px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
          >
            <RotateCcw size={11} /> Yeni Oturum
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? accent : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div style={{ maxWidth: '88%', background: msg.role === 'user' ? accent + '22' : 'transparent', padding: msg.role === 'user' ? '10px 14px' : '4px 0', borderRadius: '12px', color: msg.variant === 'error' ? '#fca5a5' : '#e2e8f0', fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ fontSize: '10px', color: msg.role === 'user' ? accent : '#94a3b8', marginBottom: '4px', fontWeight: 700 }}>
                    {msg.role === 'user' ? 'SEN' : 'ATLAS'} • {msg.time}
                  </div>

                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

                  {msg.variant === 'welcome' && (
                    <>
                      <p style={{ marginTop: '12px', marginBottom: '6px' }}>
                        Oturumumuzu yönlendirmek için aşağıdaki 9 komuttan birini kullanabilirsiniz (numara ya da /komut):
                      </p>
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', fontFamily: 'monospace', opacity: 0.9, lineHeight: 1.7 }}>
                        {ATLAS_COMMANDS.map((c) => (
                          <li key={c.id}><strong>{c.signature}</strong> — {c.desc}</li>
                        ))}
                      </ol>
                      <p style={{ marginTop: '10px' }}>Başlamak için <strong>3</strong> yazın.</p>
                    </>
                  )}

                  {msg.menu && isLast && !isLoading && (
                    <div style={{ marginTop: '12px', border: `1px solid ${accent}44`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.04)', fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.4px' }}>
                        {menuTitle(msg.menu)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {menuOptions(msg.menu).map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleMenuClick(opt.id)}
                            style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', textAlign: 'left', padding: '7px 10px', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer', lineHeight: 1.45 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <span style={{ flexShrink: 0, fontWeight: 800, color: accent, background: accent + '18', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{opt.id}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
              <Bot size={14} /> {loadingLabel}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px', borderTop: `1px solid ${terminalBorder}`, position: 'relative', background: terminalHeader }}>
          {showCommands && (
            <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', marginBottom: '12px', background: '#18181b', border: `1px solid ${accent}44`, borderRadius: '12px', overflow: 'hidden', zIndex: 10 }}>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', fontSize: '11px', fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Command size={12} /> BMAD STANDART KOMUTLARI
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '6px' }}>
                {ATLAS_COMMANDS.map((cmd) => (
                  <div
                    key={cmd.id}
                    onClick={() => handleCommandSelect(cmd.signature)}
                    style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: accent, background: accent + '15', padding: '2px 6px', borderRadius: '4px', height: 'fit-content' }}>{cmd.id}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>/{cmd.signature}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cmd.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${terminalBorder}`, borderRadius: '10px', padding: '4px' }}>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(inputValue) }}
              disabled={isLoading}
              placeholder="Komut için numara (örn. 3) veya / yazın; ya da projenizi anlatın..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', padding: '10px', fontSize: '13px' }}
            />
            <button
              onClick={() => void handleSubmit(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              style={{ background: accent, color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading || !inputValue.trim() ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SAĞ PANEL: CANLI DOKÜMAN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: colors.card, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>

        <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', padding: '0 12px 0 4px', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {visibleDocTypes.map((type) => {
              const active = type === activeDocType
              return (
                <button
                  key={type}
                  onClick={() => setActiveDocType(type)}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '15px 16px', whiteSpace: 'nowrap', background: active ? colors.card : 'transparent', border: 'none', borderBottom: active ? `2px solid ${accent}` : '2px solid transparent', color: active ? accent : colors.textMuted, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <FileText size={14} /> {DOC_LABELS[type]}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <CopyButton getText={() => docToMarkdown(activeDoc)} label="Kopyala" copiedLabel="Kopyalandı" />
            <button
              onClick={() => exportDoc(activeDoc)}
              title="Markdown olarak indir"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Download size={12} /> .md
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.text, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
              {activeDoc.title}
            </h1>
            <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '14px' }}>
              {DOC_LABELS[activeDocType]} • {filledCount}/{totalCount} bölüm dolu
            </div>

            <div style={{ height: '5px', borderRadius: '3px', background: isDark ? '#27272a' : '#e2e8f0', overflow: 'hidden', marginBottom: '28px' }}>
              <div style={{ width: `${totalCount ? (filledCount / totalCount) * 100 : 0}%`, height: '100%', background: accent, transition: 'width 0.35s ease' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {activeDoc.sections.map((section, idx) => {
                const isActive =
                  activeDocType === 'brief' &&
                  session.phase === 'section-draft' &&
                  idx === session.currentSectionIndex
                const hasContent = section.content.trim() !== ''
                const dot = section.status === 'refined' ? '#10b981' : hasContent ? accent : colors.border

                return (
                  <div
                    key={section.id}
                    style={{
                      border: `1px solid ${isActive ? accent : colors.border}`,
                      background: isActive ? accent + '0d' : isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                      borderRadius: '12px',
                      padding: '18px 20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: hasContent || section.inScope || section.risks || section.techStack ? '14px' : 0 }}>
                      <div style={{ width: '24px', height: '24px', flexShrink: 0, background: hasContent ? accent : 'transparent', border: hasContent ? 'none' : `1px solid ${colors.border}`, color: hasContent ? '#fff' : colors.textMuted, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                        {idx + 1}
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: hasContent ? colors.text : colors.textMuted, margin: 0, flex: 1 }}>
                        {section.heading}
                      </h3>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                      {isActive && (
                        <span style={{ fontSize: '10px', fontWeight: 800, color: accent, background: accent + '18', padding: '2px 7px', borderRadius: '10px' }}>AKTİF</span>
                      )}
                    </div>

                    {hasContent ? (
                      <Prose>{section.content}</Prose>
                    ) : (
                      <p style={{ fontSize: '12.5px', color: colors.textMuted, fontStyle: 'italic', margin: 0 }}>
                        Henüz doldurulmadı.
                      </p>
                    )}

                    {/* MVP Kapsamı — in/out-of-scope kartları */}
                    {(section.inScope?.length || section.outOfScope?.length) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <div style={{ border: '1px solid #10b98144', background: '#10b9810a', padding: '16px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14} /> IN-SCOPE (Eforlu)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(section.inScope ?? []).map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ background: effortColor(item.effort) + '22', color: effortColor(item.effort), border: `1px solid ${effortColor(item.effort)}55`, width: '22px', height: '22px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {item.effort || 'M'}
                                </span>
                                <span style={{ fontSize: '12.5px', color: colors.text, lineHeight: 1.45 }}>{item.feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ border: '1px solid #ef444444', background: '#ef44440a', padding: '16px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertTriangle size={14} /> OUT-OF-SCOPE
                          </div>
                          <ul style={{ fontSize: '12.5px', color: colors.text, paddingLeft: '16px', lineHeight: 1.7, margin: 0 }}>
                            {(section.outOfScope ?? []).map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Teknik Değerlendirmeler — tech stack chip'leri */}
                    {!!section.techStack?.length && (
                      <div style={{ marginTop: '16px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: colors.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers size={14} color={accent} /> ÖNERİLEN TECH STACK
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {section.techStack.map((tech, i) => (
                            <span key={i} style={{ background: isDark ? '#27272a' : '#e2e8f0', color: colors.text, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: `1px solid ${colors.border}` }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Riskler — severity rozetleri */}
                    {!!section.risks?.length && (
                      <div style={{ marginTop: '16px', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: colors.text, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ServerCrash size={14} color="#ef4444" /> RİSK KAYDI
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {section.risks.map((risk, i) => {
                            const rc = severityColor(risk.severity)
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <span style={{ background: rc.bg, color: rc.text, padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, marginTop: '2px', flexShrink: 0 }}>
                                  {(risk.severity || 'Low').toUpperCase()}
                                </span>
                                <span style={{ fontSize: '12.5px', color: colors.text, lineHeight: 1.45 }}>{risk.description}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
