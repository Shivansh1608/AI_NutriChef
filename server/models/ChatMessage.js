import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Chat message must belong to a user'],
    },
    sessionId: {
      type: String,
      required: [true, 'Chat message must belong to a session'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['user', 'assistant'],
        message: 'Role must be user or assistant',
      },
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for session history ordering and retrieval
chatMessageSchema.index({ user: 1, sessionId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
