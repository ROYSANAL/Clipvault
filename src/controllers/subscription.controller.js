import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//   const { channelId } = req.params;
//   // TODO: toggle subscription
//   const userId = req.user?._id;

//   if (!isValidObjectId(channelId)) {
//     throw new ApiError(400, "Invalid Channel ID");
//   }

//   if (channelId.toString() === userId.toString())
//     throw new ApiError(400, "Cannot subscribe to own channel");

//   const existingSubscriptionDocument = await Subscription.aggregate([
//     {
//       $match: {
//         channel: channelId,
//         subscriber: userId,
//       },
//     },
//   ]);

//   if (existingSubscriptionDocument) {
//     existingSubscriptionDocument.remove();
//   }

//   const subscriptionDocument = await Subscription.create({
//     subscriber: userId,
//     channel: channelId,
//   });
//   if (!subscriptionDocument)
//     throw new ApiError(500, "Error while Subscribing to this Channel");

//   const response = new ApiResponse(200, "Channel Subscribed Successfully");
//   return res.status(200).json(response);
// });

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  // Validate channelId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  // Prevent self-subscription
  if (channelId.toString() === userId.toString()) {
    throw new ApiError(400, "Cannot subscribe to your own channel");
  }

  // Check if the user is already subscribed
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  let subscriptionDocument;
  let message;

  if (existingSubscription) {
    // Unsubscribe if already subscribed
    await Subscription.deleteOne({ _id: existingSubscription._id });
    message = "Channel Unsubscribed Successfully";
  } else {
    // Subscribe if not already subscribed
    subscriptionDocument = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    if (!subscriptionDocument) {
      throw new ApiError(500, "Error while subscribing to this channel");
    }
    message = "Channel Subscribed Successfully";
  }

  // Return response with subscription status
  return res
    .status(200)
    .json(new ApiResponse(200, { subscribed: !existingSubscription }, message));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // Validate channelId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId), // Ensure ObjectId
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$subscriber", // Convert array to object
      },
      {
        $project: {
          _id: 0, // Exclude subscription ID
          subscriber: 1, // Include subscriber details
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribers,
          "Subscribers list fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Error while fetching subscribers");
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

 // Validate subsID
 if (!isValidObjectId(subscriberId)) {
  throw new ApiError(400, "Invalid Subscriber ID");
}

try {
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId), // Ensure ObjectId
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$channels", // Convert array to object
    },
    {
      $project: {
        _id: 0, // Exclude channel ID
        channels: 1, // Include channel details
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        "Channel list fetched successfully"
      )
    );
} catch (error) {
  throw new ApiError(500, "Error while fetching Channels");
}


});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
