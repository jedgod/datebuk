// API Route: POST /api/admin/bulk-video-action
// Handle bulk approve, interrupt, or escalate on video sessions

import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'

const router: Router = Router()

interface BulkActionRequest {
  ids: string[]
  action: 'approve' | 'interrupt' | 'escalate'
  reason?: string
}

router.post('/', async (req: Request<Record<string, never>, Record<string, never>, BulkActionRequest>, res: Response) => {
  try {
    const { ids, action, reason } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' })
    }

    if (!['approve', 'interrupt', 'escalate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }

    console.log(`[Bulk Action] ${action} on ${ids.length} sessions`)

    let updateData: any = {}

    if (action === 'approve') {
      updateData = {
        status: 'reviewed',
        reviewedAt: new Date(),
      }
    } else if (action === 'interrupt') {
      updateData = {
        status: 'interrupted',
        interruptedAt: new Date(),
      }
    } else if (action === 'escalate') {
      updateData = {
        status: 'escalated',
        escalatedAt: new Date(),
        escalationReason: reason,
      }
    }

    // Update all matching sessions
    const result = await prisma.videoSession.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    })

    console.log(`[Bulk Action] Updated ${result.count} records`)

    // TODO: Emit WebSocket broadcast for real-time frontend update
    // io.emit('video:bulk-action', { action, ids, count: result.count })

    res.json({
      success: true,
      action,
      count: result.count,
    })
  } catch (err) {
    console.error('[Bulk Action] Error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
