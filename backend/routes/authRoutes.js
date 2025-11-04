import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ChatSession from "../models/ChatSession.js";

import fetch from "node-fetch";
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, email, password, userType } = req.body;

    // Check for existing email BEFORE trying to insert
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      mobileNumber,
      email,
      password: hashedPassword,
      userType
    });

    res.status(201).json({ message: "User registered successfully", user });

  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// Login Route
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
//       expiresIn: "24h",
//     });

//     res.status(200).json({ message: "Login successful", token, user });
//   } catch (error) {
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// });


// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, captchaToken } = req.body;

//     // 1️⃣ Check if captcha token exists
//     if (!captchaToken) {
//       return res.status(400).json({ message: "Captcha token missing" });
//     }

//     // 2️⃣ Verify captcha with Google
//     const secretKey = "6LePZP8rAAAAAJDcldpF7IVa_rDvALLOjxyEfEVj"; // your secret key
//     const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

//     const captchaResponse = await fetch(verifyURL, { method: "POST" });
//     const captchaData = await captchaResponse.json();

//     if (!captchaData.success) {
//       return res.status(400).json({ message: "Captcha verification failed" });
//     }

//     // 3️⃣ Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     // 4️⃣ Validate password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // 5️⃣ Generate JWT token
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user,
//     });

//   } catch (error) {
//     console.error("Login Error:", error.message);
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// });
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, captchaToken } = req.body;

//     if (!captchaToken) {
//       return res.status(400).json({ message: "Captcha token missing" });
//     }

//     const secretKey = process.env.RECAPTCHA_SECRET;
//     const verifyURL = "https://www.google.com/recaptcha/api/siteverify";
//     const response = await fetch(verifyURL, {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: `secret=${secretKey}&response=${captchaToken}&remoteip=${req.ip}`,
//     });

//     const data = await response.json();
//     console.log("Captcha verify response:", data); // 👈 check this in console

//     if (!data.success) {
//       return res.status(400).json({ message: "Captcha verification failed", details: data });
//     }

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     res.status(200).json({ message: "Login successful", token, user });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ message: "Login failed", error: err.message });
//   }
// });
router.post("/login", async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!captchaToken) {
      return res.status(400).json({ message: "Captcha token missing" });
    }

    // ✅ Verify with standard reCAPTCHA v2
    const secretKey =process.env.RECAPTCHA_SECRET // Replace with your actual secret key
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    
    const captchaResponse = await fetch(verifyURL, { method: "POST" });
    const captchaData = await captchaResponse.json();

    console.log("Captcha verification response:", captchaData);

    if (!captchaData.success) {
      return res.status(400).json({ 
        message: "Captcha verification failed",
        details: captchaData["error-codes"]
      });
    }

    // 🔐 Proceed with user login
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, captchaToken } = req.body;

//     if (!captchaToken) {
//       return res.status(400).json({ message: "Captcha token missing" });
//     }

//     const secretKey = process.env.RECAPTCHA_SECRET;
//     const captchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: `secret=${secretKey}&response=${captchaToken}`,
//     });
//     const captchaData = await captchaResponse.json();

//     if (!captchaData.success) {
//       return res.status(400).json({ message: "Captcha verification failed" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user,
//     });

//   } catch (error) {
//     console.error("Login Error:", error.message);
//     res.status(500).json({ message: "Login failed", error: error.message });
//   }
// });



// Get User Profile Route
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Count actual chat sessions for this user
    const chatSessionCount = await ChatSession.countDocuments({ userId: req.user.id });

    // Return user data with accurate chat count
    const userData = {
      ...user.toObject(),
      totalChats: chatSessionCount
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

// Update User Profile Route
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNumber, favoriteFeature } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (favoriteFeature) user.favoriteFeature = favoriteFeature;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

export { authenticateToken };
export default router;