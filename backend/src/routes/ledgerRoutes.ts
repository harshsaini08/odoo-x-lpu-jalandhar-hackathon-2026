import { Router } from 'express';
import { getLedger, exportLedgerCsv } from '../controllers/ledgerController';

const router = Router();

router.get('/', getLedger);
router.get('/export', exportLedgerCsv);

export default router;
