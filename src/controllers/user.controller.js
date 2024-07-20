import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "./../../utils/ApiError.js";
import { User } from "./../models/user.model.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // taking info from frontend
  const { username, email, password, fullName } = req.body;
  //  checking if all fields are filled
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // checking if user already exists

  const existedUser = User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists. Please Login instead!!");
  }

  //taking avatar and comerImage

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Error uploading avatar");
  }

  // add details in db
  const user = await User.create({
    username: username.toLowerCase(),
    email,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  // check if the user is created in db
  const checkCreatedUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!checkCreatedUser) {
    throw new ApiError(500, "Error creating user");
  }

  // send response
  res
    .status(201)
    .json(
      new ApiResponse(200, checkCreatedUser, "User created Successfully!!"),
    );
});

// user Login
const loginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "User LoggedIn Successfully!!" });
});

export { registerUser, loginUser };
