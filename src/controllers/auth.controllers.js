import { User } from "../models/user.models.js";
import { apiResponse } from "../utils/api-response.js";
import { apiError } from "../utils/api-error.js";
import asyncHandler from "../utils/async-handler.js";
import {
  sendEmail,
  mailGeneratorVerification,
  forgetPasswordMail,
} from "../utils/mail.js";
import dotenv from "dotenv";

dotenv.config();
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new apiError("User not found", 404);
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in token generation:", error);
    throw new apiError("Token generation failed", 500);
  }
};

export const registerUser = asyncHandler(async (req, res, next) => {
  const { userName, email, password } = req.body;

  const existngUser = await User.findOne({ $or: [{ email }, { userName }] });

  if (existngUser) {
    return next(
      new apiError("User with given email or username already exists", 409, []),
    );
  }

  const user = await User.create({
    userName,
    email,
    password,
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, expireryTime } =
    user.generateTemporaryToken();
  user.temporaryToken = hashedToken;
  user.temporaryTokenExpireAt = expireryTime;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification - Proj Management",
    mailgenContent: mailGeneratorVerification(
      user.userName,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken  -emailVerificationToken -emailVerificationTokenExpiry",
  );

  if (!createdUser) {
    return next(new apiError("User creation failed", 500));
  }

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        { data: createdUser },
        "User registered successfully. Please verify your email.",
      ),
    );
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { userName, password } = req.body;
  if (!userName) {
    return next(new apiError("Username is required", 400, []));
  }
  if (!password) {
    return next(new apiError("Password is required", 400, []));
  }
  const user = await User.findOne({ userName });

  if (!user) {
    return next(new apiError("Invalid username or password", 401, []));
  }

  // if (!user.isEmainlVerified) {
  //   return next(new apiError("Please verify your email before logging in", 403, []));
  // }
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new apiError("Invalid username or password", 401, []));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken  -emailVerificationToken -emailVerificationTokenExpiry",
  );

  if (!loggedInUser) {
    return next(new apiError("User login failed", 500));
  }

  const cookieOptions = {
    httpOnly: true, //browser JS can't access cookie read and write is not allowed console.log(document.cookie) will not show cookies
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new apiResponse(
        200,
        { data: loggedInUser, accessToken },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    expires: new Date(0), // Set the cookie to expire immediately
  };

  return res
    .status(200)
    .cookie("refreshToken", "", cookieOptions)
    .cookie("accessToken", "", cookieOptions)
    .json(new apiResponse(200, null, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { data: req.user },
        "Current user fetched successfully",
      ),
    );
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { verifyToken } = req.params;

  if (!verifyToken) {
    return next(new apiError("Verification token is missing", 400, []));
  }

  // Hash the received token to compare with stored hashed token in DB beacuse we send unshashed to user gmail and hashed to DB

  let hashedToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  const user = await User.findOne({
    temporaryToken: hashedToken,
    temporaryTokenExpireAt: { $gt: Date.now() },
  });

  if (!user) {
    return next(new apiError("Invalid verification token", 400, []));
  }

  user.temporaryToken = undefined;
  user.temporaryTokenExpireAt = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { isEmailVerified: user.isEmailVerified },
        "Email verified successfully",
      ),
    );
});

export const resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    return next(new apiError("User not found", 404, []));
  }

  if (user.isEmailVerified) {
    return next(new apiError("Email is already verified", 400, []));
  }

  const { unHashedToken, hashedToken, expireryTime } =
    user.generateTemporaryToken();
  user.temporaryToken = hashedToken;
  user.temporaryTokenExpireAt = expireryTime;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Email Verification - Proj Management",
    mailgenContent: mailGeneratorVerification(
      user.userName,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new apiResponse(200, null, "Verification email resent successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    return next(new apiError("Refresh token is missing", 401, []));
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decoded?.id);

    if (!user) {
      return next(new apiError("Invalid refresh token", 401, []));
    }

    if (user.refreshToken !== incomingRefreshToken) {
      return next(new apiError("Refresh token is expired", 401, []));
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new apiResponse(
          200,
          { accessToken },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new apiError("Invalid refresh token", 401, []);
  }
});

export const forgotPasswordRequest = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new apiError("Email is required", 400, []));
  }
  const user = await User.findOne({ email });

  if (!user) {
    return next(new apiError("User with given email does not exist", 404, []));
  }

  const { unHashedToken, hashedToken, expireryTime } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordTokenExpiry = expireryTime;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Password Reset Request - Proj Management",
    mailgenContent: forgetPasswordMail(
      user.userName,
      `${process.env.FORGOT_PASSWORD_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        null,
        "Password reset is sent on your mail id successfully",
      ),
    );
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  if (!resetToken) {
    return next(new apiError("Reset token is missing", 400, []));
  }

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedResetToken,
    forgotPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new apiError("Invalid or expired reset token", 489, []));
  }

  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, null, "Password has been reset successfully"));
});

export const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if(!currentPassword){
    return next(new apiError("Current password is required", 400, []));
  }

  if(!newPassword){
    return next(new apiError("New password is required", 400, []));
  }

  const user = await User.findById(req.user._id);

  const isPasswordMatched = await user.comparePassword(currentPassword);

  if (!isPasswordMatched) {
    return next(new apiError("Current password is incorrect", 401, []));
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, null, "Password changed successfully"));

});
