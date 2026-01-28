import {Request, Response} from "express";
import { generateToken } from "../utils/generateToken";
import { hashPassword, comparePassword } from "../utils/encryptPassword";
import { User, IUser } from "../models/userModel";

const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, provider } = req.body;
    console.log(name, email, password, role, provider);
    const userExists = await User.findOne({ email });
    console.log("userExists", userExists);
    if (userExists) {
        return res.status(400).json({message: "User already exists"});
    }

    const hashedPassword = await hashPassword(password);
    console.log("hashedPassword", hashedPassword);
    const user: IUser= await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      provider,
      location: {
        type: "Point",
        coordinates: [0, 0] // Default coordinates, can be updated later
      }
    });
    console.log("user", user);
    
    // Don't generate token - user needs to login after signup
    return res.status(201).json({
      message: "User created successfully. Please login."
    });
  } catch (error: any) {
    return res.status(500).json({message: "Internal server error", error: error.message});
  }
}

const login = async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body;
    console.log(email, password);
    const user = await User.findOne({email});
    console.log("user", user);
    if (!user) {
        return res.status(400).json({message: "Invalid email or password"});
    }

    const isPasswordValid = await comparePassword(password, user.password as string);
    console.log("isPasswordValid", isPasswordValid);
    if (!isPasswordValid) {
        return res.status(400).json({message: "Invalid email or password"});
    }
    
    const token = generateToken(user.email, user.role, user.id);
    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "strict"});
    return res.status(200).json({message: "Login successful", user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      provider: user.provider,
      token: token,
    }
    });
  } catch (error: any) {
    return res.status(500).json({message: "Internal server error", error: error.message});
  }
}

const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({message: "userId and role are required"});
    }

    if (!['donor', 'receiver', 'admin'].includes(role)) {
      return res.status(400).json({message: "Invalid role"});
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    const token = generateToken(user.email, user.role, user.id);
    res.cookie("token", token, {httpOnly: true, secure: true, sameSite: "strict"});

    return res.status(200).json({
      message: "Role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider
      }
    });
  } catch (error: any) {
    return res.status(500).json({message: "Internal server error", error: error.message});
  }
}

export { signup, login, updateUserRole };