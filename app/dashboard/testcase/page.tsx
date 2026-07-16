'use client'

import { GeneratorTool } from '@/components/generator-tool'

export default function TestCasePage() {
  return (
    <GeneratorTool
      config={{
        title: 'Test Case Generator',
        desc: 'Gereksinimi yaz, AI test senaryolarını üretsin.',
        endpoint: '/api/testcase/generate',
        fields: [{ type: 'textarea', name: 'requirement', label: 'Gereksinim veya User Story', placeholder: 'Gereksinim yazın...', minHeight: 120 }],
        submitLabel: 'Test Senaryoları Üret',
        loadingLabel: 'AI üretiyor...',
        outputLabel: 'Test Senaryoları',
        output: 'text',
        buildBody: (v) => ({ requirement: v.requirement }),
      }}
    />
  )
}
