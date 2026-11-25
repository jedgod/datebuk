// API Route: GET /api/admin/moderator-stats
// DISABLED - Schema mismatch: VideoSession model missing 'reviewedAt' field
// and invalid status enum values

import { Router, Request, Response } from 'express'

const router: Router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Moderator stats endpoint disabled - VideoSession model missing required fields (reviewedAt)',
    status: 501,
  })
})

export default router
