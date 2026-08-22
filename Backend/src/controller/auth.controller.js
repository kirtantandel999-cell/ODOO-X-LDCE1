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

// ─────────────────────────────────────────────
// GET /api/auth/profile  (protected route)
// ─────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    // req.user.id is set by the JWT middleware
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
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────
// PUT /api/auth/profile  (protected route)
// ─────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { firstName, lastName, phoneNumber, city, country, additionalInformation, photo } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(city && { city }),
        ...(country && { country }),
        ...(additionalInformation !== undefined && { additionalInformation }),
        ...(photo !== undefined && { photo }),
      },
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
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
