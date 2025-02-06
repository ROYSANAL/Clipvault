import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const owner = req.user._id;

  //TODO: create playlist
  if (!name || !description) {
    throw new ApiError(404, "Name and Description both are required");
  }
  let playlist;
  playlist = await Playlist.findOne({
    owner: new mongoose.Types.ObjectId(owner),
    name: name,
  });
  if (playlist) {
    throw new ApiError(
      404,
      "Playlist with same name exists, try with another name"
    );
  }

  playlist = await Playlist.create({
    name: name,
    description: description,
    owner: owner,
  });
  if (!playlist) {
    throw new ApiError(500, " Failed to create playlist try again");
  }
  const response = new ApiResponse(
    200,
    playlist,
    "Playlist created successfully"
  );
  return res.status(200).json(response);
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User ID");
  }
  let message;
  try {
    const userPlaylists = await Playlist.find({
      owner: new mongoose.Types.ObjectId(userId),
    });

    if (userPlaylists.length === 0) {
      message = "User has no playlists";
    } else {
      message = "User playlists fetched successfully";
    }
    return res.status(200).json(new ApiResponse(200, userPlaylists, message));
  } catch (error) {
    throw new ApiError(500, null, "Error while fetching user playlists");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  // Validate playlistId
  if (!playlistId) {
    throw new ApiError(404, "Playlist ID is required");
  }

  let playlist;
  try {
    playlist = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos", // matching field in Playlist model
          foreignField: "_id", // matching field in Video model
          as: "videos",
        },
      },
      {
        $unwind: {
          path: "$videos",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "videos.owner", // The "owner" field inside the "videos" array
          foreignField: "_id", // Matching the "_id" in the "users" collection
          as: "videos.ownerDetails", // Store the owner info in a new field `ownerDetails`
        },
      },
      {
        $unwind: {
          path: "$videos.ownerDetails",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          videos: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            views: 1,
            duration: 1,
            "ownerDetails.fullName": 1,
            "ownerDetails.avatar": 1,
            "ownerDetails.username": 1,
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(502, "Server error while fetching Playlist");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  // Validate IDs first
  if (!playlistId || !videoId) {
    throw new ApiError(400, "Both playlist ID and video ID are required");
  }
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or video ID");
  }

  // Check if playlist exists and belongs to the user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found or unauthorized");
  }

  // Verify video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (videoExists) {
    throw new ApiError(404, "Video exist in this playlist ");
  }

  // Add video to playlist (MongoDB update operation)
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      }, // Prevents duplicates
    },
    { new: true } // Return updated document
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  // Validate input IDs
  if (!playlistId || !videoId) {
    throw new ApiError(400, "Both playlist ID and video ID are required");
  }
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist ID or video ID");
  }

  // Verify playlist exists and belongs to user
  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or unauthorized");
  }

  // Check if video exists in playlist
  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(404, "Video not found in this playlist");
  }

  // Remove video from playlist using atomic operation
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      }, // Removes all instances of videoId
    },
    { new: true } // Return modified document
  ).populate({
    path: "videos",
    select: "title thumbnail duration views",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const userId = req.user?._id;
  // Validate input IDs
  if (!playlistId) {
    throw new ApiError(400, "playlist ID is required");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID ");
  }

  try {
    const deletedPlaylist = await Playlist.deleteOne({
      _id: playlistId,
      owner: userId,
    });
    if (deletedPlaylist.length === 0) {
      throw new ApiError(404, "Unauthorized Request");
    }
  } catch (error) {
    throw new ApiError(500, "Deletion unsuccessful");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req.user?._id;

  // Validate input
  if (!name || !description) {
    throw new ApiError(400, "Name and Description both are required"); // Changed to 400
  }

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  // Add before update if you need unique name validation
  const existingPlaylist = await Playlist.findOne({
    name: name,
    owner: userId,
  });

  if (existingPlaylist && existingPlaylist._id.toString() !== playlistId) {
    throw new ApiError(409, "Playlist with this name already exists");
  }
  // Update with ownership check in single query
  const playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: userId, // Built-in ownership check
    },
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true } // Return updated document
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or unauthorized");
  }

  // Success response
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
