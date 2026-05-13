import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ============================================================
//  Kokoro — branded PDF mood report
//  ----------------------------------------------------------
//  Snapshots the StatsView card with html2canvas, then composes
//  an A4 portrait PDF: branded header → captured stats image →
//  two-line footer (heart line + Sinoir Technologies studio mark).
//  Saves as kokoro-mood-report.pdf.
//
//  html2canvas 1.4.x cannot parse oklch(); the `is-printing` class
//  on the captured element swaps every design-token to a hex / rgba
//  equivalent for the duration of the snapshot.
// ============================================================

const FILENAME = 'kokoro-mood-report.pdf'
const PRINTING_CLASS = 'is-printing'
const STUDIO = 'SINOIR  TECHNOLOGIES'

// RGB triples for jsPDF (it doesn't accept hex strings reliably).
const PDF_BG: [number, number, number] = [26, 19, 38]
const PDF_TEXT: [number, number, number] = [243, 237, 222]
const PDF_MUTED: [number, number, number] = [192, 183, 168]
const PDF_FAINT: [number, number, number] = [150, 139, 126]
const PDF_STUDIO: [number, number, number] = [186, 172, 153]
const PDF_RULE: [number, number, number] = [70, 56, 90]

export interface ExportArgs {
  /** The .card element to snapshot. */
  element: HTMLElement
  /** Localized "Mood report" subhead text. */
  reportLabel: string
  /** Localized date-range label (e.g. "7 days"). */
  rangeLabel: string
  /** Localized footer line (e.g. "Made with love · Kokoro"). */
  footerLabel: string
}

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()))
}

async function snapshotElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  el.classList.add(PRINTING_CLASS)
  await nextFrame()
  await nextFrame()
  try {
    return await html2canvas(el, {
      scale: Math.max(2, window.devicePixelRatio || 1),
      backgroundColor: '#1f1828',
      useCORS: true,
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    })
  } finally {
    el.classList.remove(PRINTING_CLASS)
  }
}

function formatDate(): string {
  return new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export async function exportMoodReport(args: ExportArgs): Promise<void> {
  const captured = await snapshotElement(args.element)
  const imgData = captured.toDataURL('image/png')

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 14
  const centerX = pageW / 2

  // --- Background ---
  pdf.setFillColor(...PDF_BG)
  pdf.rect(0, 0, pageW, pageH, 'F')

  // --- Header --------------------------------------------------------
  // Wordmark "Kokoro" + kanji on the left, range + date on the right.
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(24)
  pdf.setTextColor(...PDF_TEXT)
  pdf.text('Kokoro', margin, margin + 9)

  // Kanji to the right of the wordmark (Helvetica won't render kana,
  // but jsPDF falls back gracefully and the bullet still anchors the
  // line visually).
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(14)
  pdf.setTextColor(...PDF_MUTED)
  pdf.text('·', margin + 28, margin + 9)

  // Subhead — localized report label + range.
  pdf.setFontSize(10)
  pdf.setTextColor(...PDF_MUTED)
  pdf.text(
    `${args.reportLabel} · ${args.rangeLabel}`,
    margin,
    margin + 16,
  )

  // Date in the top-right.
  pdf.text(formatDate(), pageW - margin, margin + 16, { align: 'right' })

  // Hairline divider under the header block.
  pdf.setDrawColor(...PDF_RULE)
  pdf.setLineWidth(0.2)
  pdf.line(margin, margin + 19, pageW - margin, margin + 19)

  // --- Footer zone (reserved before placing the image) --------------
  // Two lines: heart message above, studio mark below.
  const FOOTER_HEIGHT = 14
  const footerTop = pageH - margin - FOOTER_HEIGHT

  // --- Captured stats image ----------------------------------------
  const imageTopY = margin + 24
  const maxImgH = footerTop - imageTopY - 4
  const maxImgW = pageW - 2 * margin

  const ratio = captured.width / captured.height
  let imgW = maxImgW
  let imgH = imgW / ratio
  if (imgH > maxImgH) {
    imgH = maxImgH
    imgW = imgH * ratio
  }
  const imgX = (pageW - imgW) / 2
  pdf.addImage(imgData, 'PNG', imgX, imageTopY, imgW, imgH)

  // --- Footer -------------------------------------------------------
  // Hairline divider above the footer.
  pdf.setDrawColor(...PDF_RULE)
  pdf.setLineWidth(0.2)
  pdf.line(margin, footerTop, pageW - margin, footerTop)

  // Heart line — localized.
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(8.5)
  pdf.setTextColor(...PDF_FAINT)
  pdf.text(args.footerLabel, centerX, footerTop + 5.5, { align: 'center' })

  // Studio mark.
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...PDF_STUDIO)
  pdf.text(STUDIO, centerX, footerTop + 11, { align: 'center' })

  pdf.save(FILENAME)
}
