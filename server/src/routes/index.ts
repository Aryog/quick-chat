import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import ChatGroupController from "../controllers/ChatGroupController.js";
import ChatGroupUserController from "../controllers/ChatGroupUserController.js";
import ChatsController from "../controllers/ChatsController.js";
import authMiddleware from "../middlewares/AuthMiddleware.js";
const router = Router();

router.post('/auth/login', AuthController.login)


router.get("/chat-group", authMiddleware, ChatGroupController.index);
router.get("/chat-group/:id", ChatGroupController.show);
router.post("/chat-group", authMiddleware, ChatGroupController.store);
router.put("/chat-group/:id", authMiddleware, ChatGroupController.update);
router.delete("/chat-group/:id", authMiddleware, ChatGroupController.destroy);

router.get("/chat-group-user", ChatGroupUserController.index);
router.post("/chat-group-user", ChatGroupUserController.store);


// * Chats
router.get("/chats/:groupId", ChatsController.index);

export default router;
