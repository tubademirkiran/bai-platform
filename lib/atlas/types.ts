/**
 * Atlas Studio — BMAD-METHOD™ veri modeli.
 *
 * Tasarım kararı: akış kontrolü (hangi bölümdeyiz, menü açık mı, "9" ne demek)
 * TAMAMEN istemcide deterministik olarak yürütülür. LLM yalnızca içerik üretir ve
 * `{ reply, docUpdate }` döner; oturum fazını değiştiremez.
 */

/** Atlas'ın üretebildiği doküman tipleri. Her biri sağ panelde ayrı sekme. */
export type DocType = 'brief' | 'brainstorm' | 'competitor' | 'market' | 'research-prompt'

export type SectionStatus = 'empty' | 'draft' | 'refined'

export type Effort = 'S' | 'M' | 'L' | 'XL'
export type Severity = 'High' | 'Medium' | 'Low'

export interface ScopeItem {
  feature: string
  effort: Effort
}

export interface RiskItem {
  description: string
  severity: Severity
}

/**
 * Doküman bölümü. `content` markdown'dır ve her bölümde bulunur.
 * Yapısal alanlar yalnızca ilgili bölümlerde dolar ve zengin render için kullanılır:
 * mvp-scope → inScope/outOfScope, tech-considerations → techStack, risks → risks.
 */
export interface AtlasSection {
  id: string
  heading: string
  content: string
  status: SectionStatus
  inScope?: ScopeItem[]
  outOfScope?: string[]
  risks?: RiskItem[]
  techStack?: string[]
}

export interface AtlasDoc {
  type: DocType
  title: string
  sections: AtlasSection[]
}

/** LLM'in dönebileceği kısmi bölüm yaması. `id` dışındaki her alan opsiyonel. */
export interface SectionPatch extends Partial<Omit<AtlasSection, 'id'>> {
  id: string
}

export interface DocUpdate {
  title?: string
  sections?: SectionPatch[]
}

export interface AtlasResponse {
  reply: string
  docUpdate?: DocUpdate
}

/** İstemci faz makinesinin durumları. */
export type Phase =
  /** Komut bekleniyor. */
  | 'idle'
  /** create-project-brief sonrası: 1 Interactive / 2 YOLO seçimi bekleniyor. */
  | 'awaiting-mode'
  /** Mod seçildi: kullanıcının projeyi anlatması bekleniyor. */
  | 'awaiting-brief-input'
  /** Interactive brief: aktif bölüm taslağı hazır, elicitation menüsü açık. */
  | 'section-draft'
  /** brainstorm: 3 kurulum sorusu soruldu, kullanıcı cevabı bekleniyor. */
  | 'brainstorm-setup'
  /** *elicit: advanced elicitation menüsü açık. */
  | 'advanced-elicit'
  /** Aktif doküman tamamlandı. */
  | 'complete'
  /** Personadan çıkıldı. */
  | 'exited'

export interface AtlasSession {
  phase: Phase
  /** Sağ panelde görüntülenen / üzerinde çalışılan doküman. */
  docType: DocType
  /** Interactive brief akışında aktif bölümün BRIEF_SECTIONS içindeki indeksi. */
  currentSectionIndex: number
  /** YOLO modu açıksa create-project-brief mod sorusunu atlar. */
  yolo: boolean
  /** brainstorm / research-prompt komutlarına verilen {topic} argümanı. */
  topic: string | null
}

/**
 * Route'a ne yapması gerektiğini söyleyen ayrık komut. Her kind kendi talimat
 * bloğunu ve kendi token bütçesini seçer (bkz. lib/atlas/prompts.ts).
 */
export type AtlasAction =
  /** Brief'in tek bir bölümünü ilk kez yaz. */
  | { kind: 'draft-section'; sectionId: string }
  /** Mevcut bölümü seçilen elicitation seçeneğiyle (0-8) rafine et. */
  | { kind: 'elicit-section'; sectionId: string; optionId: string }
  /** Tüm dokümana advanced elicitation seçeneği (0-8) uygula. */
  | { kind: 'advanced-elicit'; optionId: string }
  /** 11 bölümün tamamını tek seferde doldur. */
  | { kind: 'yolo-fill' }
  /** competitor / market / research-prompt dokümanını baştan üret. */
  | { kind: 'gen-doc'; docType: DocType }
  /** brainstorm: 3 kurulum sorusunu sor. */
  | { kind: 'brainstorm-setup' }
  /** brainstorm: kurulum cevaplarından fazlı planı üret. */
  | { kind: 'brainstorm-produce' }
  /** Komuta bağlanmayan serbest sohbet. */
  | { kind: 'chat' }

export type ActionKind = AtlasAction['kind']

export interface AtlasRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  session: AtlasSession
  doc: AtlasDoc
  action: AtlasAction
}
