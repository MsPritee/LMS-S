import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const registrationSchema = new Schema({
    name: String,
    email: String,
    password: String,
    mobileNumber: String,
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
