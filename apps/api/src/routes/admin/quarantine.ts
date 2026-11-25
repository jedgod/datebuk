// Enhanced Admin Quarantine API Route
// DISABLED - Schema mismatch: 'quarantinedVideo' model does not exist in Prisma schema

import { Router, Request, Response } from 'express'

const router: Router = Router()

// All quarantine endpoints disabled due to missing database model
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.post('/:videoId/quarantine', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.post('/:id/restore', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.post('/:id/release', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.post('/:id/delete', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.post('/:id/escalate', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

router.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json({
    error: 'Schema mismatch',
    message: 'Quarantine endpoints disabled - quarantinedVideo Prisma model not found',
    status: 501,
  })
})

export default router
