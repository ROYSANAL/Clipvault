import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const tweet = await Tweet.create({
    content: content,
    owner: userId,
  });
  if (!tweet) {
    throw new ApiError(500, "Unable to create tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId || isValidObjectId(userId)) {
    throw new ApiError(400, "Valid USERID is required");
  }
  let userTweets;
  try {
    userTweets = await Tweet.find({
      owner: userId,
    }).populate({
      path: "users",
      select: "fullName avatar",
    });
    if (userTweets.length === 0) {
      throw new ApiError(404, "User has no tweets");
    }
  } catch (error) {
    throw new ApiError(500, "Error while fetching User tweets");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "User Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { newContent } = req.body;
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  let updatedTweet;

  updatedTweet = await Tweet.findById(tweetId);

  if (!updatedTweet) {
    throw new ApiError(404, "Tweet with given ID doesn't exist");
  }
  if (updatedTweet.owner.toString() === userId.toString()) {
    updatedTweet = await Tweet.findByIdAndUpdate(
      {
        _id: tweetId,
      },
      {
        content: newContent,
      },
      {
        new: true,
      }
    );
    if (!updatedTweet) {
      throw new ApiError(500, "Error while updating Tweet");
    }
  } else {
    throw new ApiError(404, "Unauthorized Request");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet created successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const userId = req.user?._id;

  let deletedTweet;

  deletedTweet = await Tweet.findById(tweetId);

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet with given ID doesn't exist");
  }
  if (deletedTweet.owner.toString() === userId.toString()) {
    deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {
      throw new ApiError(500, "Error while updating Tweet");
    }
  } else {
    throw new ApiError(404, "Unauthorized Request");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
