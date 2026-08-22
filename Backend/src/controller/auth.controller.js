import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
export const register = async (req, res) => {
  const {
    firstName,
    lastName,
    email: rawEmail,
    password,
    phoneNumber,
    city,
    country,
    additionalInformation,
    photo,
  } = req.body;

  const email = rawEmail?.trim().toLowerCase();

  try {
    // 1. Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email || !password || !phoneNumber?.trim() || !city?.trim() || !country?.trim()) {
      return res.status(400).json({
        message: "firstName, lastName, email, password, phoneNumber, city, and country are required.",
      });
    }

    // 2. Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // 3. Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create the user
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber.trim(),
        city: city.trim(),
        country: country.trim(),
        additionalInformation: additionalInformation?.trim() || null,
        photo: photo || null,
      },
    });

    // 5. Return success — never return the password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: "User registered successfully.",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail?.trim().toLowerCase();

  try {
    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 2. Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 3. Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Sign a JWT token — payload uses email (not username)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Return token and user info — never return the password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: "Login successful.",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Profile Validation Helper ────────────────────────────
const validateProfileInput = (body) => {
  const { firstName, lastName, phoneNumber, city, country, photo, additionalInformation } = body;

  if (firstName !== undefined) {
    if (typeof firstName !== "string" || !firstName.trim()) {
      return "firstName cannot be empty.";
    }
    if (firstName.trim().length > 50) {
      return "firstName must not exceed 50 characters.";
    }
  }

  if (lastName !== undefined) {
    if (typeof lastName !== "string" || !lastName.trim()) {
      return "lastName cannot be empty.";
    }
    if (lastName.trim().length > 50) {
      return "lastName must not exceed 50 characters.";
    }
  }

  if (phoneNumber !== undefined) {
    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      return "phoneNumber cannot be empty.";
    }
    const cleanPhone = phoneNumber.trim();
    if (cleanPhone.length < 7 || cleanPhone.length > 20) {
      return "phoneNumber must be between 7 and 20 characters.";
    }
  }

  if (city !== undefined) {
    if (typeof city !== "string" || !city.trim()) {
      return "city cannot be empty.";
    }
    if (city.trim().length > 100) {
      return "city must not exceed 100 characters.";
    }
  }

  if (country !== undefined) {
    if (typeof country !== "string" || !country.trim()) {
      return "country cannot be empty.";
    }
    if (country.trim().length > 100) {
      return "country must not exceed 100 characters.";
    }
  }

  if (additionalInformation !== undefined && additionalInformation !== null) {
    if (typeof additionalInformation === "string" && additionalInformation.length > 1000) {
      return "additionalInformation must not exceed 1000 characters.";
    }
  }

  if (photo !== undefined && photo !== null && photo !== "") {
    if (typeof photo !== "string") {
      return "photo must be a valid URL string.";
    }
    try {
      const url = new URL(photo);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "photo must be a valid http or https URL.";
      }
    } catch {
      return "photo must be a valid URL.";
    }
  }

  return null;
};

// ─────────────────────────────────────────────
// GET /api/auth/profile  (protected route)
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        city: true,
        country: true,
        additionalInformation: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────
// PUT & PATCH /api/auth/profile  (protected route)
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { firstName, lastName, phoneNumber, city, country, additionalInformation, photo } = req.body;

  // Validation
  const validationError = validateProfileInput(req.body);
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError,
      error: null,
    });
  }

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName.trim();
  if (lastName !== undefined) updateData.lastName = lastName.trim();
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
  if (city !== undefined) updateData.city = city.trim();
  if (country !== undefined) updateData.country = country.trim();
  if (additionalInformation !== undefined) {
    updateData.additionalInformation = typeof additionalInformation === "string" ? additionalInformation.trim() : null;
  }
  if (photo !== undefined) {
    updateData.photo = typeof photo === "string" ? photo.trim() : null;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        city: true,
        country: true,
        additionalInformation: true,
        photo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
