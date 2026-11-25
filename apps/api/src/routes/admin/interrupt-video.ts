// API Route: POST /api/admin/interrupt-video
// Interrupt one or more live video sessions

import { Router, Request, Response } from 'express'
import { prisma } from '@/lib/prisma'

const router: Router = Router()

interface InterruptRequest {
  ids: string[]
}

router.post('/', async (req: Request<Record<string, never>, Record<string, never>, InterruptRequest>, res: Response) => {
  try {
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ids array' })
    }

    console.log(`[Interrupt] Interrupting ${ids.length} sessions:`, ids)

    // 1. Update DB status
    const result = await prisma.videoSession.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'INTERRUPTED',
        interruptedAt: new Date(),
      },
    })

    console.log(`[Interrupt] Updated ${result.count} records`)

    // 2. TODO: Emit WebSocket event to broadcast interruption
    // Example: io.emit('video:interrupted', { ids, timestamp: new Date() })

    // 3. TODO: Trigger disconnect via video service (Agora, Twilio, etc.)
    // Example: await agoraService.disconnectUsersFromSession(ids)

    res.json({
      success: true,
      interrupted: result.count,
    })
  } catch (err) {
    console.error('[Interrupt] Error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
