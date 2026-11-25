// DISABLED: Schema mismatch
// VideoSession model missing: users, priority, lastMessageSnippet fields

import { Router, Request, Response } from 'express'

const router: Router = Router()

router.all('*', (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Endpoint disabled',
    message: 'Schema mismatch - needs VideoSession model update'
  })
})

export { router }
