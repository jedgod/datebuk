import { Router, Request, Response } from 'express'

const router: Router = Router()

router.all('*', (req: Request, res: Response) => {
  res.status(501).json({ error: 'Filter presets not implemented' })
})

export default router
