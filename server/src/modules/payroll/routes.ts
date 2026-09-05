import { Router } from "express";
import * as c from "./controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router = Router();
router.use(authenticate);

const read = requireRole(["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"]);
const write = requireRole(["HR_PAYROLL_MANAGER", "ADMIN"]);
const run = requireRole(["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"]);

router.get("/salary-rules", read, c.listSalaryRules);
router.get("/salary-rules/:id", read, c.getSalaryRule);
router.post("/salary-rules", write, c.createSalaryRule);
router.patch("/salary-rules/:id", write, c.updateSalaryRule);
router.delete("/salary-rules/:id", write, c.deleteSalaryRule);

router.get("/salary-structures", read, c.listSalaryStructures);
router.get("/salary-structures/:id", read, c.getSalaryStructure);
router.post("/salary-structures", write, c.createSalaryStructure);
router.patch("/salary-structures/:id", write, c.updateSalaryStructure);
router.delete("/salary-structures/:id", write, c.deleteSalaryStructure);

router.get("/payruns/eligible-employees", run, c.eligibleEmployees);
router.post("/payruns", run, c.createPayrun);
router.post("/payruns/:id/compute", run, c.computePayrun);
router.post("/payruns/:id/validate", run, c.validatePayrun);
router.post("/payruns/:id/pay", run, c.payPayrun);

export default router;
