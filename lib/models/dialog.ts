import mongoose, { Document, Model } from 'mongoose';

export interface IMessage {
  text: string,
  sender: string,
}

export interface IDialog {
  _id?: mongoose.Types.ObjectId;
  messages: IMessage[],
  temperature: number,
  model: string,
  owner: string,
}

const MessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const DialogSchema = new mongoose.Schema(
  {
    messages: {
      type: [MessageSchema],
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
  },
);

const Dialog = mongoose.models.Dialog as Model<IDialog> || mongoose.model<IDialog>('Dialog', DialogSchema);
export default Dialog;
