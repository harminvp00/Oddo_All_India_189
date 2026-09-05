import crypto from "crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import prisma from "../../config/database";
import { env } from "../../config/env";
import { signToken } from "../../utils/jwt";

export class AppError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(code: string, message: string, status = 400, details?: any) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function loginUser(email: string, password: string) {
  const user = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
    include: { employees: true },
  });

  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 400);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 400);
  }

  if (user.status === "DISABLED") {
    throw new AppError(
      "ACCOUNT_DISABLED",
      "Account is disabled. Please contact system administrator.",
      403,
    );
  }

  // Update last login timestamp
  await prisma.users.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  const employeeId = user.employees ? user.employees.id.toString() : null;
  const token = signToken({
    userId: user.id.toString(),
    email: user.email,
    role: user.role,
    employeeId,
  });

  return {
    token,
    user: {
      id: user.id.toString(),
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      avatar_url: user.avatar_url,
      role: user.role,
      status: user.status,
      employeeId,
    },
  };
}

export async function authenticateGoogleUser(idToken: string) {
  let googleEmail: string | undefined;
  let googleSub: string | undefined;
  let googleName: string | undefined;
  let googlePicture: string | undefined;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    googleEmail = payload?.email;
    googleSub = payload?.sub;
    googleName = payload?.name;
    googlePicture = payload?.picture;
  } catch (error) {
    throw new AppError(
      "INVALID_GOOGLE_TOKEN",
      "Failed to verify Google ID Token",
      400,
    );
  }

  if (!googleEmail) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Google token payload does not contain email",
      400,
    );
  }

  const normalizedEmail = googleEmail.toLowerCase();
  let user: any = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    include: { employees: true },
  });

  // If user does not exist in database, auto-provision user and linked employee record
  if (!user) {
    const randomPassword = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const displayName = (googleName || normalizedEmail.split("@")[0] || "User").trim().slice(0, 120);
    const nameParts = displayName.split(" ");
    const firstName = (nameParts[0] || "User").slice(0, 80);
    const lastName = (nameParts.slice(1).join(" ") || "Google").slice(0, 80);
    const employeeCode = `EMP-G${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;

    const newUser = await prisma.users.create({
      data: {
        email: normalizedEmail,
        full_name: displayName,
        password_hash: passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        avatar_url: googlePicture || null,
      },
    });

    let newEmployee = null;
    try {
      newEmployee = await prisma.employees.create({
        data: {
          user_id: newUser.id,
          employee_code: employeeCode,
          first_name: firstName,
          last_name: lastName,
          hire_date: new Date(),
          employee_type: "FULL_TIME",
          employment_status: "ACTIVE",
        },
      });
    } catch (empErr) {
      console.warn("Could not auto-create employee profile for Google user:", empErr);
    }

    user = {
      ...newUser,
      employees: newEmployee,
    };
  }

  if (user.status === "DISABLED") {
    throw new AppError(
      "ACCOUNT_DISABLED",
      "Account is disabled. Please contact system administrator.",
      403,
    );
  }

  // Link to auth_identities if not already linked
  if (googleSub) {
    try {
      const existingIdentity = await prisma.auth_identities.findFirst({
        where: {
          OR: [
            { user_id: user.id, provider: "GOOGLE" },
            { provider: "GOOGLE", provider_subject: googleSub },
          ],
        },
      });

      if (!existingIdentity) {
        await prisma.auth_identities.create({
          data: {
            user_id: user.id,
            provider: "GOOGLE",
            provider_subject: googleSub,
            provider_email: normalizedEmail,
          },
        });
      }
    } catch (authErr) {
      console.warn("Could not link auth_identities for Google user:", authErr);
    }
  }

  // Update last login timestamp
  try {
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        full_name: googleName ? googleName.slice(0, 120) : user.full_name,
        avatar_url: googlePicture || user.avatar_url,
      },
    });
  } catch (updateErr) {
    console.warn("Could not update last_login_at for Google user:", updateErr);
  }

  const employeeId = user.employees ? user.employees.id.toString() : null;
  const token = signToken({
    userId: user.id.toString(),
    email: user.email,
    role: user.role,
    employeeId,
  });

  return {
    token,
    user: {
      id: user.id.toString(),
      email: user.email,
      fullName: googleName || user.full_name,
      avatarUrl: googlePicture || user.avatar_url,
      avatar_url: googlePicture || user.avatar_url,
      role: user.role,
      status: user.status,
      employeeId,
    },
  };
}

export async function getCurrentUserProfile(userId: string) {
  const bigintId = BigInt(userId);
  const user = await prisma.users.findUnique({
    where: { id: bigintId },
    include: {
      employees: {
        select: {
          id: true,
          employee_code: true,
          department_id: true,
          position_id: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "User profile not found", 404);
  }

  return {
    id: user.id.toString(),
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    avatar_url: user.avatar_url,
    role: user.role,
    status: user.status,
    employee: user.employees
      ? {
          id: user.employees.id.toString(),
          employeeCode: user.employees.employee_code,
          departmentId: user.employees.department_id
            ? user.employees.department_id.toString()
            : null,
          positionId: user.employees.position_id
            ? user.employees.position_id.toString()
            : null,
        }
      : null,
  };
}
