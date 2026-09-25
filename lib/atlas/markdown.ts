/**
 * Atlas dokümanı → Markdown. Hem `doc-out` indirmesi, hem panel "Kopyala" butonu,
 * hem de LLM'e gönderilen doküman bağlamı bu tek kaynaktan üretilir.
 */

import type { AtlasDoc, AtlasSection } from './types'

/** Bölümün yapısal alanlarını (varsa) markdown listelerine çevirir. */
function structuredBlocks(section: AtlasSection): string[] {
  const blocks: string[] = []

  if (section.inScope?.length) {
    blocks.push(
      '**IN-SCOPE**\n' + section.inScope.map((i) => `- [${i.effort || 'M'}] ${i.feature}`).join('\n')
    )
  }
  if (section.outOfScope?.length) {
    blocks.push('**OUT-OF-SCOPE**\n' + section.outOfScope.map((i) => `- ${i}`).join('\n'))
  }
  if (section.techStack?.length) {
    blocks.push('**Tech Stack:** ' + section.techStack.join(', '))
  }
  if (section.risks?.length) {
    blocks.push(
      '**Riskler**\n' +
        section.risks.map((r) => `- [${(r.severity || 'Low').toUpperCase()}] ${r.description}`).join('\n')
    )
  }

  return blocks
}

/** Tek bölümü `## N. Başlık` biçiminde markdown'a çevirir. */
export function sectionToMarkdown(section: AtlasSection, index: number): string {
  const parts = [`## ${index + 1}. ${section.heading}`]
  const body = section.content.trim()
  if (body) parts.push(body)
  parts.push(...structuredBlocks(section))
  if (parts.length === 1) parts.push('_(Henüz doldurulmadı)_')
  return parts.join('\n\n')
}

export function docToMarkdown(doc: AtlasDoc): string {
  const body = doc.sections.map((s, i) => sectionToMarkdown(s, i)).join('\n\n')
  return `# ${doc.title}\n\n${body}\n\n---\n*BAI Platform — Atlas Studio (BMAD-METHOD™)*\n`
}

/** Dosya adı için güvenli slug. Türkçe karakterleri de sadeleştirir. */
export function docFileName(doc: AtlasDoc): string {
  const map: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  }
  const slug = doc.title
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'atlas-dokuman'}-${doc.type}.md`
}
