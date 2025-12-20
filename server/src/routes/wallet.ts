import { Router } from "express";
import { walletController } from "../controllers/wallet.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", walletController.getWallet);
router.get("/transactions", walletController.getTransactions);
router.get("/stats", walletController.getWalletStats);
router.get("/withdrawals", walletController.getWithdrawals);
router.post("/withdrawals", walletController.requestWithdrawal);
router.patch("/withdrawals/:withdrawalId/cancel", walletController.cancelWithdrawal);

router.get("/admin/withdrawals", walletController.getAllWithdrawals);
router.patch("/admin/withdrawals/:withdrawalId/process", walletController.processWithdrawal);

// Company wallet routes (admin only)
router.get("/admin/company", walletController.getCompanyWallet);
router.get("/admin/company/transactions", walletController.getCompanyTransactions);


export default router;
