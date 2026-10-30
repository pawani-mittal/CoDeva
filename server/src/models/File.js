import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      match: [/^[^\\/:\*\?"<>\|]+$/, 'Invalid file name. Avoid special characters.'],
    },
    language: {
      type: String,
      required: true,
      default: 'javascript',
    },
    content: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate file names within the same room
fileSchema.index({ roomId: 1, name: 1 }, { unique: true });

export const File = mongoose.model('File', fileSchema);
