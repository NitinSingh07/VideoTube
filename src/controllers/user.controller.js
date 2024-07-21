import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Taking info from frontend
  const { username, email, password, fullName } = req.body;

  // Debugging logs
  console.log("Received data:", { username, email, password, fullName });

  // Checking if all fields are filled
  if ([fullName, username, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Checking if user already exists
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists. Please Login instead!!");
  }

  // Taking avatar and coverImage
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(500, "Error uploading avatar");
  }

  // Add details in db
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatar.url || "",
    coverImage: coverImage?.url || "",
  });

  // Check if the user is created in db
  const checkCreatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!checkCreatedUser) {
    throw new ApiError(500, "Error creating user");
  }

  // Send response
  res
    .status(201)
    .json(
      new ApiResponse(200, checkCreatedUser, "User created Successfully!!"),
    );
});

// User Login
const loginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "User LoggedIn Successfully!!" });
});

export { registerUser, loginUser };
