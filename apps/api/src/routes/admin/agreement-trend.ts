// DISABLED: Schema mismatch
// VideoSession model missing: reviewedAt field

import { Router, Request, Response } from 'express'

const router: Router = Router()

router.all('*', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Endpoint disabled',
    message: 'Schema mismatch - needs VideoSession model update'
  })
})

export default router
