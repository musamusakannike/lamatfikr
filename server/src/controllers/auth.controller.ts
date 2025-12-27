import type { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";

import { UserModel } from "../models/user.model";
import { AuthProvider, Gender } from "../models/common";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { generateVerificationToken } from "../utils/crypto";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from "../services/email";
import { getFirebaseUserInfo } from "../config/firebase";
import {
  registerSchema,
  loginSchema,
  socialAuthSchema,
  completeSocialProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";

const SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);

const videoClient = new StreamClient(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_SECRET_KEY!
);

export const register: RequestHandler = async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { firstName, lastName, username, email, password, gender } = validation.data;

    const existingUser = await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }
      res.status(409).json({ message: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const emailVerificationToken = generateVerificationToken();
    const emailVerificationExpires = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const user = await UserModel.create({
      firstName,
      lastName,
      username,
      email: email.toLowerCase(),
      passwordHash,
      gender,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      authProvider: AuthProvider.email,
    });

    try {
      await sendVerificationEmail(email, emailVerificationToken, firstName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.authProvider !== AuthProvider.email) {
      res.status(400).json({
        message: `This account uses ${user.authProvider} sign-in. Please use that method to log in.`,
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({ message: "Please reset your password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ message: "Your account has been suspended" });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        message: "Please verify your email before logging in",
        emailVerified: false,
      });
      return;
    }

    await UserModel.updateOne({ _id: user._id }, { lastActive: new Date() });

    const now = Date.now();
    const isPaidVerified = !!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > now;
    const effectiveVerified = user.verified || isPaidVerified;

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        verified: effectiveVerified,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token not found" });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const user = await UserModel.findById(decoded.sub);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ message: "Your account has been suspended" });
      return;
    }

    const accessToken = signAccessToken(user._id.toString());
    const newRefreshToken = signRefreshToken(user._id.toString());

    // Update refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Token refreshed",
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const socialAuth: RequestHandler = async (req, res, next) => {
  try {
    const validation = socialAuthSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { idToken, username, firstName, lastName, gender } = validation.data;

    let firebaseUser;
    try {
      firebaseUser = await getFirebaseUserInfo(idToken);
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired Firebase token" });
      return;
    }

    let authProvider: typeof AuthProvider[keyof typeof AuthProvider];
    switch (firebaseUser.provider) {
      case "google.com":
        authProvider = AuthProvider.google;
        break;
      case "facebook.com":
        authProvider = AuthProvider.facebook;
        break;
      case "apple.com":
        authProvider = AuthProvider.apple;
        break;
      default:
        authProvider = AuthProvider.email;
    }

    let user = await UserModel.findOne({ firebaseUid: firebaseUser.uid });

    if (user) {
      if (user.isBanned) {
        res.status(403).json({ message: "Your account has been suspended" });
        return;
      }

      await UserModel.updateOne({ _id: user._id }, { lastActive: new Date() });

      const accessToken = signAccessToken(user._id.toString());
      const refreshToken = signRefreshToken(user._id.toString());

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          verified:
            user.verified ||
            (!!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > Date.now()),
          role: user.role,
        },
        requiresProfileCompletion: false,
      });
      return;
    }

    if (firebaseUser.email) {
      const existingEmailUser = await UserModel.findOne({
        email: firebaseUser.email.toLowerCase(),
      });

      if (existingEmailUser) {
        res.status(409).json({
          message: "An account with this email already exists. Please log in with your password.",
        });
        return;
      }
    }

    const missingFields: string[] = [];
    if (!username && !firebaseUser.displayName) missingFields.push("username");
    if (!firstName && !firebaseUser.displayName) missingFields.push("firstName");
    if (!lastName && !firebaseUser.displayName) missingFields.push("lastName");
    if (!gender) missingFields.push("gender");

    if (missingFields.length > 0 && (!username || !firstName || !lastName || !gender)) {
      res.status(200).json({
        message: "Additional information required to complete registration",
        requiresProfileCompletion: true,
        missingFields,
        firebaseUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
      });
      return;
    }

    const nameParts = firebaseUser.displayName?.split(" ") || [];
    const finalFirstName = firstName || nameParts[0] || "User";
    const finalLastName = lastName || nameParts.slice(1).join(" ") || "";
    let finalUsername = username;

    if (!finalUsername) {
      const baseUsername = firebaseUser.email?.split("@")[0] || `user${Date.now()}`;
      finalUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 25);

      let usernameExists = await UserModel.findOne({ username: finalUsername });
      let counter = 1;
      while (usernameExists) {
        finalUsername = `${baseUsername.substring(0, 20)}_${counter}`;
        usernameExists = await UserModel.findOne({ username: finalUsername });
        counter++;
      }
    } else {
      const usernameExists = await UserModel.findOne({ username: finalUsername });
      if (usernameExists) {
        res.status(409).json({ message: "Username already taken" });
        return;
      }
    }

    user = await UserModel.create({
      firstName: finalFirstName,
      lastName: finalLastName,
      username: finalUsername,
      email: firebaseUser.email?.toLowerCase() || `${firebaseUser.uid}@social.lamatfikr.com`,
      emailVerified: firebaseUser.emailVerified,
      gender: gender || Gender.preferNotToSay,
      avatar: firebaseUser.photoURL,
      authProvider,
      firebaseUid: firebaseUser.uid,
    });

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Registration successful",
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        verified:
          user.verified ||
          (!!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > Date.now()),
        role: user.role,
      },
      requiresProfileCompletion: false,
    });
  } catch (error) {
    next(error);
  }
};

export const completeSocialProfile: RequestHandler = async (req, res, next) => {
  try {
    const validation = completeSocialProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: "Firebase ID token is required" });
      return;
    }

    let firebaseUser;
    try {
      firebaseUser = await getFirebaseUserInfo(idToken);
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired Firebase token" });
      return;
    }

    const existingUser = await UserModel.findOne({ firebaseUid: firebaseUser.uid });
    if (existingUser) {
      res.status(409).json({ message: "Account already exists" });
      return;
    }

    const { username, firstName, lastName, gender } = validation.data;

    const usernameExists = await UserModel.findOne({ username });
    if (usernameExists) {
      res.status(409).json({ message: "Username already taken" });
      return;
    }

    let authProvider: typeof AuthProvider[keyof typeof AuthProvider];
    switch (firebaseUser.provider) {
      case "google.com":
        authProvider = AuthProvider.google;
        break;
      case "facebook.com":
        authProvider = AuthProvider.facebook;
        break;
      case "apple.com":
        authProvider = AuthProvider.apple;
        break;
      default:
        authProvider = AuthProvider.email;
    }

    const user = await UserModel.create({
      firstName,
      lastName,
      username,
      email: firebaseUser.email?.toLowerCase() || `${firebaseUser.uid}@social.lamatfikr.com`,
      emailVerified: firebaseUser.emailVerified,
      gender,
      avatar: firebaseUser.photoURL,
      authProvider,
      firebaseUid: firebaseUser.uid,
    });

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Profile completed successfully",
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        verified:
          user.verified ||
          (!!user.paidVerifiedUntil && user.paidVerifiedUntil.getTime() > Date.now()),
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (req, res, next) => {
  try {
    const validation = verifyEmailSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { token } = validation.data;

    const user = await UserModel.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired verification token" });
      return;
    }

    await UserModel.updateOne(
      { _id: user._id },
      {
        emailVerified: true,
        $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
      }
    );

    try {
      await sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

export const resendVerification: RequestHandler = async (req, res, next) => {
  try {
    const validation = resendVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email } = validation.data;

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.json({ message: "If an account exists, a verification email has been sent" });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ message: "Email is already verified" });
      return;
    }

    const emailVerificationToken = generateVerificationToken();
    const emailVerificationExpires = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    await UserModel.updateOne(
      { _id: user._id },
      { emailVerificationToken, emailVerificationExpires }
    );

    try {
      await sendVerificationEmail(email, emailVerificationToken, user.firstName);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    res.json({ message: "If an account exists, a verification email has been sent" });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email } = validation.data;

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user || user.authProvider !== AuthProvider.email) {
      res.json({ message: "If an account exists, a password reset email has been sent" });
      return;
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await UserModel.updateOne(
      { _id: user._id },
      {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      }
    );

    try {
      await sendPasswordResetEmail(email, resetToken, user.firstName);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    res.json({ message: "If an account exists, a password reset email has been sent" });
  } catch (error) {
    next(error);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { token, password } = validation.data;

    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await UserModel.updateOne(
      { _id: user._id },
      {
        passwordHash,
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      }
    );

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId).select("-passwordHash -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isPaidVerified =
      !!(user as any).paidVerifiedUntil && (user as any).paidVerifiedUntil.getTime() > Date.now();

    const userObj: any = user.toObject();
    userObj.verified = userObj.verified || isPaidVerified;

    res.json({ user: userObj });
  } catch (error) {
    next(error);
  }
};

export const getStreamToken: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const token = streamClient.createToken(userId);

    res.json({ token });
  } catch (error) {
    next(error);
  }
};

export const getVideoToken: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const token = videoClient.createToken(userId);

    res.json({ token });
  } catch (error) {
    next(error);
  }
};
