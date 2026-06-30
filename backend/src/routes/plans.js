import { Router } from 'express'
import { AGENT_BOUNTY_KZ, OWNER_PLANS, PAYMENT_PROVIDER, SUPPORT_PLANS } from '../data/plans.js'

const router = Router()

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    currency: 'AOA',
    currencyLabel: 'Kwanza (Kz)',
    payment: PAYMENT_PROVIDER,
    ownerPlans: OWNER_PLANS,
    supportPlans: SUPPORT_PLANS,
    agentBounty: AGENT_BOUNTY_KZ,
  })
})

export default router
