import mongoose, { Schema, Document } from 'mongoose';

export interface IMessengerUser extends Document {
  psid: string;
  phoneNumber?: string;
  userId?: Schema.Types.ObjectId;
  otpToken?: string;
  otpExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messengerUserSchema = new Schema<IMessengerUser>(
  {
    psid: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    otpToken: { type: String },
    otpExpire: { type: Date },
  },
  { timestamps: true }
);

export default
  mongoose.models.MessengerUser ||
  mongoose.model<IMessengerUser>('MessengerUser', messengerUserSchema); 