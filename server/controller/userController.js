import User from "../model/userModel.js";
import Post from "../model/Addpostmodel.js";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads");

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Set a unique filename for the uploaded file
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
}).single("media"); // Expect a single file under the "media" field

// Secret key for JWT
const JWT_SECRET = "Mudgal@#100";

// Add post API
export const addpost = async (req, res) => {
  // File upload processing
  upload(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err.message);
      return res.status(400).json({ msg: "File upload failed", error: err.message });
    }

    try {
      // Extract fields from req.body
      const { title, opening} = req.body;

      // Check for required fields and file upload
      if (!title || !opening || !req.file) {
        console.log("Missing fields:", { title, opening, file: req.file ? "Yes" : "No" });
        return res.status(400).json({
          msg: "Please fill all required fields and upload an image.",
          missingFields: {
            title: !title,
            opening: !opening,
            file: !req.file,
          },
        });
      }

      // Optionally verify the user through JWT (if not already done)
      const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          req.userId = decoded.id; // Set the user ID after verification
        } catch (error) {
          return res.status(401).json({ msg: "Invalid or expired token" });
        }
      }

      // Create a new post instance with the provided data
      const newPost = new Post({
        userId: req.userId, // Assuming the user ID is set after JWT verification
        title,
        opening,
        media: req.file ? req.file.path : null, // Store the path of the uploaded file
      });

      // Save the new post to the database
      const savedPost = await newPost.save();

      return res.status(201).json({
        msg: "Post created successfully.",
        post: savedPost,
      });
    } catch (error) {
      console.error("Error creating post:", error.message);
      return res.status(500).json({
        msg: "Failed to create post",
        error: error.message,
      });
    }
  });
};

export const addpostadmin = async (req, res) => {
  const adminId = new mongoose.Types.ObjectId("64abc12345abcdef67890abc");
  upload(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err.message);
      return res.status(400).json({ msg: "File upload failed", error: err.message });
    }

    try {
      // Verify token
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ msg: "Authorization token is missing" });
      }

      let decodedToken;
      try {
        decodedToken = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ msg: "Invalid or expired token" });
      }

      // Check admin privileges
      if (decodedToken.role !== "admin") {
        return res.status(403).json({ msg: "Access denied. Admins only." });
      }

      // Extract fields from request body
      const { title, opening } = req.body;

      // Validate required fields
      if (!title || !opening || !req.file) {
        return res.status(400).json({
          msg: "Please fill all required fields and upload an image.",
          missingFields: {
            title: !title,
            opening: !opening,
            file: !req.file,
          },
        });
      }

      // Create a new post
      const newPost = new Post({
        userId: adminId, // Use "admin" or another identifier for admin-created posts
        title,
        opening,
        media: req.file.path, // Path of the uploaded file
      });

      // Save to database
      const savedPost = await newPost.save();

      return res.status(201).json({
        msg: "Post created successfully.",
        post: savedPost,
      });
    } catch (error) {
      console.error("Error creating post:", error.message);
      return res.status(500).json({
        msg: "Failed to create post",
        error: error.message,
      });
    }
  });
};



 




// Middleware for handling file uploads

export const create = async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    // Check if all required fields are provided
    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fname,
      lname,
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      msg: "User created successfully",
      user: { id: savedUser._id, fname: savedUser.fname, lname: savedUser.lname, email: savedUser.email },
      token,
    });
  } catch (error) {
    console.error("Error during user creation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
  
};
export const getAll = async (req, res) => {
  try {
    const userData = await User.find();
    if (!userData) {
      return res.status(404).json({ msg: "User data not found" });
    }
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const getOne = async (req, res) => {
  try {
    const id = req.params.id;
    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(200).json(userExist);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(401).json({ msg: "User not found" });
    }

    const updatedData = await User.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ msg: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    const userExist = await User.findById(id);
    if (!userExist) {
      return res.status(404).json({ msg: "User not exist" });
    }
    await User.findByIdAndDelete(id);
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
export const fetchuser = async (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin credentials
  const adminCredentials = {
    email: "sudhanshu@gmail.com",
    password: "sudhanshu",
  };

  try {
    // Check if the credentials match the admin credentials
    if (email === adminCredentials.email && password === adminCredentials.password) {
      // Generate JWT token for admin
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

      return res.status(200).json({
        msg: "Admin login successful",
        user: { email, role: "admin" },
        token,
      });
    }

    // Check if the user exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    // Generate JWT token for regular user
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      msg: "Login successful",
      user: { id: user.id, fname: user.fname, lname: user.lname, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Error during user login:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};




export const getAllPosts = async (req, res) => {
  try {
    // Fetch posts and populate user details
    const posts = await Post.find()
      .populate("userId", "fname lname email") // Select specific fields to include from User
      .exec();

    if (!posts || posts.length === 0) {
      return res.status(404).json({ msg: "No posts found" });
    }

    // Format response
    const postsWithUserDetails = posts.map((post) => ({
      id: post._id,
      title: post.title,
      opening: post.opening,
      subHeader1: post.subHeader1,
      content1: post.content1,
      subHeader2: post.subHeader2,
      content2: post.content2,
      cta: post.cta,
      media: post.media || null, // Handle missing media
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null, // Format timestamp
      user: post.userId
        ? {
            id: post.userId._id,
            fname: post.userId.fname,
            lname: post.userId.lname,
            email: post.userId.email,
          }
        : {
            id: null,
            fname: "Admin",
            lname: "",
            email: "admin@gmail.com",
          },
    }));

    // Set appropriate headers for mobile compatibility
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(postsWithUserDetails);
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const myposts = async (req, res) => {
  try {
    // Ensure `userId` is correctly set by the `authenticate` middleware
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ msg: "User ID is missing from request" });
    }

    // Fetch posts created by the logged-in user
    const posts = await Post.find({ userId }).populate("userId", "fname lname email");

    if (!posts || posts.length === 0) {
      return res.status(404).json({ msg: "No posts found for the current user" });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user's posts:", error.message);
    res.status(500).json({ msg: "Failed to fetch user's posts", error: error.message });
  }
};
 // assuming you store JWT_SECRET in a config file

export const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Get token from Authorization header

  if (!token) {
    return res.status(401).json({ msg: "Authentication token missing" });
  }

  try {
    // Verify token and decode user data
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id; // Save the decoded user ID to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error("Token verification error:", error.message);

    // Specific error handling for token expiry
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expired. Please log in again." });
    }
    // Generic invalid token error
    return res.status(401).json({ msg: "Invalid token. Please log in again." });
  }
};

// deletePost function
export const deletePost = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract token from the header
    if (!token) {
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // Handle token verification errors (e.g., token expired)
    let decoded;
    try {
      decoded = jwt.verify(token, "Mudgal@#100"); // Verify the token using the secret key
    } catch (error) {
      return res.status(401).json({ msg: "Invalid or expired token" });
    }

    const postId = req.params.id; // Extract postId from URL parameters
    const post = await Post.findById(postId); // Find the post by ID
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the user is the author of the post
    if (post.userId.toString() !== decoded.id) {
      return res.status(403).json({ msg: "You are not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId); // Delete the post from the database
    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ msg: "An error occurred while deleting the post" });
  }
};
export const deletePostuser = async (req, res) => {
  try {
    const { postId } = req.params; // Change 'id' to 'postId'
    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(200).json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    const decoded = jwt.verify(token, "Mudgal@#100");
    const userId = decoded.id;

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ msg: "You are not authorized to update this post" });
    }

    const { title, opening } = req.body;

    // Use the new file if provided; otherwise, retain the existing file
    const mediaPath = req.file ? req.file.path : post.media;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, opening, media: mediaPath },
      { new: true }
    );

    res.status(200).json({ msg: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error.message);
    res.status(500).json({ msg: "Failed to update post", error: error.message });
  }
};


// Middleware for handling file uploads (image/video)
export const getOnePost = async (req, res) => {
  const { postId } = req.params;

  try {
    // Find the post by its ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error("Error fetching post:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

export const editPost = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userRole = decoded.role || null; // For admin login, the role should be set as "admin"
    const userId = decoded.id || null;

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // Authorization check: Admins can update any post, users can update only their own posts
    if (userRole !== "admin" && post.userId.toString() !== userId) {
      return res.status(403).json({ msg: "You are not authorized to update this post" });
    }

    const { title, opening } = req.body;

    // Use the new file if provided; otherwise, retain the existing file
    const mediaPath = req.file ? req.file.path : post.media;

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, opening, media: mediaPath },
      { new: true }
    );

    res.status(200).json({ msg: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error.message);
    res.status(500).json({ msg: "Failed to update post", error: error.message });
  }
};



