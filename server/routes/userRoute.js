import express from "express";
import multer from "multer";
import path from "path";
import {
  create,
  deleteUser,
  getAll,
  getOne,
  update,
  fetchuser,
  addpost,
  getAllPosts,
  myposts,
  authenticate,
  deletePost,
  updatePost,
  getOnePost,
  deletePostuser,
  editPost,addpostadmin
} from "../controller/userController.js";

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the directory for file uploads
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    // Generate a unique file name based on timestamp and original name
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Allow the file
  } else {
    cb(new Error("Only images are allowed"), false); // Reject if not an allowed type
  }
};

// Initialize multer middleware for image uploads with an optional file size limit (5 MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Set file size limit to 5 MB
}).single("media"); // We're uploading a single file, so we use .single()

// Router initialization
const route = express.Router();

// User-related routes
route.post("/create", create);  // Create user
route.get("/getall", getAll);   // Get all users
route.get("/getone/:id", getOne);  // Get one user by id
route.put("/update/:id", update);  // Update user by id
route.delete("/delete/:id", deleteUser);  // Delete user by id
route.delete("/deletepostuser/:postId", deletePostuser);  // Delete post by postId for user
route.post("/login", fetchuser);  // Login for user

// Post-related routes with file upload handling
route.post(
  "/addpost",
  // Ensure the user is authenticated
  // Handle image file upload
  addpost // Controller function to handle post creation
);
route.post(
  "/addpostadmin",
  
 
  // Ensure the user is authenticated
  // Handle image file upload
  addpostadmin // Controller function to handle post creation
);
route.get("/getallposts", getAllPosts);  // Get all posts
route.get("/myposts", authenticate, myposts);  // Get posts for the authenticated user
route.delete("/deletepost/:id", authenticate, deletePost);  // Delete post by postId

// Route for updating a post with file upload handling and authentication
route.put(
  "/updatepost/:id",
  authenticate, // Ensure the user is authenticated
  upload, // Handle image file upload
  updatePost // Controller function to update the post
);

// Route to get a specific post by postId
route.get("/getonepost/:postId", authenticate, getOnePost); // Authenticate to ensure user access

// Route for editing a post (Admin only) with authentication
route.put(
  "/editpost/:id",
  authenticate, // Ensure the user is authenticated
  upload, // Handle image file upload
  editPost // Controller function to update the post
);

export default route;
