/**
 * Atlas Studio sabitleri — BMAD-METHOD™ makalesindeki Mary akışının birebir karşılığı.
 * Komut numaraları, 11 bölümlük çerçeve ve iki elicitation menüsü makaleden alınmıştır.
 */

import type { AtlasDoc, AtlasSection, DocType } from './types'

// ---------------------------------------------------------------------------
// KOMUTLAR
// ---------------------------------------------------------------------------

export interface AtlasCommand {
  id: string
  /** Slash komut adı ({topic} argümanı hariç). */
  name: string
  /** Komut paletinde gösterilen tam imza. */
  signature: string
  desc: string
  /** true ise komut serbest metin argümanı ({topic}) alır. */
  takesTopic?: boolean
}

export const ATLAS_COMMANDS: AtlasCommand[] = [
  { id: '1', name: 'brainstorm', signature: 'brainstorm {topic}', desc: 'Yapılandırılmış beyin fırtınası oturumu.', takesTopic: true },
  { id: '2', name: 'create-competitor-analysis', signature: 'create-competitor-analysis', desc: 'Rekabet analizi belgesi oluştur.' },
  { id: '3', name: 'create-project-brief', signature: 'create-project-brief', desc: '11 bölümlük BMAD proje özeti oluştur.' },
  { id: '4', name: 'doc-out', signature: 'doc-out', desc: 'Aktif dokümanı .md olarak dışa aktar.' },
  { id: '5', name: 'elicit', signature: 'elicit', desc: 'İleri seviye gereksinim çıkarma ve kör nokta analizi.' },
  { id: '6', name: 'perform-market-research', signature: 'perform-market-research', desc: 'Pazar araştırması belgesi oluştur.' },
  { id: '7', name: 'research-prompt', signature: 'research-prompt {topic}', desc: 'Derin araştırma komutu (prompt) üret.', takesTopic: true },
  { id: '8', name: 'yolo', signature: 'yolo', desc: 'YOLO modunu aç/kapat (soru sormadan tek seferde üretir).' },
  { id: '9', name: 'exit', signature: 'exit', desc: 'Atlas personasından çık ve oturumu sıfırla.' },
]

export interface ResolvedCommand {
  command: AtlasCommand
  /** Komuttan sonra kalan serbest metin (varsa). */
  topic: string | null
}

/**
 * Kullanıcı girdisini komuta çözer. Makaledeki gibi hem çıplak numara ("3"),
 * hem slash ("/elicit"), hem de yıldız ("*brainstorm timeline") biçimlerini kabul eder.
 * Komut değilse null döner → serbest sohbet.
 */
export function resolveCommand(raw: string): ResolvedCommand | null {
  const input = raw.trim()
  if (!input) return null

  // Çıplak numara: "3" veya "3 bir konu"
  const numMatch = input.match(/^([1-9])(?:\s+([\s\S]*))?$/)
  if (numMatch) {
    const command = ATLAS_COMMANDS.find((c) => c.id === numMatch[1])
    if (command) return { command, topic: numMatch[2]?.trim() || null }
  }

  // /komut veya *komut
  const cmdMatch = input.match(/^[/*]([a-z-]+)(?:\s+([\s\S]*))?$/i)
  if (cmdMatch) {
    const name = cmdMatch[1].toLowerCase()
    const command = ATLAS_COMMANDS.find((c) => c.name === name)
    if (command) return { command, topic: cmdMatch[2]?.trim() || null }
  }

  // Öneksiz tam komut adı: "doc-out"
  const bare = ATLAS_COMMANDS.find((c) => c.name === input.toLowerCase())
  if (bare) return { command: bare, topic: null }

  return null
}

// ---------------------------------------------------------------------------
// MENÜLER
// ---------------------------------------------------------------------------

export interface ElicitOption {
  id: string
  label: string
  /** LLM'e verilen kesin talimat. 9 (ilerle) için boş. */
  instruction: string
}

/**
 * Proje özetinde HER BÖLÜM için sunulan kalite güvence menüsü (makale s.6).
 * 0-8 aynı bölümü rafine eder, 9 sonraki bölüme geçer.
 */
export const BRIEF_ELICIT_OPTIONS: ElicitOption[] = [
  {
    id: '0',
    label: 'Bölümü daha spesifik detaylarla genişlet',
    instruction: 'Bölümü somut sayılar, aktör adları, sistem bileşenleri ve ölçülebilir ifadelerle genişlet. Genel geçer cümleleri spesifik olanlarla değiştir.',
  },
  {
    id: '1',
    label: 'Benzer başarılı ürünlerle karşılaştırarak doğrula',
    instruction: 'Bu alanda başarılı olmuş 2-3 gerçek ürünü referans al. Onların bu bölümü nasıl ele aldığını kıyasla ve mevcut metindeki eksikleri bu kıyasa dayanarak gider.',
  },
  {
    id: '2',
    label: 'Varsayımları uç durumlarla stres testine sok',
    instruction: 'Bölümdeki örtük varsayımları açıkça listele, her birini kıran bir uç durum üret ve metni bu varsayımlar doğrulanmadan ilerlenmeyeceğini belirtecek şekilde düzelt.',
  },
  {
    id: '3',
    label: 'Alternatif çözüm yaklaşımlarını keşfet',
    instruction: 'Mevcut yaklaşıma en az 2 ciddi alternatif üret, her birinin ödünleşimini yaz ve neden mevcut yaklaşımın korunduğunu (ya da değiştirilmesi gerektiğini) gerekçelendir.',
  },
  {
    id: '4',
    label: 'Kaynak/kısıt ödünleşimlerini analiz et',
    instruction: 'Bütçe, takvim, ekip kapasitesi ve teknik borç açısından ödünleşimleri analiz et. Hangi kısıt gevşetilirse hangi kazanımın elde edileceğini somutla.',
  },
  {
    id: '5',
    label: 'Risk azaltma stratejileri üret',
    instruction: 'Bu bölümden doğan riskleri tespit et ve her biri için tetikleyici, etki ve somut azaltma aksiyonu içeren bir strateji yaz.',
  },
  {
    id: '6',
    label: 'Kapsamı MVP minimalist bakışıyla sorgula',
    instruction: 'Acımasız bir MVP minimalisti gibi davran. Bölümdeki her maddeyi "ilk sürümde gerçekten gerekli mi?" diye sorgula, gereksizleri kapsam dışına önerle.',
  },
  {
    id: '7',
    label: 'Yaratıcı özellik olasılıkları için beyin fırtınası yap',
    instruction: 'Bölümle ilgili alışılmışın dışında ama uygulanabilir 3-5 özellik fikri üret. Her birinin kullanıcıya sağladığı farklılaştırıcı değeri tek cümleyle yaz.',
  },
  {
    id: '8',
    label: 'Keşke [kaynak/yetenek/zaman] olsaydı...',
    instruction: 'Kısıtların kalktığı bir senaryo kur: sınırsız bütçe, ekip ve zaman olsaydı bu bölüm nasıl görünürdü? Sonra bu vizyondan bugüne uygulanabilir 1-2 fikri geri taşı.',
  },
  { id: '9', label: 'Sonraki bölüme geç', instruction: '' },
]

/**
 * *elicit komutunun tüm dokümana uygulanan ileri seviye menüsü (makale s.10).
 */
export const ADVANCED_ELICIT_OPTIONS: ElicitOption[] = [
  {
    id: '0',
    label: 'Eleştir ve Rafine Et',
    instruction: 'Dokümanı kıdemli bir baş iş analisti gözüyle acımasızca eleştir: belirsiz ifadeler, ölçülemeyen hedefler, çelişen bölümler. Sonra bulduğun her kusuru düzelterek ilgili bölümleri yeniden yaz.',
  },
  {
    id: '1',
    label: 'Potansiyel Riskleri Belirle',
    instruction: 'Dokümanın tamamını tarayarak henüz yazılmamış teknik, operasyonel, yasal (KVKK vb.) ve ticari riskleri çıkar. Riskler bölümünü bu bulgularla güncelle; her riske severity ver.',
  },
  {
    id: '2',
    label: 'Hedeflerle Uyumu Değerlendir',
    instruction: 'Her bölümün "Hedefler ve Başarı Metrikleri" bölümüyle uyumunu denetle. Hiçbir hedefe hizmet etmeyen kapsam maddelerini ve hiçbir kapsam maddesiyle desteklenmeyen hedefleri işaretle, dokümanı hizalayacak şekilde düzelt.',
  },
  {
    id: '3',
    label: 'Hedef Kitleye Göre Genişlet veya Daralt',
    instruction: 'Dokümanı iki okur için ayarla: yöneticiler için özet netliği, geliştiriciler için teknik kesinlik. Fazla teknik kalan yerleri sadeleştir, fazla muğlak kalan yerleri teknikleştir.',
  },
  {
    id: '4',
    label: 'Agile Takım Perspektifi Değişimi',
    instruction: 'Dokümanı bir Agile takımın gözünden oku (PO, Scrum Master, geliştirici, QA). Her rolün ilk sprint planlamasında soracağı cevapsız soruları bul ve dokümana cevaplarını ekle.',
  },
  {
    id: '5',
    label: 'Paydaş Yuvarlak Masası',
    instruction: 'Yatırımcı, teknik lider ve pazarlama yöneticisi olarak üç paydaşı simüle et. Her birinin dokümana dair itirazını kendi ağzından, tırnak içinde ve somut sorularla yaz. Sonra bu itirazlardan çıkan uygulanabilir aksiyonları listeleyip ilgili bölümleri güncelle.',
  },
  {
    id: '6',
    label: "Geçmişe Bakış: 'Keşke...' Değerlendirmesi",
    instruction: 'Projenin 12 ay sonra başarısız olduğu bir senaryo kur (pre-mortem). "Keşke şunu baştan düşünseydik" denecek 3 şeyi tespit et ve bu öngörüleri dokümana bugünden işle.',
  },
  {
    id: '7',
    label: 'Kırmızı Takım vs Mavi Takım',
    instruction: 'Kırmızı takım olarak dokümanın en zayıf üç noktasına saldır (teknik açık, yanlış varsayım, ulaşılamaz metrik). Mavi takım olarak her saldırıya somut bir savunma/önlem yaz. Sonucu dokümana yansıt.',
  },
  {
    id: '8',
    label: 'Düşünce Ağacı Derin Dalış',
    instruction: 'Dokümanın en kritik kararını seç. Üç farklı karar dalı aç, her dalın ikinci seviye sonuçlarını türet, dalları kıyasla ve en güçlü dalı gerekçesiyle dokümana işle.',
  },
  { id: '9', label: 'Devam et / Başka işlem yok', instruction: '' },
]

// ---------------------------------------------------------------------------
// DOKÜMAN ŞABLONLARI
// ---------------------------------------------------------------------------

export interface SectionDef {
  id: string
  heading: string
  /** LLM'e bu bölümde ne beklendiğini anlatan tek cümlelik yönerge. */
  hint: string
}

/** Makale s.5-6'daki 11 bölümlük proje özeti çerçevesi. */
export const BRIEF_SECTIONS: SectionDef[] = [
  { id: 'exec-summary', heading: 'Yönetici Özeti', hint: 'Projenin özünü tek paragrafta anlatan, ne yaptığı / kimin için / hangi sorunu çözdüğü net olan özet.' },
  { id: 'problem', heading: 'Problem Tanımı', hint: 'Sayısallaştırılmış acı noktaları ve pazar bağlamı. Sorunun bugün nasıl çözüldüğü ve bunun neden yetersiz olduğu.' },
  { id: 'solution', heading: 'Önerilen Çözüm', hint: 'Çözümün kendine özgü yaklaşımı ve farklılaştırıcıları; neden bu yaklaşımın işe yarayacağı.' },
  { id: 'target-users', heading: 'Hedef Kullanıcılar', hint: 'Somut ihtiyaçları, mevcut iş akışları ve engelleriyle birlikte detaylı kullanıcı personaları.' },
  { id: 'goals', heading: 'Hedefler ve Başarı Metrikleri', hint: 'SMART hedefler ve her birine bağlı ölçülebilir KPI (hedef değer ve ölçüm yöntemiyle).' },
  { id: 'mvp-scope', heading: 'MVP Kapsamı', hint: 'Net must-have / nice-to-have sınırı. inScope maddelerini efor (S/M/L/XL) ile, outOfScope maddelerini gerekçeleriyle ver.' },
  { id: 'post-mvp', heading: 'MVP Sonrası Vizyon', hint: 'Uzun vadeli yol haritası, genişleme fırsatları ve sonraki sürüm temaları.' },
  { id: 'tech-considerations', heading: 'Teknik Değerlendirmeler', hint: 'Mimari tercihler, entegrasyonlar ve teknik kısıtlar. techStack alanını somut teknoloji adlarıyla doldur.' },
  { id: 'constraints', heading: 'Kısıtlar ve Varsayımlar', hint: 'Bütçe, takvim, ekip ve mevzuat kısıtları; projenin dayandığı doğrulanmamış varsayımlar.' },
  { id: 'risks', heading: 'Riskler ve Açık Sorular', hint: 'Proaktif risk tespiti ve cevaplanmamış sorular. risks alanını description + severity (High/Medium/Low) ile doldur.' },
  { id: 'appendices', heading: 'Ekler', hint: 'Destekleyici araştırma, referanslar, paydaş girdileri ve terimler sözlüğü.' },
]

const COMPETITOR_SECTIONS: SectionDef[] = [
  { id: 'market-overview', heading: 'Pazar Görünümü', hint: 'Rekabet ortamının genel yapısı, oyuncu kategorileri ve pazarın olgunluk seviyesi.' },
  { id: 'competitor-profiles', heading: 'Rakip Profilleri', hint: 'Her önemli rakip için konumlanma, hedef kitle, güçlü ve zayıf yönler.' },
  { id: 'feature-matrix', heading: 'Özellik Karşılaştırma Matrisi', hint: 'Markdown tablosu: satırlar özellikler, sütunlar rakipler. Var/yok/kısmi olarak işaretle.' },
  { id: 'pricing', heading: 'Fiyatlandırma Karşılaştırması', hint: 'Rakiplerin fiyat modelleri, katmanları ve ücretsiz sürüm sınırları.' },
  { id: 'swot', heading: 'SWOT Analizi', hint: 'Bizim ürünümüz için güçlü/zayıf yönler, fırsatlar ve tehditler.' },
  { id: 'positioning', heading: 'Konumlanma Fırsatları', hint: 'Rakiplerin boş bıraktığı alanlar ve önerilen farklılaştırma stratejisi.' },
]

const MARKET_SECTIONS: SectionDef[] = [
  { id: 'research-goals', heading: 'Araştırma Hedefleri', hint: 'Bu araştırmanın cevaplamayı amaçladığı temel iş soruları.' },
  { id: 'market-size', heading: 'Pazar Büyüklüğü (TAM / SAM / SOM)', hint: 'Toplam, erişilebilir ve elde edilebilir pazar tahminleri; hesaplama varsayımlarını açıkça yaz.' },
  { id: 'segments', heading: 'Müşteri Segmentleri', hint: 'Segmentler, her birinin büyüklüğü, ödeme istekliliği ve karar verici profili.' },
  { id: 'trends', heading: 'Trendler ve Sürücüler', hint: 'Pazarı büyüten/daraltan teknolojik, düzenleyici ve davranışsal eğilimler.' },
  { id: 'competition', heading: 'Rekabet Ortamı', hint: 'Pazar payı dağılımı ve rekabet yoğunluğu.' },
  { id: 'barriers', heading: 'Giriş Bariyerleri', hint: 'Sermaye, mevzuat, ağ etkisi ve teknoloji kaynaklı giriş engelleri.' },
  { id: 'recommendations', heading: 'Sonuç ve Öneriler', hint: 'Veriye dayalı net bir pazara giriş önerisi ve gerekçesi.' },
]

/** Makale s.9'daki derin araştırma komutu iskeleti. */
const RESEARCH_PROMPT_SECTIONS: SectionDef[] = [
  { id: 'objective', heading: 'Research Objective', hint: 'Araştırmanın neyi belirlemeyi amaçladığı; hangi kararı besleyeceği.' },
  { id: 'background', heading: 'Background Context', hint: 'Projenin bağlamı ve bu araştırmanın neden kritik olduğu.' },
  { id: 'questions', heading: 'Research Questions', hint: 'Primary Questions (Must Answer) ve Secondary Questions olarak iki alt başlık; numaralı, spesifik sorular.' },
  { id: 'deliverables', heading: 'Expected Deliverables', hint: 'Executive Summary, Detailed Analysis ve Supporting Materials başlıklarıyla beklenen çıktılar.' },
  { id: 'success', heading: 'Success Criteria', hint: 'Araştırmanın başarılı sayılması için karşılanması gereken net ölçüt.' },
]

/** brainstorm dokümanı dinamiktir; Atlas "Faz N" bölümlerini kendisi üretir. */
const BRAINSTORM_SECTIONS: SectionDef[] = [
  { id: 'session-context', heading: 'Oturum Bağlamı', hint: 'Beyin fırtınasının konusu, kısıtları ve odak kararı.' },
]

export const DOC_SECTION_DEFS: Record<DocType, SectionDef[]> = {
  brief: BRIEF_SECTIONS,
  brainstorm: BRAINSTORM_SECTIONS,
  competitor: COMPETITOR_SECTIONS,
  market: MARKET_SECTIONS,
  'research-prompt': RESEARCH_PROMPT_SECTIONS,
}

export const DOC_LABELS: Record<DocType, string> = {
  brief: 'Proje Özeti',
  brainstorm: 'Beyin Fırtınası',
  competitor: 'Rekabet Analizi',
  market: 'Pazar Araştırması',
  'research-prompt': 'Araştırma Komutu',
}

export const DOC_DEFAULT_TITLES: Record<DocType, string> = {
  brief: 'YENİ PROJE ÖZETİ',
  brainstorm: 'BEYİN FIRTINASI OTURUMU',
  competitor: 'REKABET ANALİZİ',
  market: 'PAZAR ARAŞTIRMASI',
  'research-prompt': 'DERİN ARAŞTIRMA KOMUTU',
}

/** Boş (status: 'empty') bölümlerle yeni bir doküman üretir. */
export function createDoc(type: DocType, title?: string): AtlasDoc {
  const sections: AtlasSection[] = DOC_SECTION_DEFS[type].map((def) => ({
    id: def.id,
    heading: def.heading,
    content: '',
    status: 'empty',
  }))
  return { type, title: title || DOC_DEFAULT_TITLES[type], sections }
}

export function createAllDocs(): Record<DocType, AtlasDoc> {
  return {
    brief: createDoc('brief'),
    brainstorm: createDoc('brainstorm'),
    competitor: createDoc('competitor'),
    market: createDoc('market'),
    'research-prompt': createDoc('research-prompt'),
  }
}

/** Bir dokümanda en az bir bölüm doldurulmuş mu? Sekme görünürlüğü için. */
export function isDocStarted(doc: AtlasDoc): boolean {
  return doc.sections.some((s) => s.status !== 'empty' && s.content.trim() !== '')
}
