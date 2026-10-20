import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import * as aiService from '../services/aiService.js';

export const initChatSocket = (io) => {
  // Socket.io Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_key_12345');
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      console.error('[Socket Auth] Verification failed:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Authenticated client connected: ${socket.id} (User: ${socket.userId})`);

    // Handle incoming chat messages
    socket.on('chat:message', async (data) => {
      const { sessionId, content } = data;

      if (!sessionId || !content) {
        socket.emit('chat:error', { message: 'Session ID and content are required' });
        return;
      }

      try {
        // 1) Save the user's message to the database
        const userMsg = await ChatMessage.create({
          user: socket.userId,
          sessionId,
          role: 'user',
          content,
        });

        // Echo the user's saved message back to the client to confirm it was sent
        socket.emit('chat:message_received', userMsg);

        // Emit typing indicator on behalf of assistant
        socket.emit('chat:typing', { isTyping: true });

        // 2) Retrieve last 10 messages for context
        const history = await ChatMessage.find({
          user: socket.userId,
          sessionId,
        })
          .sort({ createdAt: -1 })
          .limit(10);

        // Reverse history to keep chronological order [oldest to newest]
        const historyContext = history.reverse();

        // 3) Stream response from AI Service
        let assistantContent = '';

        await aiService.streamChatResponse({
          messages: historyContext,
          onToken: (token) => {
            // Turn off typing indicator when first token arrives
            if (assistantContent === '') {
              socket.emit('chat:typing', { isTyping: false });
            }
            assistantContent += token;
            // Send incremental token to client
            socket.emit('chat:token', { token });
          },
        });

        // 4) Save full assistant message to the database
        const assistantMsg = await ChatMessage.create({
          user: socket.userId,
          sessionId,
          role: 'assistant',
          content: assistantContent,
        });

        // 5) Notify client that streaming is complete, sending the saved message details
        socket.emit('chat:done', assistantMsg);
      } catch (err) {
        console.error('[Socket Chat] Error handling message:', err);
        socket.emit('chat:typing', { isTyping: false });
        socket.emit('chat:error', { message: err.message || 'Error generating response' });
      }
    });

    // Handle typing events from client (can be broadcast if needed)
    socket.on('chat:typing_client', (data) => {
      // Echo user typing state to any other sessions if appropriate (optional in 1-on-1, but useful for logs)
      console.log(`[Socket] User ${socket.userId} typing state in session ${data.sessionId}: ${data.isTyping}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
