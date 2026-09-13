import { NextRequest, NextResponse } from 'next/server'
import { guard } from '@/lib/api-guard'
import { streamGroq, captureStream, GroqError } from '@/lib/groq'
import { saveHistoryServer } from '@/lib/history-server'

export async function POST(req: NextRequest) {
  const gate = await guard('requirement')
  if (gate.error) return gate.error

  try {
    const { idea, lang = 'tr' } = await req.json()

    if (!idea || typeof idea !== 'string' || idea.trim() === '') {
      return NextResponse.json({ error: 'Fikir alanı boş olamaz.' }, { status: 400 })
    }

    const langMap: Record<string, string> = {
      tr: 'Turkish',
      en: 'English',
      de: 'German',
    }
    const language = langMap[lang] || 'Turkish'

    // 1. SYSTEM PROMPT: Modelin iş analisti kimliğini keskinleştiriyoruz ve kısırdöngü üretmesini yasaklıyoruz.
    const systemPrompt = `You are a Senior Enterprise Business Analyst certified in IIBA BABOK v3 (Business Analysis Body of Knowledge) and specialized in Agile/Scrum methodologies.
Your objective is to transform raw, short business ideas into an enterprise-grade, development-ready Product Requirement Document (PRD).

CRITICAL ANTI-TAUTOLOGY & REALISM RULES:
1. DO NOT use circular or repetitive definitions (e.g., avoid logical loops like "the system administrator must configure settings so that users can use the settings").
2. If an administrative configuration or system behavior is mentioned, you MUST detail the exact mechanism, technical criteria, or rule applied (e.g., specific lockout times, status changes, permission roles).
3. Avoid vague or subjective terms (e.g., "fast", "user-friendly", "secure enough"). Use deterministic, measurable, and highly technical software engineering terms.
4. Extrapolate missing requirements logically based on enterprise best practices. Do not just repeat the user's brief input over and over.

CRITICAL ENCODING & LANGUAGE RULE:
The entire generated document MUST be written in ${language}. Ensure proper character encoding. Translate all Markdown section headers into ${language} as well.`

    // 2. USER PROMPT: Yapay zekayı 4 adet hikaye üretmeye zorlayan ve mimariyi derinleştiren ultra detaylı şablon.
    const userPrompt = `Please analyze the following raw business idea and generate a comprehensive, enterprise-grade, and development-ready requirement document by strictly following the structured Markdown template below.

Idea to analyze: "${idea}"

CRITICAL REQUIREMENTS FOR THE AI GENERATOR:
1. You MUST generate exactly 4 distinct and fully detailed User Stories (1 Core Happy Path, 1 Alternative Path, 1 Security/Edge-Case Path, 1 Admin/Audit/Reporting Path). Do not merge or skip any.
2. Under "Business Rules", you must provide specific, bulleted business logic for each new sub-heading.
3. In the "Data Dictionary" section, expand the markdown table to include at least 5-6 logical database/API fields based on the context of the idea.
4. Do not use placeholder text like "(burayı doldurun)" or circular definitions. Generate actual, logical, implementation-ready specifications.

---
REQUIRED MARKDOWN TEMPLATE (Translate headers and entire content into ${language}):

# 📋 ÜRÜN GEREKSİNİM DÖKÜMANI (PRD)

## 1. 🎯 İş İhtiyacı ve Stratejik Amaç (Business Need & Objectives)
- **Mevcut Durum ve Problem (Current State):** (BABOK standartlarında mevcut sistem açığı, manuel süreç zorlukları veya güvenlik eksikliği tanımı)
- **İş Değeri ve Metrikler (Business Value & Metrics):** (Modül bittiğinde işletmeye sağlayacağı finansal/operasyonel avantaj ve başarının nasıl ölçüleceği [KPI])

## 2. 👥 Paydaş Analizi ve Personalar (Stakeholder & Persona Analysis)
- **Hedef Aktörler ve Rol Matrisi:** (Sistemi kullanacak spesifik roller, RBAC [Role-Based Access Control] yetki seviyeleri ve sistem üzerindeki sorumlulukları)

## 3. 🎯 Kullanıcı Hikayeleri ve Kabul Kriterleri (User Stories & Acceptance Criteria)
*(QA ve Dev ekiplerinin doğrudan test otomasyonuna bağlayabileceği Gherkin Syntax [Given-When-Then] formatında yazılmalıdır.)*

### 🔹 User Story 1: (Ana Kullanıcı Akışı - Core Happy Path)
- **Açıklama:** Bir [Spesifik Rol] olarak, [Net Bir Aksiyon] gerçekleştirmek istiyorum, böylece [Somut Bir Değer/Fayda] sağlayacağım.
  - **Kabul Kriteri 1.1 (Pozitif Senaryo):** **Given** [Doğru Ön Koşul], **When** [Tetikleyici Aksiyon], **Then** [Sistemin vereceği kararlı çıktı yardımıyla başarılı yönlendirme].
  - **Kabul Kriteri 1.2 (Alternatif Akış):** **Given** [Kullanıcı aksiyonu yarıda bıraktığında], **When** [Geri dönüldüğünde], **Then** [Sistemin veriyi koruma biçimi].

### 🔹 User Story 2: (Alternatif / İkincil Kullanıcı Akışı - Alternative Path)
- **Açıklama:** Bir [Spesifik Rol] olarak, [Farklı Bir Yöntemle Aksiyon] gerçekleştirmek istiyorum, böylece [Alternatif Fayda] sağlayacağım.
  - **Kabul Kriteri 2.1 (Pozitif Senaryo):** **Given** [Ön Koşul], **When** [Alternatif Aksiyon tetiklendiğinde], **Then** [Sistemin çıktısı].
  - **Kabul Kriteri 2.2 (Sistem Kesintisi/İptal):** **Given** [İşlem sırasında iptal istendiğinde], **When** [İptal tıklandığında], **Then** [Sistemin rollback davranışı].

### 🔹 User Story 3: (Hata, Güvenlik ve Uç Senaryo Akışı - Edge-Case & Security Path)
- **Açıklama:** Bir [Sistem/Kullanıcı] olarak, [Kötü Niyetli Girişim / Geçersiz Veri] durumunda sistem güvenliğinin korunmasını istiyorum, böylece [Sistem Manipülasyonu/Veri Sızıntısı] engellenir.
  - **Kabul Kriteri 3.1 (Negatif Senaryo - Validasyon):** **Given** [Geçersiz/Zararlı Girdi], **When** [Gönder butonuna basıldığında], **Then** [Sistemin üreteceği spesifik hata kodu ve bloklama].
  - **Kabul Kriteri 3.2 (Sınır Değer / Limit Aşımı):** **Given** [Maksimum limit sınırına gelindiğinde], **When** [Ekstra istek atıldığında], **Then** [Sistemin rate-limit veya uyarı davranışı].

### 🔹 User Story 4: (Yönetici, Raporlama ve Denetim Akışı - Admin, Audit & Reporting Path)
- **Açıklama:** Bir [Sistem Yöneticisi / Denetçi] olarak, [Gerçekleşen İşlemlerin Loglarını/Raporlarını] izlemek istiyorum, böylece [Sistem İzlenebilirliği ve Regülasyon Uyumluluğu] sağlanır.
  - **Kabul Kriteri 4.1 (Audit Log Akışı):** **Given** [Kullanıcılar işlem gerçekleştirdiğinde], **When** [Arka planda log tetiklendiğinde], **Then** [Veri tabanına kaydedilecek log parametreleri (IP, Zaman, Aktör ID)].
  - **Kabul Kriteri 4.2 (Yönetici Paneli Görünümü):** **Given** [Admin paneline giriş yapıldığında], **When** [Filtreleme uygulandığında], **Then** [Listelenecek tarihsel veriler].

## 4. 🛑 İş Kuralları ve Doğrulama Kriterleri (Business Rules & Validations)
### 4.1. Veri Giriş ve Validasyon Kuralları (Data Input Rules)
- (Form alanlarının tip, karakter limiti, zorunluluk ve regex maskeleme kuralları)
### 4.2. Durum ve Statü Geçiş Matrisi (State/Status Lifecycle)
- (Nesnenin/İşlemin yaşam döngüsü boyunca alacağı statüler. Örn: Draft -> Pending -> Approved -> Rejected statü geçiş mantığı)
### 4.3. Hata Yönetimi ve Kullanıcı Mesajlaşma Standartları (Error Handling)
- (Sistem hata verdiğinde kullanıcıya gösterilecek jenerik/spesifik mesaj standartları ve loglama politikası)

## 5. 🗄️ Veri Sözlüğü ve Alan Sözleşmesi (Data Dictionary & API Schema Hints)
*(Bu özelliğin hayata geçmesi için DB ve API katmanında taşınacak zorunlu teknik şema)*
| Alan Adı (Field) | Veri Tipi (Type) | Zorunlu mu? (Nullability) | Açıklama / Teknik Kısıt (Constraints) |
| :--- | :--- | :--- | :--- |
| \`id\` | UUID | Not Null | Primary Key - Benzersiz kayıt ID'si |
| \`status\` | ENUM / String | Not Null | Mevcut kayıt statüsü (Örn: ACTIVE, PASSIVE, PENDING) |
| \`created_at\` | TIMESTAMP | Not Null | Kaydın oluşturulma zaman damgası (Default: NOW) |
| \`updated_at\` | TIMESTAMP | Nullable | Kaydın son güncellenme zaman damgası |
| \`actor_id\` | UUID | Not Null | İşlemi gerçekleştiren kullanıcının yabancıl anahtarı (FK) |
| (Fikrin bağlamına göre senaryoya uygun en az 2 adet daha spesifik teknik veri alanı ekleyin) | | | |

## 6. ⚙️ Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements - NFR)
### 6.1. Güvenlik ve Regülasyon (Security & Compliance)
- (Şifreleme standartları [AES-256, TLS 1.3], KVKK/GDPR uyumluluk kısıtları, OWASP Top 10 korumaları)
### 6.2. Performans ve Ölçeklenebilirlik (Performance & Scalability)
- (API response time üst sınırı ms cinsinden, throughput kapasitesi, eşzamanlı aktif kullanıcı [concurrent user] eşikleri)
### 6.3. Sürdürülebilirlik ve İzlenebilirlik (Maintainability & Observability)
- (Loglama standartları, metrik takipleri ve hata yakalama [Sentry] gereksinimleri)

## 7. ⚠️ Varsayımlar ve Bağımlılıklar (Assumptions & Dependencies)
### 7.1. Mimari ve Altyapı Bağımlılıkları (Infrastructure Dependencies)
- (Kullanılacak servisler, veri tabanı mimari kabulleri veya kuyruk yönetim sistemleri [RabbitMQ/Kafka vb.])
### 7.2. Üçüncü Parti Entegrasyonlar ve API'ler (3rd Party Integrations)
- (Dış dünyadan çağrılacak servisler, SMS/E-posta gateway bağımlılıkları veya ödeme aracı kurum entegrasyonları)
### 7.3. Veri Göçü ve Ön Koşullar (Data Migration & Prerequisites)
- (Bu özelliğin çalışabilmesi için sistemde halihazırda göç ettirilmiş [migrated] veya tanımlanmış olması gereken statik veriler)`

    const stream = await streamGroq({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.15,
      // 7 bölümlük PRD + 4 User Story ölçülen değeri ~4300 görünür token; pay bırakıldı.
      // (Düşünme payı lib/groq.ts içinde otomatik ekleniyor.)
      maxTokens: 6000,
    })
    // Akış bitince tam metni geçmişe kaydet.
    const captured = captureStream(stream, (full) => saveHistoryServer('Requirement', idea, full))
    return new Response(captured, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    if (error instanceof GroqError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Requirement error:', error)
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
