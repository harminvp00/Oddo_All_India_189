import { Router } from "express";

import { authenticate, requireRole } from "../../middleware/auth";

import {
  approveLeaveRequest,
  cancelLeaveRequest,
  createAllocation,
  createLeaveRequest,
  createLeaveType,
  deleteLeaveType,
  getAllocation,
  getLeaveRequest,
  listAllocations,
  listLeaveRequests,
  listLeaveTypes,
  rejectLeaveRequest,
  updateAllocation,
  updateLeaveType,
} from "./controller";

const router = Router();

// All time-off endpoints require authentication.
router.use(authenticate);

// ============================================================
// LEAVE TYPES
// ============================================================

// GET /api/leave-types
router.get("/leave-types", listLeaveTypes);

// POST /api/leave-types
router.post(
  "/leave-types",
  requireRole(["HR_MANAGER", "ADMIN"]),
  createLeaveType,
);

// PATCH /api/leave-types/:id
router.patch(
  "/leave-types/:id",
  requireRole(["HR_MANAGER", "ADMIN"]),
  updateLeaveType,
);

// DELETE /api/leave-types/:id
router.delete(
  "/leave-types/:id",
  requireRole(["HR_MANAGER", "ADMIN"]),
  deleteLeaveType,
);

// ============================================================
// LEAVE ALLOCATIONS
// ============================================================

// GET /api/leave-allocations
router.get("/leave-allocations", listAllocations);

// GET /api/leave-allocations/:id
router.get("/leave-allocations/:id", getAllocation);

// POST /api/leave-allocations
router.post(
  "/leave-allocations",
  requireRole(["HR_MANAGER", "ADMIN"]),
  createAllocation,
);

// PATCH /api/leave-allocations/:id
router.patch(
  "/leave-allocations/:id",
  requireRole(["HR_MANAGER", "ADMIN"]),
  updateAllocation,
);

// ============================================================
// LEAVE REQUESTS
// ============================================================

// GET /api/leave-requests
router.get("/leave-requests", listLeaveRequests);

// GET /api/leave-requests/:id
router.get("/leave-requests/:id", getLeaveRequest);

// POST /api/leave-requests
// All authenticated roles may create a request for themselves.
// The controller derives employeeId from JWT.
router.post("/leave-requests", createLeaveRequest);

// POST /api/leave-requests/:id/approve
router.post(
  "/leave-requests/:id/approve",
  requireRole([
    "HR_MANAGER",
    "HR_PAYROLL_USER",
    "HR_PAYROLL_MANAGER",
    "ADMIN",
  ]),
  approveLeaveRequest,
);

// POST /api/leave-requests/:id/reject
router.post(
  "/leave-requests/:id/reject",
  requireRole([
    "HR_MANAGER",
    "HR_PAYROLL_USER",
    "HR_PAYROLL_MANAGER",
    "ADMIN",
  ]),
  rejectLeaveRequest,
);

// POST /api/leave-requests/:id/cancel
// Controller enforces "own request" using employeeId.
router.post(
  "/leave-requests/:id/cancel",
  cancelLeaveRequest,
);

export default router;
