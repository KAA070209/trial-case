import { Head } from '@inertiajs/react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const WA = '6285255499299'
const wa = (t: string) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`

const FLASH_MS = 720 * 60 * 1000
function flashDeadline() {
  let s = Number(localStorage.getItem('fb_flash_start') || 0)
  if (!s) { s = Date.now(); try { localStorage.setItem('fb_flash_start', String(s)) } catch {} }
  return s + FLASH_MS
}
function flashRemaining() { return typeof window > 'u' ? FLASH_MS : Math.max(0, flashDeadline() - Date.now()) }
function fmtTime(ms: number) { const t = Math.floor(ms / 1000); return `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor((t % 3600) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` }
function getMode(): 'tutor' | 'self' { try { return new URLSearchParams(window.location.search).get('mode') === 'tutor' ? 'tutor' : 'self' } catch { return 'self' } }

function css(raw: string): CSSProperties {
  const o: Record<string, string> = {}
  raw.split(';').forEach(p => { const i = p.indexOf(':'); if (i < 0) return; const k = p.slice(0, i).trim(); const v = p.slice(i + 1).trim(); if (!k) return; o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())] = v })
  return o as CSSProperties
}

const SCREENSHOTS = [
  { src: '/assets/toefl1.webp', score: '547' }, { src: '/assets/toefl2.webp', score: '543' },
  { src: '/assets/toefl3.webp', score: '563' }, { src: '/assets/toefl4.webp', score: '560' },
  { src: '/assets/toefl5.webp', score: '507' }, { src: '/assets/toefl6.webp', score: '513' },
  { src: '/assets/toefl7.webp', score: '537' }, { src: '/assets/toefl9.webp', score: '560' },
]
const SCREENSHOT_COUNT = SCREENSHOTS.length
const R_COUNT = 19
const reviewSrc = (i: number) => `/assets/Riview (${i + 1}).webp`

const EXIT_REASONS = ['Harganya masih terlalu mahal buatku', 'Belum yakin bisa mencapai target TOEFL-ku', 'Belum yakin program ini cocok untuk kebutuhanku', 'Masih membandingkan dengan program lain']
const EXIT_MSGS = ['Halo Admin Full Bright Indonesia. Saya mau konsultasi soal paket dan harga sebelum daftar.', 'Halo Admin Full Bright Indonesia. Saya mau konsultasi soal metode belajar dan hasil yang bisa dicapai sebelum daftar.', 'Halo Admin Full Bright Indonesia. Saya mau konsultasi apakah program ini cocok dengan kebutuhan saya sebelum daftar.', 'Halo Admin Full Bright Indonesia. Saya masih membandingkan dengan program lain, mau tanya-tanya dulu.']
const EXIT_CTA = ['Ada yang ingin ditanyakan soal harga atau paket?', 'Mau tahu apakah program ini cocok untuk target skor kamu?', 'Konsultasikan dulu apakah program ini cocok untukmu.', 'Masih membandingkan? Tanya tim kami tentang programnya.']

const FAQ_CATS = ['Belajar Mandiri (LMS)', 'Metode & Efektivitas', 'Dibimbing Tutor', 'Sertifikat & Legalitas', 'Pendaftaran & Pembayaran', 'Jaminan & Garansi'] as const
const FAQ_MAP: string[] = ['Belajar Mandiri (LMS)','Belajar Mandiri (LMS)','Belajar Mandiri (LMS)','Belajar Mandiri (LMS)','Belajar Mandiri (LMS)','Metode & Efektivitas','Metode & Efektivitas','Metode & Efektivitas','Metode & Efektivitas','Metode & Efektivitas','Dibimbing Tutor','Dibimbing Tutor','Dibimbing Tutor','Sertifikat & Legalitas','Sertifikat & Legalitas','Pendaftaran & Pembayaran','Jaminan & Garansi']
const FAQ = [
  { q: 'Kalau ambil paket Self-Study LMS, apa saja yang saya dapat?', a: 'Kamu dapat akses penuh ke LMS Full Bright: 60+ video materi Full Skills (Listening, Structure, Reading), materi terstruktur hari ke-1 sampai ke-15, 1.000+ nomor latihan soal beserta pembahasan, diagnostic test, simulasi dan post test full skills, serta grup WA diskusi. Semua bisa diakses kapan saja tanpa terikat jadwal kelas.' },
  { q: 'Bagaimana cara akses LMS setelah saya bayar?', a: 'Setelah pembayaran berhasil, kamu langsung menerima email berisi link dan akun untuk masuk ke platform LMS Full Bright. Akses berlaku 2 tahun dan bisa dibuka dari HP maupun laptop, kapan pun kamu punya waktu.' },
  { q: 'Saya belajar sendiri di LMS. Kalau bingung, bisa tanya ke siapa?', a: 'Kamu tetap tidak belajar sendirian. Setiap peserta LMS masuk ke grup WA diskusi, jadi kalau ada soal atau materi yang bikin bingung, kamu bisa langsung bertanya dan dibantu. Ini bedanya dengan belajar otodidak dari YouTube — di sana tidak ada yang menjawab kalau kamu stuck.' },
  { q: 'Apakah bisa dicoba dulu sebelum bayar?', a: 'Bisa. Tersedia free trial LMS dengan akses 1 modul agar kamu bisa merasakan sendiri kualitas video materi dan latihan soalnya sebelum memutuskan. Kalau cocok, tinggal lanjut ambil paketnya.' },
  { q: 'Apakah bisa belajar tanpa terikat jadwal karena saya sibuk?', a: 'Justru itu kelebihan paket belajar mandiri: tidak ada jam kelas yang harus dikejar. Semua materi tersedia di LMS 24/7 dan bisa diulang berapa kali pun. Banyak alumni kami karyawan, PNS aktif, dan mahasiswa tingkat akhir yang belajar di sela-sela kesibukan.' },
  { q: 'Apakah metode ini cocok untuk pemula yang grammar-nya sangat lemah?', a: 'Sangat cocok. Materi disusun dari level dasar dan berurutan hari ke-1 sampai ke-15, jadi kamu tidak perlu grammar sempurna untuk memulai. Fokusnya bukan menguasai semua tata bahasa Inggris, tapi mengenali pola soal yang benar-benar keluar di TOEFL ITP.' },
  { q: 'Kenapa belajar di sini beda dengan belajar sendiri dari buku dan YouTube?', a: 'Dua hal yang paling sering bikin belajar otodidak gagal: materinya tidak terstruktur dan tidak ada yang bisa ditanya kalau salah. Di Full Bright, materi sudah berurutan dan fokus ke pola soal TOEFL, setiap latihan ada pembahasannya, dan ada grup diskusi untuk bertanya.' },
  { q: 'Berapa kenaikan skor yang bisa saya harapkan?', a: 'Berdasarkan data alumni, peserta yang mengikuti materi secara konsisten dan mengerjakan semua bank soal rata-rata naik 80–100 poin. Yang paling banyak dirasakan alumni adalah jadi paham pola soal TOEFL, dan dari situ skornya ikut naik.' },
  { q: 'Apakah dijamin bisa mencapai skor 500?', a: 'Kami tidak menjanjikan skor 500 secara mutlak karena hasil tergantung konsistensi masing-masing peserta. Yang bisa kami jamin: metode yang sudah terbukti pada 45.000+ alumni, materi yang fokus dan terstruktur, serta pendampingan selama program.' },
  { q: 'Apakah ada batasan usia untuk mengikuti program ini?', a: 'Program terbuka untuk usia 17 hingga 45 tahun. Cocok untuk pelajar, mahasiswa, fresh graduate, maupun karyawan yang butuh skor TOEFL untuk studi, karir, atau beasiswa.' },
  { q: 'Apa bedanya paket Dibimbing Tutor dengan Self-Study LMS?', a: 'Semua materi LMS tetap kamu dapat. Tambahannya khusus di paket Dibimbing Tutor: LIVE ZOOM 15 hari bersama instruktur, rekaman ZOOM, dan sertifikat TOEFL Prediction. Cocok kalau kamu merasa lebih terbantu dengan penjelasan langsung dan tempo belajar yang dipandu.' },
  { q: 'Kapan jadwal LIVE ZOOM-nya dan apakah bisa dipilih?', a: 'Khusus paket Dibimbing Tutor. Tersedia 5 pilihan sesi harian:\n- Pagi (09.00 - 10.00 WIB)\n- Siang (13.00 - 14.00 WIB)\n- Sore (16.00 - 17.00 WIB)\n- Malam (19.00 - 20.00 WIB)\n- Malam (20.15 - 21.15 WIB)\n\nCatatan: Jika berhalangan hadir LIVE ZOOM, jangan khawatir — materi bisa diakses di rekaman ZOOM.' },
  { q: 'Kalau saya tidak bisa hadir LIVE ZOOM, bagaimana?', a: 'Khusus paket Dibimbing Tutor. Setiap sesi direkam dan rekamannya bisa diakses seumur hidup, jadi kamu tetap bisa mengejar materi kalau berhalangan hadir. Kelas hanya 60 menit per hari agar tetap muat di jadwal yang padat.' },
  { q: 'Apakah saya dapat sertifikat TOEFL?', a: 'Sertifikat TOEFL Prediction diberikan khusus untuk paket Dibimbing Tutor setelah mengikuti post test. Paket Self-Study LMS fokus pada materi dan latihan, tanpa sertifikat.' },
  { q: 'Apakah lembaganya resmi dan sertifikatnya valid?', a: 'Full Bright Indonesia adalah lembaga resmi dengan legalitas lengkap: SK Kemenkumham RI Nomor AHU-0055720-AH.0114 Tahun 2020, SK Izin Operasional LKP 503/20177/LKP/DPM-PTSP/8/2024, NPSN Nomor K9998700, dan bekerja sama dengan IIEF Jakarta. Sertifikat dapat digunakan untuk daftar kuliah S1/S2/S3, lamar kerja, seleksi CPNS, rekrutmen BUMN, ujian skripsi, kenaikan pangkat, dan pendaftaran beasiswa.' },
  { q: 'Bagaimana cara mendaftar dan metode pembayaran apa saja?', a: 'Klik tombol daftar, pilih paket yang sesuai, lalu selesaikan pembayaran. Setelah itu kamu langsung menerima email konfirmasi beserta akses LMS dan grup WhatsApp. Pembayaran bisa via transfer bank, GoPay, OVO, DANA, dan QRIS.' },
  { q: 'Apakah ada garansi kalau skor saya belum mencapai target?', a: 'Garansi mengulang sampai skor target tercapai berlaku khusus untuk Paket Bundling (Dibimbing Tutor). Jika sudah mengikuti program secara penuh dan konsisten tapi skor belum tercapai, kamu bisa claim garansi dan mengulang kelas di batch berikutnya.' },
]

const LMS_CARDS = [
  { num: '01', cat: 'Diagnostic Test', value: 'Rp 120.000', title: 'Tidak Lagi Bingung Harus Mulai dari Mana', desc: 'Kerjakan Diagnostic Test lebih dulu untuk mengetahui baseline skor TOEFL ITP kamu. Hasilnya menentukan materi mana yang perlu diprioritaskan.', tags: ['Baseline skor per section', 'Materi prioritas otomatis'], img: '/lms/lms-1.webp', alt: 'Tidak Lagi Bingung Harus Mulai dari Mana', order: 'normal' as const },
  { num: '02', cat: 'Materi & Roadmap', value: 'Rp 300.000', title: 'Materi Sudah Urut, Kamu Tinggal Mengikuti', desc: 'Materi Structure, Listening, dan Reading tersusun rapi dari Hari 1 sampai Hari 15, jadi kamu tidak perlu menyusun sendiri urutan belajarnya.', tags: ['60 video full skills', 'Urut Hari 1–15'], img: '/lms/lms-2.webp', alt: 'Materi Sudah Urut, Kamu Tinggal Mengikuti', order: 'reverse' as const },
  { num: '03', cat: 'AI Assistant', value: 'Rp 100.000', title: 'Kalau Bingung, Ada yang Langsung Menjawab', desc: 'Setiap video dilengkapi rangkuman materi dan AI Assistant yang siap menjelaskan ulang topik yang belum kamu pahami, tanpa perlu menunggu jadwal.', tags: ['Rangkuman tiap video', 'Tanya AI 24/7'], img: '/lms/lms-3.webp', alt: 'Kalau Bingung, Ada yang Langsung Menjawab', order: 'normal' as const },
  { num: '04', cat: 'Latihan Soal', value: 'Rp 150.000', title: 'Tahu Persis Bagian yang Belum Kamu Kuasai', desc: 'Setiap topik punya latihan soal dengan navigasi antar nomor dan progress tracker, jadi kamu tahu persis bagian mana yang belum dikuasai.', tags: ['Latihan per topik', 'Progress tracker'], img: '/lms/lms-4.webp', alt: 'Tahu Persis Bagian yang Belum Kamu Kuasai', order: 'reverse' as const },
  { num: '05', cat: 'Pembahasan Soal', value: 'Rp 100.000', title: 'Bukan Sekadar Kunci Jawaban, Tapi Penjelasannya', desc: 'Setiap soal latihan punya pembahasan lengkap — tidak hanya kunci jawaban, tapi alasan kenapa opsi itu benar dan opsi lain salah.', tags: ['Pembahasan per soal', 'Pahami kesalahan'], img: '/lms/lms-5.webp', alt: 'Bukan Sekadar Kunci Jawaban, Tapi Penjelasannya', order: 'normal' as const },
  { num: '06', cat: 'Simulasi', value: 'Rp 200.000', title: 'Uji Dirimu Sebelum Ujian Sesungguhnya', desc: 'Simulasi penuh memakai format TOEFL ITP resmi, lengkap dengan timer — supaya kamu tahu persis bagaimana rasanya mengerjakan soal dalam tekanan waktu.', tags: ['Format TOEFL ITP', 'Timer seperti ujian asli'], img: '/lms/lms-6.webp', alt: 'Uji Dirimu Sebelum Ujian Sesungguhnya', order: 'reverse' as const },
  { num: '07', cat: 'Post Test', value: 'Rp 135.000', title: 'Sekarang Kamu Bisa Melihat Seberapa Jauh Kemajuanmu', desc: 'Setelah semua materi selesai, Post Test mengukur skor akhirmu — supaya kamu punya gambaran nyata sebelum mengikuti ujian resmi.', tags: ['Full skills test', 'Skor prediksi akhir'], img: '/lms/lms-7.webp', alt: 'Sekarang Kamu Bisa Melihat Seberapa Jauh Kemajuanmu', order: 'normal' as const },
]

const TUTOR_STEPS = [
  { n: '01', t: 'Gabung & Pilih Jadwal', d: 'Daftar paket Dibimbing Tutor dan pilih sesi harian yang paling cocok. Kamu bisa mulai kapan saja.' },
  { n: '02', t: 'Live ZOOM Bersama Instruktur', d: 'Belajar langsung selama 60 menit/hari selama 15 hari berturut-turut. Materi langsung disampaikan oleh instruktur berpengalaman.' },
  { n: '03', t: 'Review & Review', d: 'Setiap sesi direkam. Kamu bisa mengulang materi kapan saja dari rekaman ZOOM dan konsultasikan lewat grup.' },
]

const REVIEWS_MARQUEE = Array.from({ length: R_COUNT * 3 }, (_, i) => ({ src: reviewSrc(i % R_COUNT) }))

const UNIVERSITY_CARDS = [
  { logo: '/assets/logos/ui.png', w: 180, h: 30, src: reviewSrc(0), score: '547', name: 'Rani', dept: 'Universitas Indonesia' },
  { logo: '/assets/logos/itb.png', w: 160, h: 30, src: reviewSrc(1), score: '543', name: 'Ayu', dept: 'Institut Teknologi Bandung' },
  { logo: '/assets/logos/ugm.webp', w: 150, h: 30, src: reviewSrc(2), score: '563', name: 'Widya', dept: 'Universitas Gadjah Mada' },
  { logo: '/assets/logos/ipb.png', w: 150, h: 30, src: reviewSrc(3), score: '560', name: 'Yohanes', dept: 'Institut Pertanian Bogor' },
  { logo: '/assets/logos/its.png', w: 130, h: 30, src: reviewSrc(4), score: '507', name: 'Uly', dept: 'Institut Teknologi Sepuluh Nopember' },
  { logo: '/assets/logos/undip.png', w: 170, h: 30, src: reviewSrc(5), score: '513', name: 'Nadia', dept: 'Universitas Diponegoro' },
]

const SELF_PEOPLE = [
  { src: '/assets/People%201.webp', alt: 'Andi', name: 'Andi', desc: 'Fresh graduate IPB, skor 547 → lulus CPNS' },
  { src: '/assets/People%202.webp', alt: 'Sari', name: 'Sari', desc: 'Karyawan BUMN, skor 513 → naik pangkat' },
  { src: '/assets/People%203.webp', alt: 'Rina', name: 'Rina', desc: 'Mahasiswa UI, skor 560 → beasiswa S2' },
]

const WAVE_SVG = '<svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width:100%;height:120px;display:block"><path d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z" fill="#fff"/></svg>'

const CHECK_SVG = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#D70808"/><path d="M9 14.5l3 3 7-7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const CROSS_SVG = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#e5e7eb"/><path d="M10 10l8 8M18 10l-8 8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>'

const PLAY_SVG = '<svg width="30" height="30" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5z"/></svg>'
const GOOGLE_SVG = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l5.8 4.3C13.9 15.4 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 6.1 29.2 4 24 4 16.4 4 9.8 8.5 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.3l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.6-3.4-11.3-8l-6 4.6C9.6 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1 3-3.1 5.5-5.9 7.1l6.2 5.2C39.4 37 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>'

const KEYFRAMES_CSS = `
@keyframes infiniteScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes fbFadeInUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fbSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes heroBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
`

const BASE_CSS = `
@layer base {
  body { margin: 0; font-family: 'Nunito', system-ui, sans-serif; }
  h1, h2, h3, h4, h5, h6, p, span, div, li, a, button, input, select, textarea, ul, ol, strong, b, em, i, label { font-family: 'Nunito', system-ui, sans-serif; }
  a { color: #D70808; }
  a:hover { color: #b30606; }
  section[id], div[id] { scroll-margin-top: 120px; }
}
`

function BannerTimer() {
  const [time, setTime] = useState('12:00:00')
  useEffect(() => { const tick = () => setTime(fmtTime(flashRemaining())); tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id) }, [])
  return <span className="[font-size:13px] [font-weight:900] [font-variant-numeric:tabular-nums] max-[500px]:[font-size:14px] [letter-spacing:0.04em]">{time}</span>
}

function ReviewCarousel({ onOpen }: { onOpen: (idx: number) => void }) {
  const [idx, setIdx] = useState(0)
  const prev = useCallback(() => setIdx(i => (i - 1 + R_COUNT) % R_COUNT), [])
  const next = useCallback(() => setIdx(i => (i + 1) % R_COUNT), [])
  useEffect(() => { const id = window.setInterval(() => setIdx(i => (i + 1) % R_COUNT), 3000); return () => window.clearInterval(id) }, [])

  const cardStyle = (dir: 'prev' | 'next'): CSSProperties => {
    const n = dir === 'prev' ? (idx - 1 + R_COUNT) % R_COUNT : (idx + 1) % R_COUNT
    const left = dir === 'prev' ? 'calc(50% - 260px)' : 'calc(50% + 100px)'
    return { position: 'absolute' as const, transition: 'all 0.6s ease', cursor: 'pointer', overflow: 'hidden', borderRadius: '16px',
      backgroundImage: `url('${reviewSrc(n)}')`, backgroundSize: 'cover', backgroundPosition: 'center',
      left, width: '160px', height: '210px', opacity: 0.5, zIndex: 1, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }
  }

  return (
    <Fragment>
      <div className="[display:flex] [align-items:center] [justify-content:center] [gap:8px] [margin-bottom:24px]">
        <span dangerouslySetInnerHTML={{ __html: GOOGLE_SVG }} />
        <span className="[font-size:14px] [font-weight:800] [color:#151515]">4.9</span>
        <span className="[color:#FBBF24] [font-size:16px]">★★★★★</span>
        <span className="[font-size:14px] [font-weight:400] [color:#6b7280]"><b>3.620</b> Google Reviews</span>
      </div>
      <div className="[position:relative] [display:flex] [align-items:center] [justify-content:center] [width:100%] [height:220px] [overflow:hidden]">
        <button onClick={prev} className="[position:absolute] [left:0] [z-index:3] [display:flex] [height:36px] [width:36px] [align-items:center] [justify-content:center] [border-radius:9999px] [border:1px_solid_#e5e7eb] [background:#fff] [box-shadow:0_4px_12px_rgba(0,0,0,0.12)] [color:#151515] [font-size:16px] [cursor:pointer]">‹</button>
        <div style={cardStyle('prev')} onClick={() => setIdx(i => (i - 1 + R_COUNT) % R_COUNT)} />
        <img
          src={reviewSrc(idx)}
          alt="Bukti skor TOEFL alumni Full Bright"
          loading="lazy"
          onClick={() => onOpen(idx)}
          className="[position:absolute] [left:50%] [transform:translateX(-50%)] [transition:all_0.3s_ease] [cursor:pointer] [height:210px] [width:auto] [max-width:340px] [border-radius:16px] [box-shadow:0_8px_28px_rgba(0,0,0,0.18)] [z-index:2] [object-fit:contain]"
        />
        <button onClick={next} className="[position:absolute] [right:0] [z-index:3] [display:flex] [height:36px] [width:36px] [align-items:center] [justify-content:center] [border-radius:9999px] [border:1px_solid_#e5e7eb] [background:#fff] [box-shadow:0_4px_12px_rgba(0,0,0,0.12)] [color:#151515] [font-size:16px] [cursor:pointer]">›</button>
      </div>
    </Fragment>
  )
}

export default function Landing() {
  const [mode, setMode] = useState<'self' | 'tutor'>(getMode)
  const [flashMs, setFlashMs] = useState(flashRemaining)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [faqCat, setFaqCat] = useState<string | null>(null)
  const [showReturn, setShowReturn] = useState(false)
  const [showWa, setShowWa] = useState(false)
  const [lmsPaused, setLmsPaused] = useState(true)
  const [testiPaused, setTestiPaused] = useState(true)
  const [photoIdx, setPhotoIdx] = useState<number | null>(null)
  const [reviewIdx, setReviewIdx] = useState<number | null>(null)
  const [exitIdx, setExitIdx] = useState<number | null>(null)
  const [bannerHeight, setBannerHeight] = useState(38)

  const bannerRef = useRef<HTMLAnchorElement>(null)
  const lmsRef = useRef<HTMLVideoElement>(null)
  const testiRef = useRef<HTMLVideoElement>(null)

  // Flash timer
  useEffect(() => { const id = window.setInterval(() => setFlashMs(flashRemaining()), 1000); return () => window.clearInterval(id) }, [])

  // Header scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const measure = () => setBannerHeight(bannerRef.current ? Math.round(bannerRef.current.getBoundingClientRect().height) : 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [flashMs > 0])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (photoIdx !== null) { if (e.key === 'ArrowLeft') setPhotoIdx(i => i !== null ? (i - 1 + SCREENSHOT_COUNT) % SCREENSHOT_COUNT : null); else if (e.key === 'ArrowRight') setPhotoIdx(i => i !== null ? (i + 1) % SCREENSHOT_COUNT : null); else if (e.key === 'Escape') setPhotoIdx(null) }
      if (reviewIdx !== null) { if (e.key === 'ArrowLeft') setReviewIdx(i => i !== null ? (i - 1 + R_COUNT) % R_COUNT : null); else if (e.key === 'ArrowRight') setReviewIdx(i => i !== null ? (i + 1) % R_COUNT : null); else if (e.key === 'Escape') setReviewIdx(null) }
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [photoIdx, reviewIdx])

  // Exit intent
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); setShowReturn(true); return '' }
    const hide = () => { if (document.visibilityState === 'hidden') setShowReturn(true) }
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('beforeunload', handler); document.removeEventListener('visibilitychange', hide) }
  }, [])

  // WA bubble auto-show
  useEffect(() => { const id = setTimeout(() => { if (!sessionStorage.getItem('fb_wa_shown')) { setShowWa(true); sessionStorage.setItem('fb_wa_shown', '1') } }, 7000); return () => clearTimeout(id) }, [])

  // Mode sync
  useEffect(() => { const handler = () => setMode(getMode()); window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler) }, [])


  // Inline helpers for FAQ/pricing/etc
  const pricingToggleStyle = (active: boolean): CSSProperties => ({
    position: 'relative', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif", fontSize: '15px', fontWeight: 800,
    padding: '12px 26px', borderRadius: '9999px', transition: 'all 0.2s ease',
    background: active ? '#D70808' : 'transparent', color: active ? '#fff' : '#6b7280',
    boxShadow: active ? '0 4px 14px rgba(215,8,8,0.28)' : 'none',
    textDecoration: active ? 'none' : 'underline dotted', textUnderlineOffset: '4px', textDecorationThickness: '2px',
  })
  const faqCatStyle = (active: boolean): CSSProperties => ({
    cursor: 'pointer', fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '9999px',
    border: '1.5px solid #D70808', background: active ? '#D70808' : '#fff', color: active ? '#fff' : '#D70808',
  })
  const faqItemContainerStyle = (openIdx: number | null, itemIdx: number): CSSProperties => ({
    borderBottom: '1px solid #f3f4f6', display: openIdx === null || FAQ_MAP[itemIdx] === faqCat ? 'block' : 'none',
  })
  const faqQStyle = (active: boolean): CSSProperties => ({
    fontSize: '14px', fontWeight: 700, lineHeight: 1.4, fontFamily: "'Nunito',sans-serif", color: active ? '#D70808' : '#151515',
  })
  const faqChevronStyle = (open: boolean): CSSProperties => ({
    flexShrink: 0, marginTop: '2px', fontSize: '14px', color: open ? '#D70808' : '#151515',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block',
  })
  const faqOptionStyle = (active: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '48px', textAlign: 'left',
    padding: '10px 12px', borderRadius: '9px', cursor: 'pointer',
    background: active ? 'rgba(215,8,8,0.05)' : '#fff', border: `1px solid ${active ? 'rgba(215,8,8,0.3)' : '#e5e5e5'}`,
    transition: 'all 0.15s ease', fontFamily: 'inherit',
  })
  const surveyOptionStyle = (): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '54px', textAlign: 'left',
    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', background: '#fff',
    border: '1px solid #e5e5e5', transition: 'all 0.15s ease', fontFamily: 'inherit', boxSizing: 'border-box',
  })
  const valueHeaderStyle = (): CSSProperties => ({
    position: 'sticky' as const, zIndex: 20, display: 'grid',
    gridTemplateColumns: '1.5fr 0.85fr 0.85fr 0.9fr', background: '#F9F9F9',
    borderBottom: '1px solid #ececec', borderRadius: '20px 20px 0 0', alignItems: 'stretch', overflow: 'hidden',
  })
  const screenshotStyle = (i: number): CSSProperties => ({
    height: '80vh', width: '340px', maxWidth: '80vw', borderRadius: '16px',
    backgroundImage: `url('${SCREENSHOTS[i ?? 0].src}')`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  })
  const reviewPhotoStyle = (i: number): CSSProperties => ({
    height: '85vh', width: '400px', maxWidth: '90vw', borderRadius: '16px',
    backgroundImage: `url('${reviewSrc(i ?? 0)}')`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  })
  const reviewCardStyle = (dir: string, idx: number): CSSProperties => {
    const n = dir === 'prev' ? (idx - 1 + R_COUNT) % R_COUNT : (idx + 1) % R_COUNT
    const left = dir === 'prev' ? 'calc(50% - 260px)' : 'calc(50% + 100px)'
    return { position: 'absolute' as const, transition: 'all 0.6s ease', cursor: 'pointer', overflow: 'hidden', borderRadius: '16px',
      backgroundImage: `url('${reviewSrc(n)}')`, backgroundSize: 'cover', backgroundPosition: 'center',
      left, width: '160px', height: '210px', opacity: 0.5, zIndex: 1, boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }
  }

  const handleScrollTo = useCallback((id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }, [])

  return (
    <Fragment>
      <Head title="Raih TOEFL 500+ Cukup 15 Hari. (LMS + Tutor AI)" />
      <style>{KEYFRAMES_CSS + BASE_CSS}</style>
      <div>
        <div className="[min-height:100vh] [background:#fff] [font-family:Nunito,system-ui,sans-serif]">
          <div className="[position:fixed] [top:0] [left:0] [right:0] [z-index:50]">

            {/* ===== URGENCY BANNER ===== */}
            {flashMs > 0 ? (
              <a ref={bannerRef} id="urgency-banner" href="#pricing"
                className="[display:flex] [align-items:center] [justify-content:center] [flex-wrap:nowrap] [gap:8px] [background:#C10707] [padding:8px_12px] [text-align:center] [text-decoration:none] [white-space:nowrap] [overflow:hidden] max-[500px]:[padding:10px_12px]">
                <span id="banner-full" className="[font-size:13px] [font-weight:800] [letter-spacing:0.02em] [text-transform:uppercase] [color:#fff] [line-height:1.4] max-[500px]:[display:none]">
                  🔥 FLASH SALE SEPTEMBER 🎓 DISKON 60%
                </span>
                <span id="banner-short" className="[display:none] [font-size:11px] [font-weight:800] [letter-spacing:0.01em] [text-transform:uppercase] [color:#fff] [line-height:1.4] max-[500px]:[display:inline] max-[500px]:[font-size:12.5px]">
                  🔥 FLASH SALE SEPTEMBER 🎓 60%
                </span>
                <span className="[display:inline-flex] [align-items:center] [gap:5px] [flex-shrink:0] [background:#fff] [color:#C10707] [border-radius:9999px] [padding:3px_10px] [line-height:1.2]">
                  <span className="[font-size:11px] [font-weight:800] [letter-spacing:0.04em] [text-transform:uppercase] max-[500px]:[display:none]">
                    ⏳ Berakhir
                  </span>
                  <BannerTimer />
                </span>
              </a>
            ) : null}

            {/* ===== HEADER ===== */}
            <header className={`[border-bottom:1px_solid_#f3f4f6] [transition:all_0.3s] ${scrolled
              ? '[background:rgba(255,255,255,0.95)] [box-shadow:0_4px_12px_rgba(0,0,0,0.08)] [backdrop-filter:blur(8px)]'
              : '[background:#fff] [box-shadow:0_1px_3px_rgba(0,0,0,0.05)]'}`}>
              <div className="[max-width:1152px] [margin:0_auto] [height:64px] [display:flex] [align-items:center] [justify-content:space-between] [padding:0_24px]">
                <a href="#" className="[display:flex] [align-items:center] [text-decoration:none]">
                  <img src="/logo/Logo-Fullbright.webp" alt="Full Bright Indonesia" className="[height:auto] [width:160px] [object-fit:contain]" />
                </a>
                <a href="#pricing" className="[display:flex] [flex-direction:column] [justify-content:center] [gap:1px] [border-radius:9999px] [background:#D70808] [box-shadow:0_6px_16px_rgba(215,8,8,0.35)] [text-decoration:none] [padding:7px_16px]">
                  <span className="[font-size:13px] [font-weight:800] [color:#fff] [white-space:nowrap] [line-height:1.2]">
                    🎓 Amankan Seat
                  </span>
                  <span className="[display:flex] [align-items:center] [gap:5px]">
                    <span className="[font-size:11px] [text-decoration:line-through] [color:rgba(255,255,255,0.92)] [white-space:nowrap]">Rp250rb</span>
                    <span className="[font-size:14px] [font-weight:900] [color:#fff] [white-space:nowrap]">Rp99rb</span>
                    <span className="[background:#F59E0B] [color:#151515] [font-size:10px] [font-weight:900] [padding:2px_7px] [border-radius:9999px] [white-space:nowrap]">-60%</span>
                  </span>
                </a>
              </div>
            </header>
          </div>

          {/* Spacer for sticky header */}
          <div style={{ height: bannerHeight + 64 }} />

          {/* ===== HERO ===== */}
          <section id="hero" className="[position:relative] [overflow:hidden] [background:linear-gradient(160deg,#fff_55%,#FFF5F5_100%)]">
            <div className="[pointer-events:none] [position:absolute] [top:-96px] [right:-96px] [height:384px] [width:384px] [border-radius:9999px] [background:#D70808] [filter:blur(120px)] [opacity:0.07]" />
            <div className="[pointer-events:none] [position:absolute] [bottom:-96px] [left:-96px] [height:288px] [width:288px] [border-radius:9999px] [background:#151515] [filter:blur(100px)] [opacity:0.05]" />

            <div id="hero-section-inner" className="[position:relative] [max-width:1152px] [margin:0_auto] [padding:40px_24px_16px] [display:grid] [grid-template-columns:1fr] [gap:40px] max-[500px]:[padding-top:24px] max-[500px]:[padding-bottom:8px] max-[500px]:[gap:24px]">
              <div className="[display:grid] [grid-template-columns:1.05fr_0.95fr] [gap:40px] [align-items:center] max-[899px]:[position:relative] max-[899px]:[grid-template-columns:1fr] max-[899px]:[gap:12px]">

                {/* Left column */}
                <div className="[display:flex] [flex-direction:column] [gap:16px] [grid-column:1] [position:relative] [z-index:1]">
                  {/* Rating badge */}
                  <div id="hero-rating-badge" className="[display:inline-flex] [align-items:center] [gap:8px] [border-radius:9999px] [padding:6px_16px] [font-size:12px] [font-weight:700] [letter-spacing:0.05em] [color:#374151] [border:1.5px_solid_#151515] [width:fit-content] max-[500px]:[font-size:clamp(9px,2.6vw,12px)] max-[500px]:[padding:clamp(4px,1.2vw,6px)_clamp(10px,3vw,16px)]">
                    <span className="[display:flex] [gap:2px] [color:#F59E0B]">★ ★ ★ ★ ★</span>
                    <span className="[letter-spacing:0.08em] [text-transform:uppercase]">45.000+ ALUMNI</span>
                    <div className="[margin-left:8px] [display:flex]">
                      <img src="/assets/People%201.webp" alt="alumni" width="80" height="80" className="[height:20px] [width:20px] [border-radius:9999px] [border:2px_solid_#fff] [object-fit:cover] [margin-left:-8px] max-[500px]:[height:clamp(14px,4vw,20px)] max-[500px]:[width:clamp(14px,4vw,20px)]" />
                      <img src="/assets/People%202.webp" alt="alumni" width="79" height="79" className="[height:20px] [width:20px] [border-radius:9999px] [border:2px_solid_#fff] [object-fit:cover] [margin-left:-8px] max-[500px]:[height:clamp(14px,4vw,20px)] max-[500px]:[width:clamp(14px,4vw,20px)]" />
                      <img src="/assets/People%203.webp" alt="alumni" width="78" height="78" className="[height:20px] [width:20px] [border-radius:9999px] [border:2px_solid_#fff] [object-fit:cover] [margin-left:-8px] max-[500px]:[height:clamp(14px,4vw,20px)] max-[500px]:[width:clamp(14px,4vw,20px)]" />
                    </div>
                  </div>

                  {/* Headline */}
                  <h1 className="[margin:0] [font-family:Nunito,sans-serif] [font-size:clamp(28px,4vw,42px)] [line-height:1.15] [font-weight:900] [color:#151515] max-[500px]:[font-size:clamp(22px,7vw,32px)]">
                    Raih <span className="[color:#D70808]">TOEFL 500+</span>{' '}
                    Cukup <span className="[display:inline-flex] [align-items:center] [gap:4px] [padding:0_10px] [border-radius:12px] [background:#FFF5F5] [border:1.5px_solid_#fecaca] [line-height:1.6] [font-size:0.9em] [font-weight:900] [color:#D70808] [font-style:italic]">15 Hari</span>
                    {' '}saja.
                  </h1>

                  {/* Sub-headline */}
                  <p className="[margin:0] [font-size:clamp(14px,1.6vw,17px)] [line-height:1.7] [color:#374151] [max-width:520px] max-[500px]:[font-size:clamp(13px,3.5vw,16px)] max-[500px]:[line-height:1.6]">
                    Ikuti program belajar terstruktur berbasis LMS + pendampingan tutor AI yang sudah terbukti pada{' '}
                    <strong className="[color:#151515]">45.000+ alumni</strong> dari UI, ITB, UGM, IPB, ITS, Undip, dan universitas lainnya.
                  </p>

                  {/* Trust badges */}
                  <div className="[display:flex] [flex-wrap:wrap] [gap:8px] max-[500px]:[gap:6px]">
                    {['🛡️ Resmi Kemenkumham', '📱 LMS Akses 2 Tahun', '⚡ Live ZOOM 15 Hari'].map(t => (
                      <span key={t} className="[display:inline-flex] [align-items:center] [gap:6px] [border-radius:9999px] [border:1px_solid_#e5e7eb] [background:#fafafa] [padding:6px_14px] [font-size:13px] [font-weight:700] [color:#374151] max-[500px]:[font-size:clamp(10px,2.8vw,13px)] max-[500px]:[padding:5px_10px]">{t}</span>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div className="[display:flex] [flex-wrap:wrap] [gap:12px] [align-items:center] max-[500px]:[gap:10px]">
                    <a href="#pricing" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                      🎓 Amankan Seat Sekarang
                    </a>
                    <a href="#lms" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#151515] [border:2px_solid_#D70808] [text-decoration:none]">
                      📱 Lihat LMS
                    </a>
                  </div>

                  {/* Scroll cue */}
                  <div className="[margin-top:8px] [display:flex] [justify-content:flex-start] max-[500px]:[justify-content:center]" style={{ animation: 'heroBounce 2s infinite' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D70808" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  </div>
                </div>

                {/* Right column — hero image */}
                <div className="[position:relative] [z-index:1] max-[899px]:[position:absolute] max-[899px]:[inset:0] max-[899px]:[z-index:0]">
                  <div className="[position:relative] [width:100%] [border-radius:24px] [overflow:hidden] [box-shadow:0_20px_60px_rgba(0,0,0,0.12)]" style={{ aspectRatio: '4/5' }}>
                    <img src="/assets/hero-consultant.png" alt="Konsultan TOEFL Full Bright" className="[width:100%] [height:100%] [object-fit:cover] [display:block]" />
                    {/* Score popup badge */}
                    <div className="[position:absolute] [bottom:16px] [left:16px] [right:16px] [display:flex] [align-items:center] [gap:10px] [background:rgba(255,255,255,0.95)] [backdrop-filter:blur(8px)] [border-radius:16px] [padding:10px_14px] [box-shadow:0_4px_20px_rgba(0,0,0,0.12)]">
                      <div className="[height:40px] [width:40px] [border-radius:12px] [background:#D70808] [display:flex] [align-items:center] [justify-content:center] [color:#fff] [font-size:18px] [font-weight:900] [flex-shrink:0]">500+</div>
                      <div className="[display:flex] [flex-direction:column]">
                        <span className="[font-size:13px] [font-weight:800] [color:#151515] [line-height:1.2]">Target skor TOEFL kamu</span>
                        <span className="[font-size:12px] [color:#6b7280] [line-height:1.3]">Tercapai dalam 15 hari</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* ===== WAVE DIVIDER ===== */}
          <div dangerouslySetInnerHTML={{ __html: WAVE_SVG }} />

          {/* ===== LOGO MARQUEE ===== */}
          <div className="[overflow:hidden] [padding:24px_0] [background:#fff]">
            <div className="[max-width:1152px] [margin:0_auto] [padding:0_24px] [text-align:center] [margin-bottom:12px]">
              <p className="[margin:0] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#9ca3af]">Dipercaya mahasiswa dari universitas terbaik Indonesia</p>
            </div>
            <div className="[position:relative] [display:flex] [width:max-content]" style={{ animation: 'infiniteScroll 30s linear infinite' }}>
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="[display:flex] [gap:48px] [padding:0_24px] [align-items:center] [flex-shrink:0]">
                  {[
                    { src: '/assets/logos/ui.png', w: 180 }, { src: '/assets/logos/itb.png', w: 160 },
                    { src: '/assets/logos/ugm.webp', w: 150 }, { src: '/assets/logos/ipb.png', w: 150 },
                    { src: '/assets/logos/its.png', w: 130 }, { src: '/assets/logos/undip.png', w: 170 },
                    { src: '/assets/logos/nottingham.png', w: 120 }, { src: '/assets/logos/stuttgart.png', w: 140 },
                    { src: '/assets/unair.webp', w: 130 },
                  ].map((l, i) => (
                    <img key={`${setIdx}-${i}`} src={l.src} alt="" height="30" className="[object-contain] [flex-shrink-0] [opacity:50] [grayscale]" style={{ width: l.w }} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ===== AGITATION ===== */}
          <section id="agitation" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[max-width:720px] [margin:0_auto] [text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Kenapa skormu masih segini?</p>
              <h2 className="[margin:0_0_16px] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Masalahnya bukan kamu tidak pintar.</h2>
              <p className="[margin:0] [font-size:clamp(15px,1.6vw,17px)] [line-height:1.7] [color:#374151]">Metode yang salah membuat waktu belajar jadi sia-sia. Perhatikan tanda-tanda ini:</p>
            </div>

            <div className="[display:grid] [grid-template-columns:1fr_1fr] [gap:0] [max-width:900px] [margin:0_auto] [border:1px_solid_#f3f4f6] [border-radius:20px] [overflow:hidden]">
              {[
                { n: '01', title: 'Belajar dari materi yang tidak berurutan', desc: 'Kamu loncat-loncat materi tanpa paham mana yang harus dipelajari duluan.', color: '#FFFAFA' },
                { n: '02', title: 'Menghafal banyak aturan grammar tanpa mengenali pola soal', desc: 'Hasilnya kamu paham teori tapi tetap salah saat mengerjakan soal TOEFL.', color: '#fff' },
                { n: '03', title: 'Latihan soal tanpa tahu kelemahan diri sendiri', desc: 'Kerjakan ratusan soal tapi tidak pernah tahu bagian mana yang benar-benar perlu diperbaiki.', color: '#FFFAFA' },
                { n: '04', title: 'Belajar sendiri tanpa ada yang bisa ditanya saat stuck', desc: 'Banyak waktu habis hanya untuk bingung sendiri dan akhirnya menyerah.', color: '#fff' },
                { n: '05', title: 'Menunda belajar karena tidak tahu harus mulai dari mana', desc: 'Hari demi hari berlalu dan target TOEFL tetap belum tercapai.', color: '#FFFAFA' },
              ].map(row => (
                <div key={row.n} className="[display:grid] [grid-template-columns:64px_1fr_1fr] [border-bottom:1px_solid_#f3f4f6] max-[600px]:[grid-template-columns:48px_1fr]" style={{ background: row.color }}>
                  <div className="[display:flex] [align-items:center] [justify-content:center] [font-size:18px] [font-weight:900] [color:#D70808] [border-right:1px_solid_#f3f4f6]">{row.n}</div>
                  <div className="[padding:20px_24px] [border-right:1px_solid_#f3f4f6] max-[600px]:[border-right:none]">
                    <p className="[margin:0] [font-size:15px] [font-weight:800] [color:#151515] [line-height:1.4]">{row.title}</p>
                  </div>
                  <div className="[padding:20px_24px] max-[600px]:[padding:0_24px_20px_48px]">
                    <p className="[margin:0] [font-size:14px] [color:#374151] [line-height:1.6]">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="[max-width:600px] [margin:40px_auto_0] [text-align:center]">
              <p className="[margin:0_0_16px] [font-size:13px] [font-weight:700] [letter-spacing:0.06em] [text-transform:uppercase] [color:#6b7280]">Skor rata-rata peserta sebelum & sesudah</p>
              <div className="[display:flex] [align-items:flex-end] [justify-content:center] [gap:12px] [height:120px]">
                {[50, 70, 55, 85, 60, 100].map((h, i) => (
                  <div key={i} className="[width:28px] [border-radius:6px_6px_0_0]" style={{ height: `${h}%`, background: i < 3 ? '#fecaca' : '#D70808', animation: `fbFadeInUp 0.6s ease ${i * 0.1}s both` }} />
                ))}
              </div>
              <div className="[display:flex] [justify-content:center] [gap:12px] [margin-top:8px]">
                <span className="[font-size:11px] [color:#9ca3af]">Sebelum</span>
                <span className="[font-size:11px] [color:#D70808] [font-weight:700]">Sesudah</span>
              </div>
            </div>

            <p className="[margin:32px_auto_0] [text-align:center] [max-width:560px] [font-size:17px] [line-height:1.6] [color:#374151]">
              Jangan habiskan waktu dengan metode yang belum terbukti.{' '}
              <strong className="[color:#D70808]">Saatnya belajar dengan cara yang benar.</strong>
            </p>
          </section>

          {/* ===== VALUE TABLE ===== */}
          <section id="value" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Perbandingan program</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Kenapa Full Bright lebih worth it?</h2>
            </div>

            {/* Sticky header */}
            <div className="[max-width:800px] [margin:0_auto]">
              <div style={valueHeaderStyle()}>
                <div className="[padding:14px_20px] [font-size:14px] [font-weight:800] [color:#6b7280]">Fitur Program</div>
                <div className="[padding:14px_20px] [text-align:center] [font-size:14px] [font-weight:800] [color:#D70808]">Full Bright</div>
                <div className="[padding:14px_20px] [text-align:center] [font-size:14px] [font-weight:800] [color:#6b7280]">Bimbel Lain</div>
                <div className="[padding:14px_20px] [text-align:center] [font-size:14px] [font-weight:800] [color:#6b7280]">Otodidak</div>
              </div>
              {[
                { f: 'Materi terstruktur 15 hari', fb: true, bl: true, od: false },
                { f: '60+ video materi full skills', fb: true, bl: false, od: false },
                { f: 'Diagnostic test + post test', fb: true, bl: false, od: false },
                { f: '1.000+ latihan soal & pembahasan', fb: true, bl: true, od: false },
                { f: 'Live ZOOM 15 hari', fb: true, bl: true, od: false },
                { f: 'Rekaman ZOOM seumur hidup', fb: true, bl: false, od: false },
                { f: 'AI Assistant 24/7', fb: true, bl: false, od: false },
                { f: 'Simulasi format TOEFL ITP', fb: true, bl: true, od: false },
                { f: 'Sertifikat TOEFL Prediction', fb: true, bl: true, od: false },
                { f: 'Grup WA diskusi', fb: true, bl: true, od: false },
                { f: 'Akses LMS 2 tahun', fb: true, bl: false, od: false },
                { f: 'Legalitas resmi & sertifikat valid', fb: true, bl: true, od: false },
                { f: 'Harga', fb: 'Rp99.000', bl: 'Rp300rb+', od: 'Gratis' },
              ].map((r, i) => (
                <div key={i} className="[display:grid] [grid-template-columns:1.5fr_0.85fr_0.85fr_0.9fr] [border-bottom:1px_solid_#f3f4f6] max-[600px]:[grid-template-columns:1.2fr_1fr_1fr_0.8fr]">
                  <div className="[padding:14px_20px] [font-size:14px] [font-weight:700] [color:#151515]">{r.f}</div>
                  {['fb', 'bl', 'od'].map(k => {
                    const val = r[k as keyof typeof r]
                    return (
                      <div key={k} className="[padding:14px_20px] [text-align:center] [display:flex] [align-items:center] [justify-content:center]">
                        {typeof val === 'boolean' ? (
                          <span dangerouslySetInnerHTML={{ __html: val ? CHECK_SVG : CROSS_SVG }} />
                        ) : (
                          <span className="[font-size:14px] [font-weight:700] [color:#151515]">{String(val)}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* ===== METHODS ===== */}
          <section id="methods" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Metode pembelajaran</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">3 langkah sederhana menuju TOEFL 500+</h2>
            </div>

            <div className="[display:flex] [flex-direction:column] [gap:20px] [max-width:800px] [margin:0_auto]">
              {TUTOR_STEPS.map(s => (
                <div key={s.n} className="[display:flex] [align-items:flex-start] [gap:20px] [padding:24px] [border-radius:18px] [border:1px_solid_#e5e7eb] [background:#fafafa]">
                  <div className="[flex-shrink:0] [width:48px] [height:48px] [border-radius:14px] [background:#D70808] [color:#fff] [display:flex] [align-items:center] [justify-content:center] [font-size:18px] [font-weight:900]">{s.n}</div>
                  <div>
                    <h3 className="[margin:0_0_8px] [font-size:18px] [font-weight:900] [color:#151515]">{s.t}</h3>
                    <p className="[margin:0] [font-size:15px] [line-height:1.7] [color:#374151]">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="[display:flex] [justify-content:center] [gap:12px] [margin-top:32px]">
              <a href="#pricing" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                🎓 Mulai Sekarang
              </a>
              <div className="[display:flex] [align-items:center] [gap:6px] [font-size:14px] [color:#6b7280]">
                <span className="[display:flex] [gap:1px] [color:#F59E0B]">★★★★★</span>
                <span><strong>4.9</strong>/5 dari 3.620 ulasan Google</span>
              </div>
            </div>
          </section>

          {/* ===== PROOF GALLERY ===== */}
          <section id="proof" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[position:relative] [display:inline-flex] [align-items:center] [gap:8px] [background:#D70808] [color:#fff] [border-radius:9999px] [padding:6px_14px] [font-size:12px] [font-weight:800] [margin-bottom:20px]">
              <span>🏆</span>
              <span>TERVERIFIKASI</span>
            </div>
            <h2 className="[margin:0_0_32px] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Skor Alumni yang Sudah Terbukti</h2>

            <div className="[display:grid] [grid-template-columns:repeat(3,1fr)] [gap:20px] max-[700px]:[grid-template-columns:1fr] max-[900px]:[grid-template-columns:repeat(2,1fr)]">
              {SCREENSHOTS.slice(0, 3).map((s, i) => (
                <div key={i} className="[border-radius:18px] [overflow:hidden] [border:1px_solid_#e5e7eb] [box-shadow:0_4px_20px_rgba(0,0,0,0.08)] [cursor:pointer]" onClick={() => setPhotoIdx(i)}>
                  <img src={s.src} alt={`Skor TOEFL ${s.score}`} loading="lazy" className="[width:100%] [aspect-ratio:9/16] [object-fit:cover] [display:block]" />
                  <div className="[padding:12px_16px] [background:#fafafa] [text-align:center]">
                    <span className="[font-size:20px] [font-weight:900] [color:#D70808]">Skor {s.score}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="[text-align:center] [margin-top:24px]">
              <button onClick={() => setPhotoIdx(0)} className="[cursor:pointer] [font-weight:700] [color:#D70808] [font-size:14px] [text-decoration:underline] [text-underline-offset:4px] [bg-transparent] [border:none]">
                Lihat Semua Skor Alumni →
              </button>
            </div>
          </section>


          {/* ===== LMS SECTION ===== */}
          <section id="lms" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Platform LMS</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Semua yang Kamu Butuhkan dalam Satu Platform</h2>
            </div>

            {/* Video showcase */}
            <div className="[position:relative] [max-width:1040px] [margin:0_auto_40px] [border-radius:22px] [overflow:hidden] [box-shadow:0_8px_40px_rgba(0,0,0,0.12)]">
              <video ref={lmsRef} onPlay={() => setLmsPaused(false)} onPause={() => setLmsPaused(true)} controls playsInline preload="metadata" className="[display:block] [width:100%] [aspect-ratio:16/9] [object-fit:cover] [background:#151515]">
                <source src="https://demo-fullbright.b-cdn.net/NEW.mp4#t=4" type="video/mp4" />
                Browser kamu tidak mendukung pemutaran video.
              </video>
              {lmsPaused && (
                <button type="button" onClick={() => lmsRef.current?.play()} className="[position:absolute] [inset-0] [display:flex] [align-items:center] [justify-content:center] [border:0] [background:rgba(21,21,21,0.22)] [cursor:pointer] [transition:background_0.2s_ease]">
                  <div className="[position:absolute] [inset-0] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [gap:14px] [background:rgba(21,21,21,0.35)]">
                    <span className="[display:flex] [align-items:center] [justify-content:center] [width:76px] [height:76px] [border-radius:9999px] [background:#D70808] [box-shadow:0_8px_28px_rgba(215,8,8,0.5)]" dangerouslySetInnerHTML={{ __html: PLAY_SVG }} />
                    <span className="[font-size:13px] [font-weight:800] [font-family:Nunito,sans-serif] [color:#fff] [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">Putar showcase LMS</span>
                  </div>
                </button>
              )}
            </div>

            {/* 7 Feature cards */}
            <div className="[display:flex] [flex-direction:column] [gap:20px] [max-width:1040px] [margin:0_auto_40px]">
              {LMS_CARDS.map(card => (
                <div key={card.num} className="[border-radius:22px] [background:#fff] [border:1px_solid_#ececec] [box-shadow:0_4px_22px_rgba(0,0,0,0.06)] [overflow:hidden] [display:grid] [grid-template-columns:1.35fr_1fr] [align-items:stretch] max-[899px]:[grid-template-columns:1fr]">
                  <div className={`[padding:22px] [background:#FAFAFA] [display:flex] [flex-direction:column] [justify-content:center] ${card.order === 'reverse' ? '[order:2] max-[899px]:[order:initial]' : ''}`}>
                    <div className="[border-radius:12px] [overflow:hidden] [border:1px_solid_#e5e7eb] [background:#fff] [box-shadow:0_4px_18px_rgba(0,0,0,0.09)] [line-height:0]">
                      <img src={card.img} alt={card.alt} width="1920" height="1200" loading="lazy" className="[width:100%] [height:auto] [display:block]" />
                    </div>
                  </div>
                  <div className={`[padding:24px_26px] [display:flex] [flex-direction:column] [justify-content:center] [gap:11px] ${card.order === 'reverse' ? '[order:1] max-[899px]:[order:initial]' : ''}`}>
                    <div className="[display:flex] [align-items:center] [gap:10px] [flex-wrap:wrap]">
                      <span className="[display:flex] [align-items:center] [justify-content:center] [width:28px] [height:28px] [flex-shrink:0] [border-radius:9px] [background:#D70808] [color:#fff] [font-size:12px] [font-weight:900] [font-family:Nunito,sans-serif]">{card.num}</span>
                      <span className="[font-size:11px] [font-weight:900] [letter-spacing:0.08em] [text-transform:uppercase] [color:#6b7280]">{card.cat}</span>
                      <span className="[display:inline-flex] [align-items:baseline] [gap:5px] [font-size:15px] [font-weight:900] [font-family:Nunito,sans-serif] [padding:6px_13px] [border-radius:9999px] [background:#FFF0F0] [color:#D70808] [border:1.5px_solid_#ffb3b3] [white-space:nowrap]">
                        <span className="[font-size:10px] [font-weight:900] [letter-spacing:0.06em] [text-transform:uppercase] [color:#D70808]">Senilai</span>
                        {card.value}
                      </span>
                    </div>
                    <h3 className="[margin:0] [font-size:clamp(19px,2.2vw,22px)] [line-height:1.3] [font-weight:900] [font-family:Nunito,sans-serif] [color:#151515]">{card.title}</h3>
                    <p className="[margin:0] [font-size:15px] [line-height:1.7] [color:#3d3d3d]">{card.desc}</p>
                    <div className="[display:flex] [flex-wrap:wrap] [gap:7px] [margin-top:2px]">
                      {card.tags.map(tag => (
                        <span key={tag} className="[display:inline-flex] [flex-shrink:0] [white-space:nowrap] [align-items:center] [gap:6px] [font-size:13px] [font-weight:700] [color:#151515] [background:#F7F7F7] [border:1px_solid_#ececec] [border-radius:9999px] [padding:6px_12px]">
                          <span className="[color:#D70808] [font-weight:900]">✓</span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Value summary box */}
            <div className="[max-width:600px] [margin:0_auto] [background:#fff] [border:2px_solid_#D70808] [border-radius:20px] [padding:32px] [text-align:center] [box-shadow:0_4px_20px_rgba(215,8,8,0.12)]">
              <p className="[margin:0_0_8px] [font-size:14px] [font-weight:700] [color:#6b7280] [text-decoration:line-through]">Total Nilai: Rp 1.005.000</p>
              <p className="[margin:0_0_8px] [font-size:clamp(32px,4vw,48px)] [font-weight:900] [color:#D70808] [line-height:1.1]">Rp 99.000</p>
              <p className="[margin:0_0_16px] [font-size:14px] [font-weight:700] [color:#151515]">Harga ini berlaku untuk batch berikutnya</p>
              <a href="#pricing" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                🎯 Klaim Harga Sekarang
              </a>
            </div>
          </section>

          {/* ===== WHY FULLBRIGHT ===== */}
          <section id="why" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Keunggulan kami</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Kenapa harus Full Bright Indonesia?</h2>
            </div>

            <div className="[display:grid] [grid-template-columns:repeat(2,1fr)] [gap:16px] [max-width:800px] [margin:0_auto] max-[600px]:[grid-template-columns:1fr]">
              {[
                { icon: '🛡️', title: 'Lembaga Resmi', desc: 'Legalitas lengkap dari Kemenkumham dan Kemedikbud. Sertifikat berlaku untuk CPNS, BUMN, kuliah, dan beasiswa.' },
                { icon: '📊', title: 'Terbukti 45.000+ Alumni', desc: 'Rata-rata kenaikan skor 80-100 poin. Metode yang sudah teruji bertahun-tahun.' },
                { icon: '🤖', title: 'Teknologi AI', desc: 'AI Assistant siap menjawab pertanyaanmu 24/7. Belajar jadi lebih cepat dan tidak ada yang tertinggal.' },
                { icon: '🎓', title: 'Sertifikat Resmi', desc: 'Sertifikat TOEFL Prediction yang diakui oleh ribuan perusahaan dan universitas di Indonesia.' },
              ].map(item => (
                <div key={item.title} className="[display:flex] [align-items:flex-start] [gap:16px] [padding:24px] [border-radius:16px] [border:1px_solid_#e5e7eb] [background:#fafafa]">
                  <span className="[flex-shrink:0] [font-size:28px]">{item.icon}</span>
                  <div>
                    <h3 className="[margin:0_0_8px] [font-size:16px] [font-weight:900] [color:#151515]">{item.title}</h3>
                    <p className="[margin:0] [font-size:14px] [line-height:1.6] [color:#374151]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo card */}
            <div className="[max-width:600px] [margin:40px_auto_0] [border-radius:18px] [overflow:hidden] [box-shadow:0_4px_20px_rgba(0,0,0,0.08)]">
              <img src="/assets/Foto%20Bareng.webp" alt="Foto Bareng Alumni" loading="lazy" className="[width:100%] [object-fit:cover] [display:block]" />
            </div>
          </section>

          {/* ===== TESTIMONIALS ===== */}
          <section id="testimonials" className="[padding:0]">
            {/* Dark stats strip */}
            <div className="[background:#151515] [padding:48px_24px]">
              <div className="[max-width:1152px] [margin:0_auto] [display:grid] [grid-template-columns:repeat(5,1fr)] [gap:24px] [text-align:center] max-[600px]:[grid-template-columns:repeat(3,1fr)]">
                {[
                  { n: '45.000+', l: 'Alumni' }, { n: '4.9', l: 'Rating Google' },
                  { n: '5', l: 'Bintang' }, { n: '13+', l: 'Tahun Pengalaman' }, { n: '95%', l: 'Lulus' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="[margin:0_0_4px] [font-size:clamp(24px,3vw,36px)] [font-weight:900] [color:#D70808] [line-height:1.1]">{s.n}</p>
                    <p className="[margin:0] [font-size:13px] [font-weight:700] [color:rgba(255,255,255,0.6)]">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Score screenshots marquee */}
            <div className="[padding:40px_0] [background:#fff]">
              <div className="[text-align:center] [margin-bottom:24px]">
                <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Bukti Skor</p>
                <h2 className="[margin:0] [font-size:clamp(22px,2.8vw,30px)] [font-weight:900] [color:#151515]">Skor Alumni yang Sudah Terbukti</h2>
              </div>
              <div className="[overflow:hidden] [padding:0_0_16px]" style={{ maskImage: 'linear-gradient(90deg,transparent,black 10%,black 90%,transparent)' }}>
                <div className="[display:flex] [gap:20px]" style={{ animation: 'infiniteScroll 40s linear infinite', width: 'max-content' }}>
                  {[...SCREENSHOTS, ...SCREENSHOTS, ...SCREENSHOTS].map((s, i) => (
                    <div key={i} className="[flex-shrink-0] [border-radius:16px] [overflow:hidden] [box-shadow:0_4px_20px_rgba(0,0,0,0.08)] [cursor:pointer] [width:130px]" onClick={() => setPhotoIdx(i % SCREENSHOT_COUNT)}>
                      <img src={s.src} alt={`Skor ${s.score}`} className="[width:100%] [aspect-ratio:9/16] [object-fit:cover] [display:block]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* University cards */}
            <div className="[padding:40px_24px] [background:#fafafa] [max-width:1152px] [margin:0_auto]">
              <div className="[text-align:center] [margin-bottom:32px]">
                <h2 className="[margin:0] [font-size:clamp(22px,2.8vw,30px)] [font-weight:900] [color:#151515]">Mereka yang Sudah Berhasil</h2>
              </div>
              <div className="[display:grid] [grid-template-columns:repeat(3,1fr)] [gap:16px] max-[600px]:[grid-template-columns:1fr] max-[900px]:[grid-template-columns:repeat(2,1fr)]">
                {UNIVERSITY_CARDS.map((u, i) => (
                  <div key={i} className="[border-radius:16px] [overflow:hidden] [border:1px_solid_#e5e7eb] [background:#fff] [box-shadow:0_2px_12px_rgba(0,0,0,0.05)]">
                    <div className="[aspect-ratio:9/16] [overflow:hidden]">
                      <img src={u.src} alt={u.name} loading="lazy" className="[width:100%] [height:100%] [object-fit:cover] [display:block]" />
                    </div>
                    <div className="[padding:16px]">
                      <img src={u.logo} alt="" height="30" className="[object-contain] [margin-bottom:8px]" style={{ width: u.w }} />
                      <p className="[margin:0_0_4px] [font-size:14px] [font-weight:800] [color:#151515]">Skor {u.score} — {u.name}</p>
                      <p className="[margin:0] [font-size:12px] [color:#6b7280]">{u.dept}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar reviews marquee */}
            <div className="[overflow:hidden] [padding:40px_0] [background:#fff]">
              <div className="[display:flex] [gap:20px]" style={{ animation: 'infiniteScroll 50s linear infinite', width: 'max-content' }}>
                {[...REVIEWS_MARQUEE, ...REVIEWS_MARQUEE].map((r, i) => (
                  <div key={i} className="[flex-shrink-0] [width:220px] [border-radius:16px] [overflow:hidden] [border:1px_solid_#e5e7eb] [box-shadow:0_2px_12px_rgba(0,0,0,0.05)]">
                    <img src={r.src} alt="Review alumni" loading="lazy" className="[width:100%] [aspect-ratio:3/4] [object-fit:cover] [display:block]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Review carousel + video */}
            <div className="[max-width:800px] [margin:0_auto] [padding:0_24px] [text-align:center]">
              <ReviewCarousel onOpen={setReviewIdx} />
            </div>

            {/* Testimonial video */}
            <div className="[max-width:520px] [margin:48px_auto_0] [text-align:center]">
              <p className="[margin:0_0_6px] [text-align:center] [font-size:11px] [font-weight:900] [letter-spacing:0.08em] [text-transform:uppercase] [color:#6b7280]">Cerita Alumni</p>
              <h3 className="[margin:0_0_16px] [text-align:center] [font-size:clamp(19px,2.4vw,24px)] [line-height:1.3] [font-weight:900] [font-family:Nunito,sans-serif] [color:#151515]">Dengar Langsung dari <span className="[color:#D70808]">Alumni Kami</span></h3>
              <div className="[position:relative] [border-radius:18px] [overflow:hidden] [background:#151515] [box-shadow:0_8px_28px_rgba(0,0,0,0.18)] [line-height:0] [cursor:pointer]" onClick={() => testiRef.current?.play()}>
                <video ref={testiRef} src="/assets/testimoni%20iyha.mp4#t=1.5" controls playsInline preload="metadata" onPlay={() => setTestiPaused(false)} className="[display:block] [width:100%] [aspect-ratio:9/16] [max-height:560px] [object-fit:cover] [background:#151515]" />
                {testiPaused && (
                  <div className="[position:absolute] [inset-0] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center] [gap:14px] [background:rgba(21,21,21,0.35)]">
                    <span className="[display:flex] [align-items:center] [justify-content:center] [width:76px] [height:76px] [border-radius:9999px] [background:#D70808] [box-shadow:0_8px_28px_rgba(215,8,8,0.5)]" dangerouslySetInnerHTML={{ __html: PLAY_SVG }} />
                    <span className="[font-size:13px] [font-weight:800] [font-family:Nunito,sans-serif] [color:#fff] [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">Putar video testimoni</span>
                  </div>
                )}
              </div>
            </div>

            {/* Closing CTA */}
            <div className="[margin-top:40px] [text-align:center]">
              <p className="[margin:0_0_20px] [max-width:520px] [margin-left:auto] [margin-right:auto] [font-size:18px] [line-height:1.5] [font-weight:700] [font-family:Nunito,sans-serif] [color:#151515]">
                Keberhasilan alumni selama ini bukan karena mereka pintar, tapi karena mereka <span className="[color:#D70808]">gunakan metode yang tepat</span>.
              </p>
              <a href="#pricing" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                Gabung Sekarang 🎓
              </a>
            </div>
          </section>


          {/* ===== PRICING ===== */}
          <section id="pricing" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:40px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Pilihan paket</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Pilih Paket yang Paling Cocok untukmu</h2>
            </div>

            {/* Self/Tutor toggle */}
            <div className="[display:flex] [justify-content:center] [gap:8px] [margin-bottom:40px]">
              <button style={pricingToggleStyle(mode === 'self')} onClick={() => setMode('self')}>Belajar Mandiri (LMS)</button>
              <button style={pricingToggleStyle(mode === 'tutor')} onClick={() => setMode('tutor')}>Dibimbing Tutor</button>
            </div>

            {/* ===== SELF MODE ===== */}
            {mode === 'self' && (
              <Fragment>
                <div className="[max-width:480px] [margin:0_auto] [border-radius:24px] [border:2px_solid_#D70808] [overflow-hidden] [box-shadow:0_8px_40px_rgba(215,8,8,0.15)]">
                  {/* Header */}
                  <div className="[background:#D70808] [padding:24px_32px] [text-align:center]">
                    <p className="[margin:0_0_4px] [font-size:12px] [font-weight:900] [letter-spacing:0.08em] [text-transform:uppercase] [color:rgba(255,255,255,0.8)]">Populer</p>
                    <p className="[margin:0_0_8px] [font-size:24px] [font-weight:900] [color:#fff]">E-Course TOEFL LMS</p>
                    <p className="[margin:0] [font-size:14px] [color:rgba(255,255,255,0.8)]">Self-Study LMS dengan akses 2 tahun</p>
                  </div>
                  {/* Price */}
                  <div className="[padding:24px_32px] [text-align:center] [background:#fff]">
                    <p className="[margin:0_0_4px] [font-size:14px] [color:#6b7280] [text-decoration:line-through]">Rp 250.000</p>
                    <p className="[margin:0_0_8px] [font-size:48px] [font-weight:900] [color:#D70808] [line-height:1]">Rp99rb</p>
                    <p className="[margin:0_0_16px] [font-size:14px] [font-weight:700] [color:#151515]">Hemat 60%</p>
                    <a href={wa('Halo Admin Full Bright Indonesia. Saya mau daftar paket Self-Study LMS.')} target="_blank" rel="noopener noreferrer" data-random-wa="true" className="[display:flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                      🎓 Daftar Sekarang
                    </a>
                  </div>
                  {/* Features */}
                  <div className="[padding:24px_32px] [border-top:1px_solid_#f3f4f6] [background:#fafafa]">
                    {['Akses LMS 2 tahun', '60+ video materi full skills', '1.000+ latihan soal & pembahasan', 'Diagnostic test & post test', 'Simulasi TOEFL ITP', 'Grup WA diskusi', 'AI Assistant 24/7'].map(f => (
                      <div key={f} className="[display:flex] [align-items:center] [gap:10px] [padding:8px_0]">
                        <span className="[color:#D70808]" dangerouslySetInnerHTML={{ __html: CHECK_SVG.replace('width="28"', 'width="20"').replace('height="28"', 'height="20"') }} />
                        <span className="[font-size:14px] [color:#151515]">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* "Kata Mereka yang Belajar Mandiri" strip */}
                <div className="[max-width:800px] [margin:48px_auto_0] [text-align:center]">
                  <p className="[margin:0_0_24px] [font-size:13px] [font-weight:700] [letter-spacing:0.06em] [text-transform:uppercase] [color:#6b7280]">Kata Mereka yang Belajar Mandiri</p>
                  <div className="[display:grid] [grid-template-columns:repeat(3,1fr)] [gap:16px] max-[600px]:[grid-template-columns:1fr]">
                    {SELF_PEOPLE.map(p => (
                      <div key={p.name} className="[text-align:center]">
                        <img src={p.src} alt={p.alt} className="[width:60px] [height:60px] [border-radius:9999px] [object-fit:cover] [margin:0_auto_8px]" />
                        <p className="[margin:0_0_4px] [font-size:14px] [font-weight:800] [color:#151515]">{p.name}</p>
                        <p className="[margin:0] [font-size:13px] [color:#6b7280]">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Fragment>
            )}

            {/* ===== TUTOR MODE ===== */}
            {mode === 'tutor' && (
              <Fragment>
                <div className="[display:grid] [grid-template-columns:repeat(3,1fr)] [gap:20px] [max-width:1000px] [margin:0_auto] max-[768px]:[grid-template-columns:1fr]">
                  {[
                    { name: 'Starter', price: '200rb', features: ['Live ZOOM 15 hari', 'Rekaman ZOOM', 'Semua materi LMS', 'Grup WA diskusi', 'AI Assistant 24/7'] },
                    { name: 'Bundling', price: '300rb', features: ['Live ZOOM 15 hari', 'Rekaman ZOOM', 'Semua materi LMS', 'Sertifikat TOEFL Prediction', 'Garansi ulang', 'Grup WA diskusi', 'AI Assistant 24/7'], popular: true },
                    { name: 'Intermediate', price: '280rb', features: ['Live ZOOM 15 hari', 'Rekaman ZOOM', 'Semua materi LMS', 'Grup WA diskusi'] },
                  ].map(card => (
                    <div key={card.name} className={`[border-radius:24px] [overflow-hidden] [box-shadow:0_8px_40px_rgba(0,0,0,0.08)] ${card.popular ? '[border:2px_solid_#D70808]' : '[border:1px_solid_#e5e7eb]'}`}>
                      <div className={`[padding:24px] [text-align:center] ${card.popular ? '[background:#D70808] [color:#fff]' : '[background:#fafafa]'}`}>
                        {card.popular && <p className="[margin:0_0_8px] [font-size:11px] [font-weight:900] [letter-spacing:0.08em] [text-transform:uppercase] [color:rgba(255,255,255,0.8)]">TERLARIS</p>}
                        <p className="[margin:0_0_4px] [font-size:20px] [font-weight:900]">{card.name}</p>
                        <p className="[margin:0] [font-size:32px] [font-weight:900]">Rp{card.price}</p>
                      </div>
                      <div className="[padding:24px] [background:#fff]">
                        {card.features.map(f => (
                          <div key={f} className="[display:flex] [align-items:center] [gap:10px] [padding:6px_0]">
                            <span className="[color:#D70808]" dangerouslySetInnerHTML={{ __html: CHECK_SVG.replace('width="28"', 'width="18"').replace('height="28"', 'height="18"') }} />
                            <span className="[font-size:13px] [color:#151515]">{f}</span>
                          </div>
                        ))}
                        <a href={wa(`Halo Admin Full Bright Indonesia. Saya mau daftar paket ${card.name} Dibimbing Tutor.`)} target="_blank" rel="noopener noreferrer" data-random-wa="true" className="[display:flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:12px_24px] [font-size:15px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none] [margin-top:16px]">
                          🎓 Pilih {card.name}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legalitas */}
                <div className="[max-width:800px] [margin:40px_auto_0] [padding:24px_32px] [background:#fafafa] [border:1px_solid_#e5e7eb] [border-radius:18px]">
                  <h3 className="[margin:0_0_12px] [font-size:16px] [font-weight:900] [color:#151515]">📋 Legalitas Full Bright Indonesia</h3>
                  <div className="[display:grid] [grid-template-columns:1fr_1fr] [gap:8px] max-[600px]:[grid-template-columns:1fr]">
                    {[
                      'SK Kemenkumham RI Nomor AHU-0055720-AH.0114 Tahun 2020',
                      'SK Izin Operasional LKP 503/20177/LKP/DPM-PTSP/8/2024',
                      'NPSN Nomor K9998700',
                      'Kerja sama dengan IIEF Jakarta',
                    ].map(l => (
                      <div key={l} className="[display:flex] [align-items:center] [gap:8px]">
                        <span className="[color:#D70808]" dangerouslySetInnerHTML={{ __html: CHECK_SVG.replace('width="28"', 'width="16"').replace('height="28"', 'height="16"') }} />
                        <span className="[font-size:13px] [color:#374151]">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Fragment>
            )}
          </section>


          {/* ===== FAQ ===== */}
          <section id="faq" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[text-align:center] [margin-bottom:32px]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Pertanyaan umum</p>
              <h2 className="[margin:0] [font-size:clamp(24px,3.2vw,34px)] [line-height:1.2] [font-weight:900] [color:#151515]">Pertanyaan yang Sering Diajukan</h2>
            </div>

            {/* Category pills */}
            <div className="[max-width:700px] [margin:0_auto_24px] [display:flex] [flex-wrap:wrap] [gap:8px] [justify-content:center]">
              <button style={faqCatStyle(faqCat === null)} onClick={() => setFaqCat(null)}>Semua</button>
              {FAQ_CATS.map(c => (
                <button key={c} style={faqCatStyle(faqCat === c)} onClick={() => setFaqCat(c)}>{c}</button>
              ))}
            </div>

            {/* FAQ items */}
            <div className="[max-width:700px] [margin:0_auto]">
              {FAQ.map((item, i) => (
                <div key={i} style={faqItemContainerStyle(openFaq, i)}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="[cursor:pointer] [width:100%] [background:none] [border:none] [display:flex] [align-items:flex-start] [justify-content:space-between] [text-align:left] [padding:20px_0] [gap:16px]">
                    <span style={faqQStyle(openFaq === i)}>{item.q}</span>
                    <span style={faqChevronStyle(openFaq === i)}>▼</span>
                  </button>
                  {openFaq === i && (
                    <div className="[padding:0_32px_24px_0]">
                      <p className="[margin:0] [font-size:14px] [line-height:1.6] [color:#3d3d3d] [white-space:pre-line]">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="[max-width:512px] [margin:0_auto] [text-align:center]">
              <p className="[margin:0_0_24px] [font-size:14px] [font-weight:600] [color:#3d3d3d]">Masih ada pertanyaan lain? Hubungi kami sekarang.</p>
              <div className="[display:flex] [flex-wrap:wrap] [gap:12px] [justify-content:center]">
                <a href={wa('Halo Admin Full Bright Indonesia. Saya minat mau daftar kelas TOEFL. Saya mau tanya-tanya dulu.')} target="_blank" rel="noopener noreferrer" data-random-wa="true" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#D70808] [box-shadow:0_4px_20px_rgba(215,8,8,0.35)] [text-decoration:none]">
                  Chat Via WA 💬
                </a>
                <a href="#testimonials" className="[display:inline-flex] [align-items:center] [justify-content:center] [gap:8px] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#151515] [border:2px_solid_#D70808] [text-decoration:none]">
                  Lihat Bukti Alumni 🎓
                </a>
              </div>
            </div>
          </section>

          {/* ===== SURVEY ===== */}
          <section id="survey" className="[padding:64px_24px] [background:#fff] [max-width:1152px] [margin:0_auto]">
            <div className="[max-width:600px] [margin:0_auto] [text-align:center]">
              <p className="[margin:0_0_8px] [font-size:11px] [font-weight:700] [letter-spacing:0.08em] [text-transform:uppercase] [color:#D70808]"> Survey singkat</p>
              <h2 className="[margin:0_0_8px] [font-size:clamp(22px,2.8vw,30px)] [line-height:1.3] [font-weight:900] [color:#151515]">Apa alasan utama kamu belum daftar?</h2>
              <p className="[margin:0_0_24px] [font-size:14px] [color:#6b7280]">Kami bantu jawab satu per satu.</p>
            </div>

            <div className="[max-width:500px] [margin:0_auto] [display:flex] [flex-direction:column] [gap:12px]">
              {EXIT_REASONS.map((reason, i) => (
                <button key={i} style={surveyOptionStyle()} onClick={() => { window.location.href = wa(EXIT_MSGS[i]) }}>
                  <span className="[display:flex] [align-items:center] [justify-content:center] [width:28px] [height:28px] [border-radius:9999px] [background:#D70808] [color:#fff] [font-size:12px] [font-weight:900] [flex-shrink:0]">{i + 1}</span>
                  <span className="[font-size:14px] [font-weight:700] [color:#151515] [text-align:left]">{reason}</span>
                </button>
              ))}
            </div>

            <div className="[max-width:500px] [margin:24px_auto_0] [text-align:center]">
              <p className="[margin:0_0_8px] [font-size:13px] [color:#6b7280]">Terima kasih sudah mengisi survey ini. Jawabanmu sangat berharga untuk kami.</p>
            </div>
          </section>

          {/* ===== FOOTER ===== */}
          <footer className="[background:#fafafa] [border-top:1px_solid_#f3f4f6] [padding:48px_24px_24px]">
            <div className="[max-width:1152px] [margin:0_auto] [display:grid] [grid-template-columns:1.2fr_1fr_1fr_1fr] [gap:32px] max-[768px]:[grid-template-columns:1fr_1fr] max-[480px]:[grid-template-columns:1fr]">
              {/* Logo + legal */}
              <div>
                <img src="/logo/Logo-Fullbright.webp" alt="Full Bright Indonesia" className="[height:auto] [width:140px] [object-fit:contain] [margin-bottom:16px]" />
                <p className="[margin:0_0_8px] [font-size:13px] [line-height:1.6] [color:#6b7280]">Lembaga kursus resmi dengan legalitas Kemenkumham & Kemedikbud.</p>
                <p className="[margin:0] [font-size:12px] [line-height:1.5] [color:#9ca3af]">© {new Date().getFullYear()} Full Bright Indonesia. Hak cipta dilindungi.</p>
              </div>

              {/* Navigasi */}
              <div>
                <p className="[margin:0_0_12px] [font-size:14px] [font-weight:900] [color:#151515]">Navigasi</p>
                {['#hero', '#agitation', '#value', '#lms', '#proof', '#why', '#testimonials', '#pricing', '#faq'].map(id => (
                  <a key={id} href={id} className="[display:block] [font-size:13px] [color:#6b7280] [text-decoration:none] [padding:4px_0] [hover:text-D70808]">{id.replace('#', '').charAt(0).toUpperCase() + id.replace('#', '').slice(1)}</a>
                ))}
              </div>

              {/* Hubungi kami */}
              <div>
                <p className="[margin:0_0_12px] [font-size:14px] [font-weight:900] [color:#151515]">Hubungi Kami</p>
                <a href="https://wa.me/6285255499299" target="_blank" rel="noopener noreferrer" className="[display:block] [font-size:13px] [color:#6b7280] [text-decoration:none] [padding:4px_0]">WhatsApp: 0852-5549-9299</a>
                <a href="mailto:info@fullbrightindonesia.org" className="[display:block] [font-size:13px] [color:#6b7280] [text-decoration:none] [padding:4px_0]">info@fullbrightindonesia.org</a>
              </div>

              {/* Alamat */}
              <div>
                <p className="[margin:0_0_12px] [font-size:14px] [font-weight:900] [color:#151515]">Alamat</p>
                <p className="[margin:0] [font-size:13px] [line-height:1.6] [color:#6b7280]">Jl. Raya Bogor KM 30, Ciracas, Jakarta Timur, DKI Jakarta</p>
              </div>
            </div>

            <div className="[max-width:1152px] [margin:24px_auto_0] [padding-top:16px] [border-top:1px_solid_#f3f4f6] [text-align:center]">
              <p className="[margin:0] [font-size:11px] [color:#9ca3af]">Dibuat dengan ❤️ oleh Full Bright Indonesia</p>
            </div>
          </footer>

        </div>

        {/* ===== FLOATING WHATSAPP BUBBLE ===== */}
        {showWa && (
          <div className="[position:fixed] [bottom:24px] [right:24px] [z-index:60]" style={{ animation: 'fbSheetUp 0.4s ease' }}>
            <div className="[position:relative] [background:#fff] [border-radius:18px] [box-shadow:0_8px_32px_rgba(0,0,0,0.15)] [padding:16px] [display:flex] [align-items:center] [gap:12px] [max-width:300px]">
              <button onClick={() => setShowWa(false)} className="[position:absolute] [top:-8px] [right:-8px] [width:24px] [height:24px] [border-radius:9999px] [background:#e5e7eb] [border:none] [cursor:pointer] [display:flex] [align-items:center] [justify-content:center] [font-size:12px] [color:#6b7280]">✕</button>
              <img src="/assets/admin-avatar.webp" alt="Admin" className="[width:40px] [height:40px] [border-radius:9999px] [object-fit:cover] [flex-shrink:0]" />
              <div className="[flex:1] [min-width:0]">
                <p className="[margin:0_0_2px] [font-size:13px] [font-weight:800] [color:#151515]">Ms. Fini</p>
                <p className="[margin:0] [font-size:12px] [color:#6b7280] [white-space:nowrap] [overflow:hidden] [text-overflow:ellipsis]">Ada yang bisa dibantu? 😊</p>
              </div>
              <a href={wa('Halo Admin Full Bright Indonesia. Saya mau daftar kelas TOEFL.')} target="_blank" rel="noopener noreferrer" className="[flex-shrink:0] [display:flex] [align-items:center] [justify-content:center] [width:36px] [height:36px] [border-radius:9999px] [background:#25D366] [text-decoration:none]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.82-6.293-2.192l-.44-.365-2.89.967.967-2.89-.365-.44A9.965 9.965 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" /></svg>
              </a>
            </div>
          </div>
        )}

        {/* ===== EXIT-INTENT RETURN POPUP ===== */}
        {showReturn && (
          <div className="[position:fixed] [inset-0] [z-index:70] [display:flex] [align-items:center] [justify-content-center] [background:rgba(0,0,0,0.5)]" onClick={() => setShowReturn(false)} style={{ animation: 'fbFadeInUp 0.3s ease' }}>
            <div className="[background:#fff] [border-radius:24px] [padding:32px] [max-width:420px] [width:90%] [box-shadow:0_20px_60px_rgba(0,0,0,0.2)] [text-align:center]" onClick={e => e.stopPropagation()}>
              <h3 className="[margin:0_0_8px] [font-size:22px] [font-weight:900] [color:#151515]">Tunggu dulu! 🎓</h3>
              <p className="[margin:0_0_20px] [font-size:14px] [color:#6b7280]">Sebelum kamu pergi, apa alasan utama kamu belum daftar?</p>

              <div className="[display:flex] [flex-direction:column] [gap:10px] [margin-bottom:20px]">
                {EXIT_REASONS.map((reason, i) => (
                  <button key={i} onClick={() => { window.open(wa(EXIT_MSGS[i]), '_blank'); setShowReturn(false) }} className="[display:flex] [align-items:center] [gap:10px] [width:100%] [text-align:left] [padding:12px_16px] [border-radius:12px] [border:1px_solid_#e5e7eb] [background:#fafafa] [cursor:pointer] [transition:all_0.15s_ease] [hover:border-D70808]">
                    <span className="[display:flex] [align-items:center] [justify-content:center] [width:28px] [height:28px] [border-radius:9999px] [background:#D70808] [color:#fff] [font-size:12px] [font-weight:900] [flex-shrink:0]">{i + 1}</span>
                    <span className="[font-size:13px] [font-weight:700] [color:#151515]">{reason}</span>
                  </button>
                ))}
              </div>

              <a href={wa('Halo Admin Full Bright Indonesia. Saya mau daftar kelas TOEFL.')} target="_blank" rel="noopener noreferrer" className="[display:block] [font-weight:700] [border-radius:16px] [padding:14px_28px] [font-size:16px] [color:#fff] [background:#25D366] [text-decoration:none] [text-align:center]">
                💬 Chat langsung via WhatsApp
              </a>

              <button onClick={() => setShowReturn(false)} className="[margin-top:12px] [font-size:13px] [color:#6b7280] [bg-transparent] [border:none] [cursor:pointer] [underline]">Tutup</button>
            </div>
          </div>
        )}

        {/* ===== PHOTO LIGHTBOX ===== */}
        {photoIdx !== null && (
          <div className="[position:fixed] [inset:0] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [background:rgba(0,0,0,0.92)]" onClick={() => setPhotoIdx(null)}>
            <button onClick={() => setPhotoIdx(null)} className="[position:absolute] [top:16px] [right:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:28px] [cursor:pointer]">✕</button>
            <button onClick={() => setPhotoIdx(i => i !== null ? (i - 1 + SCREENSHOT_COUNT) % SCREENSHOT_COUNT : null)} className="[position:absolute] [left:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:36px] [cursor:pointer] [padding:8px]">‹</button>
            <div className="[display:flex] [flex-direction:column] [align-items:center] [gap:16px] [padding:0_64px]" onClick={e => e.stopPropagation()}>
              <div role="img" aria-label="Score" style={screenshotStyle(photoIdx)} />
              <p className="[margin:0] [font-size:14px] [color:rgba(255,255,255,0.6)]">Skor {SCREENSHOTS[photoIdx].score}</p>
              <p className="[margin:0] [font-size:12px] [color:rgba(255,255,255,0.4)]">{photoIdx + 1} / {SCREENSHOT_COUNT}</p>
            </div>
            <button onClick={() => setPhotoIdx(i => i !== null ? (i + 1) % SCREENSHOT_COUNT : null)} className="[position:absolute] [right:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:36px] [cursor:pointer] [padding:8px]">›</button>
          </div>
        )}

        {/* ===== REVIEW LIGHTBOX ===== */}
        {reviewIdx !== null && (
          <div className="[position:fixed] [inset-0] [z-index:50] [display:flex] [align-items:center] [justify-content:center] [background:rgba(0,0,0,0.92)]" onClick={() => setReviewIdx(null)}>
            <button onClick={() => setReviewIdx(null)} className="[position:absolute] [top:16px] [right:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:28px] [cursor:pointer]">✕</button>
            <button onClick={() => setReviewIdx(i => i !== null ? (i - 1 + R_COUNT) % R_COUNT : null)} className="[position:absolute] [left:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:36px] [cursor:pointer] [padding:8px]">‹</button>
            <div className="[display:flex] [flex-direction:column] [align-items:center] [gap:16px] [padding:0_64px]" onClick={e => e.stopPropagation()}>
              <div role="img" aria-label="Review" style={reviewPhotoStyle(reviewIdx)} />
              <p className="[margin:0] [font-size:12px] [color:rgba(255,255,255,0.4)]">{reviewIdx + 1} / {R_COUNT}</p>
            </div>
            <button onClick={() => setReviewIdx(i => i !== null ? (i + 1) % R_COUNT : null)} className="[position:absolute] [right:16px] [background:none] [border:none] [color:rgba(255,255,255,0.7)] [font-size:36px] [cursor:pointer] [padding:8px]">›</button>
          </div>
        )}

      </div>
    </Fragment>
  )
}
