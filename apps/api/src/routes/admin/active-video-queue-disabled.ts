// DISABLED: Schema mismatch
// Original file: active-video-queue.ts
// Issue: VideoSession model doesn't have fields: users, priority, lastMessageSnippet
// This file needs to be updated to match the current schema before re-enabling

import { Router, Request, Response } from 'express'

const router: Router = Router()

router.all('*', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Active Video Queue endpoint disabled',
    reason: 'Schema mismatch - needs VideoSession model update',
    message: 'This endpoint requires: users field, priority field, lastMessageSnippet field'
  })
})

export { router }
