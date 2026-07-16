import {
  LayoutDashboard, BarChart3, FileText, Database, CheckSquare,
  TerminalSquare, Layout, UserCircle, AlertTriangle, Mic, GitMerge,
  Activity, Scale, Ticket, Briefcase, History,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Language } from './i18n'

// lucide sürüm tip ihracatına bağımlı kalmamak için minimal ikon tipi.
export type IconType = ComponentType<{
  size?: number
  strokeWidth?: number
  color?: string
}>

export type ModuleCategory = 'general' | 'uretim' | 'analiz' | 'yonetim' | 'other'

export interface ModuleDef {
  id: string
  href: string
  category: ModuleCategory
  icon: IconType
  badge?: string
  /** Sidebar / topbar / arama etiketi */
  title: Record<Language, string>
  /** Dashboard kartı başlığı (yoksa title kullanılır) */
  cardTitle?: Record<Language, string>
  /** Dashboard kartı açıklaması */
  desc?: Record<Language, string>
  /** Bu rotaya eşlenen, history'de saklanan modül adları (API route'larıyla birebir) */
  historyLabels?: string[]
}

/**
 * TEK KAYNAK: tüm navigasyon, dashboard kartları, global arama ve history
 * yönlendirmesi bu listeden türetilir. Yeni bir araç eklemek için sadece
 * buraya bir kayıt eklemek yeterlidir.
 */
export const MODULES: ModuleDef[] = [
  // ---- GENEL ----
  {
    id: 'dashboard', href: '/dashboard', category: 'general', icon: LayoutDashboard,
    title: { tr: 'Dashboard', en: 'Dashboard', de: 'Dashboard' },
  },
  {
    id: 'analytics', href: '/dashboard/analytics', category: 'general', icon: BarChart3,
    title: { tr: 'İstatistikler', en: 'Analytics', de: 'Statistiken' },
  },

  // ---- ÜRETİM ----
  {
    id: 'req', href: '/dashboard/requirement', category: 'uretim', icon: FileText, badge: 'AI',
    title: { tr: 'Requirement', en: 'Requirement', de: 'Anforderung' },
    cardTitle: { tr: 'Requirement Generator', en: 'Requirement Generator', de: 'Anforderungsgenerator' },
    desc: {
      tr: 'Fikirden otomatik gereksinim belgesi üret',
      en: 'Generate a requirement document from an idea',
      de: 'Erzeuge ein Anforderungsdokument aus einer Idee',
    },
    historyLabels: ['Requirement'],
  },
  {
    id: 'sql', href: '/dashboard/sql', category: 'uretim', icon: Database, badge: 'Oracle',
    title: { tr: 'SQL Generator', en: 'SQL Generator', de: 'SQL Generator' },
    desc: {
      tr: 'Doğal dille Oracle SQL sorgusu yaz',
      en: 'Write Oracle SQL queries in plain language',
      de: 'Schreibe Oracle-SQL-Abfragen in natürlicher Sprache',
    },
    historyLabels: ['SQL Generator'],
  },
  {
    id: 'test', href: '/dashboard/testcase', category: 'uretim', icon: CheckSquare, badge: 'QA',
    title: { tr: 'Test Case', en: 'Test Case', de: 'Testfall' },
    cardTitle: { tr: 'Test Case Generator', en: 'Test Case Generator', de: 'Testfall-Generator' },
    desc: {
      tr: 'Gereksinimden test senaryosu üret',
      en: 'Generate test scenarios from requirements',
      de: 'Erzeuge Testszenarien aus Anforderungen',
    },
    historyLabels: ['Test Case'],
  },
  {
    id: 'bdd', href: '/dashboard/bdd', category: 'uretim', icon: TerminalSquare, badge: 'Gherkin',
    title: { tr: 'BDD Studio', en: 'BDD Studio', de: 'BDD Studio' },
    desc: {
      tr: 'Gereksinimden Gherkin senaryoları üret',
      en: 'Generate Gherkin scenarios from requirements',
      de: 'Erzeuge Gherkin-Szenarien aus Anforderungen',
    },
    historyLabels: ['BDD Studio'],
  },
  {
    id: 'wireframe', href: '/dashboard/wireframe', category: 'uretim', icon: Layout, badge: 'UI/UX',
    title: { tr: 'Wireframe & Prototip', en: 'Wireframe', de: 'Wireframe' },
    cardTitle: { tr: 'Wireframe & Prototip', en: 'Wireframe & Prototype', de: 'Wireframe & Prototyp' },
    desc: {
      tr: 'Gereksinimden otomatik ekran taslağı üret',
      en: 'Generate screen mockups from requirements',
      de: 'Erzeuge Screen-Entwürfe aus Anforderungen',
    },
    historyLabels: ['Wireframe'],
  },
  {
    id: 'persona', href: '/dashboard/persona', category: 'uretim', icon: UserCircle, badge: 'UX/BA',
    title: { tr: 'Persona Generator', en: 'Persona', de: 'Persona' },
    cardTitle: { tr: 'Persona Generator', en: 'Persona Generator', de: 'Persona-Generator' },
    desc: {
      tr: 'Hedef kitle personaları ve UX tavsiyeleri üret',
      en: 'Generate target personas and UX advice',
      de: 'Erzeuge Zielpersonas und UX-Empfehlungen',
    },
    historyLabels: ['Persona'],
  },

  // ---- ANALİZ ----
  {
    id: 'atlas', href: '/dashboard/bmad-studio', category: 'analiz', icon: TerminalSquare, badge: 'Architect',
    title: { tr: 'Atlas Studio', en: 'Atlas Studio', de: 'Atlas Studio' },
    desc: {
      tr: 'BMAD standartlarında mimari ve kapsam oluştur',
      en: 'Build architecture and scope in BMAD standards',
      de: 'Erstelle Architektur und Umfang nach BMAD-Standards',
    },
  },
  {
    id: 'risk', href: '/dashboard/risk', category: 'analiz', icon: AlertTriangle, badge: 'PM',
    title: { tr: 'Risk Analyzer', en: 'Risk Analyzer', de: 'Risikoanalyse' },
    desc: {
      tr: 'Proje risklerini analiz et',
      en: 'Analyze project risks',
      de: 'Projektrisiken analysieren',
    },
    historyLabels: ['Risk Analyzer'],
  },
  {
    id: 'meeting', href: '/dashboard/meeting', category: 'analiz', icon: Mic, badge: 'NLP',
    title: { tr: 'Meeting Analyzer', en: 'Meeting Analyzer', de: 'Meeting Analyse' },
    desc: {
      tr: 'Toplantı notlarından aksiyon çıkar',
      en: 'Extract action items from meeting notes',
      de: 'Aktionspunkte aus Meeting-Notizen extrahieren',
    },
    historyLabels: ['Meeting Analyzer'],
  },
  {
    id: 'flowchart', href: '/dashboard/flowchart', category: 'analiz', icon: GitMerge, badge: 'QA',
    title: { tr: 'Flowchart', en: 'Flowchart', de: 'Flussdiagramm' },
    cardTitle: { tr: 'Flowchart / Sequence', en: 'Flowchart / Sequence', de: 'Flussdiagramm / Sequenz' },
    desc: {
      tr: 'Gereksinimden akış diyagramı üret',
      en: 'Generate flow diagrams from requirements',
      de: 'Erzeuge Flussdiagramme aus Anforderungen',
    },
    historyLabels: ['Flowchart'],
  },
  {
    id: 'impact', href: '/dashboard/impact', category: 'analiz', icon: Activity, badge: 'QA',
    title: { tr: 'Impact Analyzer', en: 'Impact Analyzer', de: 'Impact Analyse' },
    desc: {
      tr: 'Değişiklik etki analizi yap',
      en: 'Run change impact analysis',
      de: 'Führe Änderungs-Impact-Analyse durch',
    },
    historyLabels: ['Impact Analyzer'],
  },
  {
    id: 'prioritization', href: '/dashboard/prioritization', category: 'analiz', icon: Scale, badge: 'PO/PM',
    title: { tr: 'Prioritization Coach', en: 'Prioritization', de: 'Priorisierung' },
    cardTitle: { tr: 'Prioritization Coach', en: 'Prioritization Coach', de: 'Priorisierungs-Coach' },
    desc: {
      tr: 'Gereksinimleri iş hedefine göre akıllıca önceliklendir',
      en: 'Prioritize requirements smartly by business goals',
      de: 'Priorisiere Anforderungen nach Geschäftszielen',
    },
    historyLabels: ['Prioritization'],
  },

  // ---- YÖNETİM & AGILE ----
  {
    id: 'jira', href: '/dashboard/jira-generator', category: 'yonetim', icon: Ticket, badge: 'Agile',
    title: { tr: 'Jira Ticket Üretici', en: 'Jira Generator', de: 'Jira Generator' },
    cardTitle: { tr: 'Jira Ticket Üretici', en: 'Jira Issue Generator', de: 'Jira Issue Generator' },
    desc: {
      tr: 'Ham talepleri teknik Jira biletlerine dönüştür',
      en: 'Turn raw requests into developer-ready Jira issues',
      de: 'Wandle Rohanfragen in Jira-Tickets um',
    },
    historyLabels: ['Jira Issue Generator'],
  },
  {
    id: 'pmi', href: '/dashboard/pmi-planner', category: 'yonetim', icon: Briefcase, badge: 'PMP',
    title: { tr: 'Proje Yönetimi', en: 'Project Management', de: 'Projektmanagement' },
    cardTitle: { tr: 'PMI Project Planner', en: 'PMI Project Planner', de: 'PMI Projektplaner' },
    desc: {
      tr: 'PMI standartlarında profesyonel proje planı üret',
      en: 'Generate professional project plans in PMI standards',
      de: 'Erzeuge Projektpläne nach PMI-Standards',
    },
    historyLabels: ['PMI Project Planner'],
  },

  // ---- DİĞER ----
  {
    id: 'history', href: '/dashboard/history', category: 'other', icon: History,
    title: { tr: 'Geçmiş', en: 'History', de: 'Verlauf' },
  },
]

// --- Yardımcılar ---

export function modulesByCategory(category: ModuleCategory): ModuleDef[] {
  return MODULES.filter((m) => m.category === category)
}

export function moduleTitle(m: ModuleDef, lang: Language): string {
  return m.title[lang] || m.title.tr
}

export function moduleCardTitle(m: ModuleDef, lang: Language): string {
  return (m.cardTitle && (m.cardTitle[lang] || m.cardTitle.tr)) || moduleTitle(m, lang)
}

export function moduleDesc(m: ModuleDef, lang: Language): string {
  return (m.desc && (m.desc[lang] || m.desc.tr)) || ''
}

/** history'de saklanan modül adı → dashboard rotası eşlemesi (tek kaynaktan) */
export const MODULE_ROUTES: Record<string, string> = MODULES.reduce((acc, m) => {
  m.historyLabels?.forEach((label) => {
    acc[label] = m.href
  })
  return acc
}, {} as Record<string, string>)
