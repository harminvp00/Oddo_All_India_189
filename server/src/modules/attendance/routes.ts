
import { Router } from "express";
import { attendanceController } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router = Router();

const authenticatedRoles = [
  "EMPLOYEE",
  "HR_MANAGER",
  "HR_PAYROLL_USER",
  "HR_PAYROLL_MANAGER",
  "ADMIN",
] as const;

router.post(
  "/check-in",
  authenticate,
  requireRole([...authenticatedRoles]),
  attendanceController.checkIn,
);

router.post(
  "/check-out",
  authenticate,
  requireRole([...authenticatedRoles]),
  attendanceController.checkOut,
);

router.get(
  "/",
  authenticate,
  requireRole([...authenticatedRoles]),
  attendanceController.list,
);

router.get(
  "/:id",
  authenticate,
  requireRole([...authenticatedRoles]),
  attendanceController.getById,
);

router.patch(
  "/:id",
  authenticate,
  requireRole(["HR_MANAGER", "ADMIN"]),
  attendanceController.correct,
);

export default router;
