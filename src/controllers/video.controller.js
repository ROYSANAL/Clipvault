import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadVideoOnCloudinary } from "../utils/cloudinary.js";

// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
//   //TODO: get all videos based on query, sort, pagination

// });

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy,
    sortType = "desc",
    userId,
  } = req.query;

  // Create aggregation pipeline
  const pipeline = [];

  // Match stage for filtering
  const matchStage = {};

  // Filter by user if userId is provided
  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  // Search query (title or description)
  if (query) {
    matchStage.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // Only show published videos
  matchStage.isPublished = true;

  pipeline.push({ $match: matchStage });

  // Sorting
  const sortStage = {};
  if (sortBy) {
    const sortOrder = sortType === "asc" ? 1 : -1;
    sortStage[sortBy] = sortOrder;
  } else {
    // Default sorting by creation date
    sortStage.createdAt = -1;
  }
  pipeline.push({ $sort: sortStage });

  // Lookup owner details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            fullName: 1,
            avatar: 1,
            email: 1,
          },
        },
      ],
    },
  });

  // Unwind owner array
  pipeline.push({
    $unwind: "$owner",
  });

  // Projection to shape final response
  pipeline.push({
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      createdAt: 1,
      updatedAt: 1,
      owner: 1,
    },
  });

  // Aggregation pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      docs: "videos",
      totalDocs: "totalVideos",
      totalPages: "totalPages",
      page: "currentPage",
    },
  };

  // Execute aggregation
  const result = await Video.aggregatePaginate(pipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  console.log("Title", title, "Description : ", description);

  if (!title) {
    throw new ApiError(400, "Title is required for Video Uploading");
  }
  if (!description) {
    throw new ApiError(400, "Description is required for Video Uploading");
  }

  const videoLocalPath = req.file?.path;
  console.log("Video Local Path : ", videoLocalPath);

  if (!videoLocalPath) {
    throw new ApiError(400, "Video File is required ");
  }
  const video = await uploadVideoOnCloudinary(videoLocalPath);

  if (!video) {
    throw new ApiError(400, "Video Format File is required");
  }

  if (!video.url) {
    throw new ApiError(
      400,
      "Upload video to server failed, try uploading Video again"
    );
  }

  const videoDocument = await Video.create({
    videoFile: video.url,
    title: title,
    description: description,
    owner: req.user._id,
  });

  console.log("Video DOCUMENT : ", videoDocument);

  if (!videoDocument) {
    throw new ApiError(500, "Error while Uploading video in Database");
  }

  //const finalUploadedVideo = await Video.findById(videoDocument._id).select

  return res
    .status(200)
    .json(new ApiResponse(200, videoDocument, "Video Published Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  //console.log("Video ID : ", videoId );

  const video = await Video.findById(videoId);
  //console.log("Video Document : ", video );

  if (!video) {
    throw new ApiError(400, "The requested Video doesn't exist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { newTitle, newDescription } = req.body;
  //TODO: update video details like title, description, thumbnail
  const userId = req.user?._id; // Use _id instead of id for consistency

  // 1. Find the video and check ownership
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoOwnerId = video.owner.toString(); // Convert ObjectId to string
  console.log("Video owner ID : ", videoOwnerId);

  if (userId.toString() !== videoOwnerId) {
    // Ensure both are strings
    throw new ApiError(403, "Unauthorized request");
  }

  const newVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        description: newDescription,
        title: newTitle,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id; // Use _id instead of id for consistency

  // 1. Find the video and check ownership
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoOwnerId = video.owner.toString(); // Convert ObjectId to string
  console.log("Video owner ID : ", videoOwnerId);

  if (userId.toString() !== videoOwnerId) {
    // Ensure both are strings
    throw new ApiError(403, "Unauthorized request");
  }

  // 2. Delete the video
  const deletedVideo = await Video.deleteOne({ _id: videoId });
  if (deletedVideo.deletedCount === 0) {
    // Check if deletion succeeded
    throw new ApiError(500, "Failed to delete video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  const response = new ApiResponse(
    200,
    video,
    "Video Publish Toggle altered Successfully"
  );
  res.status(200).json(response);
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
