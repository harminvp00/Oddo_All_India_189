import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { getPayrollDashboard } from "./controller";

const router = Router();

router.use(authenticate);
router.get(
  "/payroll",
  requireRole(["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"]),
  getPayrollDashboard,
);

export default router;
