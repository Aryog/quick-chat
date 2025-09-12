import { Server, Socket } from "socket.io";
import { produceMessage } from "./helper.js";

interface CustomSocket extends Socket {
  room?: string;
  userId?: string;
  userName?: string;
}

interface MessageData {
  id?: string;
  group_id: string;
  message?: string;
  name: string;
  file?: string;
  created_at?: Date;
}

export function setupSocket(io: Server) {
  // Authentication middleware
  io.use((socket: CustomSocket, next) => {
    const room = socket.handshake.auth.room || socket.handshake.headers.room;
    const userId = socket.handshake.auth.userId || socket.handshake.headers.userId;
    const userName = socket.handshake.auth.userName || socket.handshake.headers.userName;
    
    if (!room) {
      return next(new Error("Invalid room"));
    }
    if (!userId || !userName) {
      return next(new Error("User authentication required"));
    }
    
    socket.room = room;
    socket.userId = userId;
    socket.userName = userName;
    next();
  });

  io.on("connection", (socket: CustomSocket) => {
    console.log(`User ${socket.userName} (${socket.userId}) connected to room ${socket.room}`);
    
    // Join the room
    socket.join(socket.room!);
    
    // Notify others in the room about user joining
    socket.to(socket.room!).emit("user-joined", {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date()
    });

    // Handle chat messages
    socket.on("message", async (data: MessageData) => {
      try {
        // Add metadata to message
        const messageData: MessageData = {
          ...data,
          group_id: socket.room!,
          name: socket.userName!,
          created_at: new Date()
        };

        console.log("Processing message:", messageData);

        // Produce message to Kafka for persistence
        await produceMessage(process.env.KAFKA_TOPIC || "chat-messages", messageData);

        // Broadcast message to all users in the room (including sender for confirmation)
        io.to(socket.room!).emit("message", messageData);

        console.log(`Message sent to room ${socket.room} by ${socket.userName}`);
      } catch (error) {
        console.error("Error processing message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      socket.to(socket.room!).emit("typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: data.isTyping
      });
    });

    // Handle file uploads
    socket.on("file-message", async (data) => {
      try {
        const fileMessageData: MessageData = {
          ...data,
          group_id: socket.room!,
          name: socket.userName!,
          created_at: new Date()
        };

        // Produce file message to Kafka
        await produceMessage(process.env.KAFKA_TOPIC || "chat-messages", fileMessageData);

        // Broadcast file message to room
        io.to(socket.room!).emit("file-message", fileMessageData);

        console.log(`File message sent to room ${socket.room} by ${socket.userName}`);
      } catch (error) {
        console.error("Error processing file message:", error);
        socket.emit("error", { message: "Failed to send file" });
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.userName} (${socket.userId}) disconnected from room ${socket.room}`);
      
      // Notify others in the room about user leaving
      socket.to(socket.room!).emit("user-left", {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userName}:`, error);
    });
  });

  // Handle server-level events
  io.engine.on("connection_error", (err) => {
    console.error("Connection error:", err.req, err.code, err.message, err.context);
  });
}
