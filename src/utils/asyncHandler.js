const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      console.error("Error caught in asyncHandler: ", err);
      next(err); // Pass the error to the error-handling middleware
    });
  };
};

// // const asyncHandler = () => {}
// // const asyncHandler = (func) => () => {}
// // const asyncHandler = (func) => async () => {}

// //NOTE: Function yahan aaya aur fir try catch me wrap hoke wapas chala gya, execute wahi pe hoga, thats beautiful
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     console.error("hello im here 2")
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export { asyncHandler };

// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
