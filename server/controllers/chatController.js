import ChatMessage from '../models/ChatMessage.js';

export const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const query = {
      user: req.user._id,
      sessionId,
    };

    const skipIndex = (Number(page) - 1) * Number(limit);

    const total = await ChatMessage.countDocuments(query);
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 }) // Chronological order
      .skip(skipIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
