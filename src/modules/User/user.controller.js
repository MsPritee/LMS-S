import userModel from "../../../database/models/userModel.js";
import { catchAsyncError } from "../../utils/catchAsyncError.js";
import bcrypt from 'bcrypt'
import generateToken from "../../utils/generateToken.js";
import { sendEmail } from "../../emails/user.email.js";
import { verificationHTML } from "../../emails/templetes/userEmailVerificationHTML.js";
import jwt from 'jsonwebtoken'
import { resetPasswordHTML } from "../../emails/templetes/userForgetPasswordHTML.js";
import { AppError } from "../../utils/AppError.js";
import Registration from './Registration.js';





// login endpoint
export const login = async (req, res) => {
    const { email, password } = req.body;
    // let user = await userModel.findOne({ email })
    try {
        // Check if the user with the provided companyEmail exists in the User model
        const user = await Registration.findOne({ email }, null, { maxTimeMS: 20000 });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, companyEmail: user.companyEmail }, secretKey, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




// Registration endpoint
export const signup = async (req, res) => {
    const {
        name,
        email,
        password,
        mobileNumber,

    } = req.body;

    try {
        // Check if the user with the provided companyEmail exists in the Registration schema
        const existingUser = await Registration.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before storing it (use bcrypt for secure hashing)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user in the Registration schema
        const newUser = new Registration({
            name,
            email,
            password: hashedPassword,
            mobileNumber,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const verifyUser = catchAsyncError(async(req,res,next)=>{
    const {token} = req.params
    const decoded = jwt.verify(token,process.env.JWT_VERIFICATION_KEY)
    let user = await userModel.findOneAndUpdate({email:decoded.email},{isVerified:true},{new:true})
    user ? res.redirect("http://localhost:3000/login") : next(new AppError("failed",400))
})


export const getUserData = catchAsyncError(async(req,res,next)=>{
   
    const userId = req.userId;
    const user = await userModel.findById(userId);
    user ? res.status(200).json({status:200,message:"success",user}) : next(new AppError("Failed to get user data",400))
})


export const updateUser = catchAsyncError(async(req,res,next)=>{
    
    const {name , phone} = req.body;
    const userId = req.userId;   
    const user = await userModel.updateOne({_id:userId},{name,phone},{new:true})
    user?.modifiedCount ? res.status(200).json({status:200,message:"success" , user}) : next(new AppError("failed",400))
})


export const deleteUser = catchAsyncError(async(req,res,next)=>{
   
    const userId = req.userId
    const user= await userModel.deleteOne({_id:userId})
    user ? res.status(200).json({status:200,message:"success"}) : next(new AppError("failed",400))
})


export const softDeleteUser = catchAsyncError(async(req,res,next)=>{
   
    const userId = req.userId
    const user= await userModel.updateOne({_id:userId},{isDeleted:true},{new:true})
    user ? res.status(200).json({status:200,message:"success"}) : next(new AppError("failed",400))
})



export const forgetPassword = catchAsyncError(async(req,res,next)=>{
    const {email} = req.body;
    const token = generateToken({email},process.env.JWT_RESETTING_PASSWORD_KEY,{expiresIn:'5m'})
    let user = await userModel.findOneAndUpdate({email},{resetToken:token},{new:true})
    if (user)
    {        
        sendEmail({email ,html:resetPasswordHTML(token)})
        return res.status(200).json({status:200,message:"success"})
    }
    next(new AppError("failed",400))
    
})


export const resetPassword = catchAsyncError(async(req,res,next)=>{
    const token = req.header('token');
    const {password} = req.body;
    const hash = bcrypt.hashSync(password,8)
    const user = await userModel.findOne({resetToken:token})
    if(user)
    {
        await userModel.updateOne({resetToken:token},{password:hash , $unset: { resetToken: 1 }})
        return res.status(200).json({status:200,message:"success"})
    }
    next(new AppError("failed",400))
    
    
})


export const changePassword = catchAsyncError(async(req,res,next)=>{
    const{oldPassword,newPassword,ConfirmPassword} = req.body
    const userId = req.userId;
    let user = await userModel.findById(userId)
    if(! await bcrypt.compare(oldPassword,user.password))
    {
        return next(new AppError("Incorrect old password",400))
    }
    const hash = bcrypt.hashSync(newPassword,8)
    const updatedUser = await userModel.updateOne({_id:userId},{password:hash})
    return res.status(200).json({status:200,message:"success"})
})


export const logout = catchAsyncError(async(req,res,next)=>{
    const _id = req.userId;
    const user = await userModel.findByIdAndUpdate({_id},{isActive:false})
    user ? res.status(200).json({status:200,message:"success"}) : next(new AppError("failed",400))
})
