import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth";
import { sendError, sendSuccess } from "../../utils/response";
import { loginSchema, googleAuthSchema } from "./validation";
import {
  loginUser,
  authenticateGoogleUser,
  getCurrentUserProfile,
  AppError,
} from "./service";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_CALLBACK_URL,
);

function formatZodErrors(error: any) {
  const issues = error.issues || error.errors || [];
  return issues.map((e: any) => ({
    field: e.path.join("."),
    issue: e.message,
  }));
}

export async function handleLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        formatZodErrors(parseResult.error),
      );
    }

    const { email, password } = parseResult.data;
    const result = await loginUser(email, password);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(
        res,
        error.code,
        error.message,
        error.status,
        error.details,
      );
    }
    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      (error as Error).message,
      500,
    );
  }
}

export async function handleGoogleAuth(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        "VALIDATION_ERROR",
        "Validation failed",
        400,
        formatZodErrors(parseResult.error),
      );
    }

    const { idToken } = parseResult.data;
    const result = await authenticateGoogleUser(idToken);
    return sendSuccess(res, result, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(
        res,
        error.code,
        error.message,
        error.status,
        error.details,
      );
    }
    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      (error as Error).message,
      500,
    );
  }
}

export function handleGoogleLogin(req: AuthenticatedRequest, res: Response) {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_CALLBACK_URL
  ) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_not_configured`);
  }

  return res.redirect(
    googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
    }),
  );
}

export async function handleGoogleCallback(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (
      !env.GOOGLE_CLIENT_ID ||
      !env.GOOGLE_CLIENT_SECRET ||
      !env.GOOGLE_CALLBACK_URL
    ) {
      return res.redirect(
        `${env.CLIENT_URL}/login?error=google_not_configured`,
      );
    }

    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;
    if (!code) {
      return res.redirect(`${env.CLIENT_URL}/login?error=missing_google_code`);
    }

    const { tokens } = await googleClient.getToken(code);
    if (!tokens.id_token) {
      return res.redirect(`${env.CLIENT_URL}/login?error=missing_google_token`);
    }

    const result = await authenticateGoogleUser(tokens.id_token);
    return res.redirect(
      `${env.CLIENT_URL}/login?token=${encodeURIComponent(result.token)}`,
    );
  } catch (error: any) {
    console.error("[Google OAuth Callback Error]:", error);
    const message =
      error instanceof AppError ? error.code : (error?.message || "google_auth_failed");
    return res.redirect(
      `${env.CLIENT_URL}/login?error=${encodeURIComponent(message)}`,
    );
  }
}

export async function handleMe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!req.user || !userId) {
      return sendError(res, "UNAUTHORIZED", "Authentication required", 401);
    }

    const profile = await getCurrentUserProfile(userId);
    return sendSuccess(res, profile, 200);
  } catch (error: any) {
    if (error instanceof AppError) {
      return sendError(
        res,
        error.code,
        error.message,
        error.status,
        error.details,
      );
    }
    return sendError(
      res,
      "INTERNAL_SERVER_ERROR",
      (error as Error).message,
      500,
    );
  }
}
