import { Router } from "express";
import { employeeController } from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router = Router();

const managerRoles = ["ADMIN", "HR_MANAGER", "HR_PAYROLL_MANAGER"] as const;
const allRoles = ["EMPLOYEE", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"] as const;

router.post(
  "/",
  authenticate,
  requireRole([...managerRoles]),
  employeeController.create,
);

router.get(
  "/",
  authenticate,
  requireRole([...allRoles]),
  employeeController.list,
);

router.get(
  "/:id",
  authenticate,
  requireRole([...allRoles]),
  employeeController.getById,
);

router.patch(
  "/:id",
  authenticate,
  requireRole([...managerRoles]),
  employeeController.update,
);

router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN", "HR_MANAGER"]),
  employeeController.delete,
);

export default router;
