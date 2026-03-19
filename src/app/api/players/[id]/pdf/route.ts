import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { calculateAge, unwrapRelation } from '@/lib/utils'
import { format } from 'date-fns'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
  }

  const supabase = await createClient()

  // Auth check — must be logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch player with all relevant data
  const { data: player, error } = await supabase
    .from('players')
    .select(
      `
      id, name, position, date_of_birth, nationality, preferred_foot,
      height_cm, weight_kg, platform_id, status,
      club:clubs!players_club_id_fkey ( name ),
      skills:player_skills ( overall, attack, defence, fitness, dribbling, shooting, possession, tackling, positioning, matches_counted ),
      club_history:player_club_history (
        joined_at, left_at,
        club:clubs!player_club_history_club_id_fkey ( name )
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  type CameraSkills = {
    overall: number | null
    attack: number | null
    defence: number | null
    fitness: number | null
    dribbling: number | null
    shooting: number | null
    possession: number | null
    tackling: number | null
    positioning: number | null
    matches_counted: number | null
  }
  const club = unwrapRelation(player.club)
  const skills = unwrapRelation(player.skills as unknown as CameraSkills | CameraSkills[])
  const clubHistory = (Array.isArray(player.club_history) ? player.club_history : [])
    .map((h) => ({ ...h, club: unwrapRelation(h.club) }))
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())

  const age = calculateAge(player.date_of_birth)

  // Generate PDF
  const doc = new PDFDocument({ size: 'A4', margin: 50 })
  const chunks: Buffer[] = []

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  const pdfReady = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // --- Header ---
  doc.fontSize(22).font('Helvetica-Bold').text(player.name, { align: 'left' })
  doc.moveDown(0.3)

  const tagParts: string[] = [player.position]
  if (club?.name) tagParts.push(club.name)
  if (player.platform_id) tagParts.push(player.platform_id)
  doc.fontSize(11).font('Helvetica').fillColor('#666666').text(tagParts.join('  |  '))
  doc.fillColor('#000000')

  // Divider
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke()
  doc.moveDown(0.8)

  // --- Player Info Grid ---
  doc.fontSize(13).font('Helvetica-Bold').text('Player Information')
  doc.moveDown(0.4)

  const infoRows: [string, string][] = [
    ['Position', player.position],
    ['Age', `${age} years`],
    ['Nationality', player.nationality ?? '-'],
    ['Preferred Foot', player.preferred_foot ?? '-'],
    ['Height', player.height_cm ? `${player.height_cm} cm` : '-'],
    ['Weight', player.weight_kg ? `${player.weight_kg} kg` : '-'],
    ['Status', player.status === 'free_agent' ? 'Free Agent' : 'Active'],
    ['Club', club?.name ?? 'Free Agent'],
  ]

  const col1X = 50
  const col2X = 170
  const col3X = 310
  const col4X = 430

  for (let i = 0; i < infoRows.length; i += 2) {
    const y = doc.y
    // Left pair
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#888888')
      .text(infoRows[i][0], col1X, y, { width: 120 })
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text(infoRows[i][1], col2X, y, { width: 130 })
    // Right pair (if exists)
    if (infoRows[i + 1]) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#888888')
        .text(infoRows[i + 1][0], col3X, y, { width: 120 })
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#000000')
        .text(infoRows[i + 1][1], col4X, y, { width: 130 })
    }
    doc.x = col1X
    doc.moveDown(0.6)
  }

  // --- Skills ---
  if (skills) {
    doc.x = col1X
    doc.moveDown(0.5)
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Skills (Camera-Verified, 1-10)', col1X)
    doc.moveDown(0.4)

    const skillEntries: [string, number | null][] = [
      ['Overall', skills.overall],
      ['Attack', skills.attack],
      ['Defence', skills.defence],
      ['Fitness', skills.fitness],
      ['Dribbling', skills.dribbling],
      ['Shooting', skills.shooting],
      ['Possession', skills.possession],
      ['Tackling', skills.tackling],
    ]

    const skillY = doc.y
    const skillColWidth = 62

    skillEntries.forEach(([label, value], idx) => {
      const x = col1X + idx * skillColWidth
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#888888')
        .text(label, x, skillY, { width: skillColWidth })
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(String(value ?? '-'), x, skillY + 12, { width: skillColWidth })
    })

    doc.x = col1X
    doc.y = skillY + 35

    if (skills.matches_counted && skills.matches_counted > 0) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#888888')
        .text(`Based on ${skills.matches_counted} matches`, col1X)
    }
  }

  // --- Career History ---
  if (clubHistory.length > 0) {
    doc.x = col1X
    doc.moveDown(0.8)
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text('Career History', col1X)
    doc.moveDown(0.4)

    for (const entry of clubHistory) {
      const entryClubName = entry.club?.name ?? 'Unknown'
      const from = format(new Date(entry.joined_at), 'MMM yyyy')
      const to = entry.left_at ? format(new Date(entry.left_at), 'MMM yyyy') : 'Present'

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(entryClubName, col1X, doc.y, { continued: true })
      doc.font('Helvetica').fillColor('#888888').text(`   ${from} — ${to}`)
      doc.moveDown(0.3)

      if (doc.y > 720) {
        doc.addPage()
      }
    }
  }

  // --- Footer ---
  const footerY = Math.max(doc.y + 40, 760)
  if (footerY > 750) doc.addPage()
  const finalFooterY = footerY > 750 ? 50 : footerY

  doc
    .moveTo(50, finalFooterY)
    .lineTo(545, finalFooterY)
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .stroke()
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#999999')
    .text(
      `Generated from Georgian Football Talent Platform — ${format(new Date(), 'MMMM d, yyyy')}`,
      50,
      finalFooterY + 8,
      { align: 'center' }
    )

  doc.end()

  const pdfBuffer = await pdfReady

  const safeName = player.name.replace(/[^a-zA-Z0-9]/g, '_')

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}_Profile.pdf"`,
    },
  })
}
