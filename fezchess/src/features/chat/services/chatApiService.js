import chatService from "../../../services/chatService";
import userService from "../../../services/userService";

const chatApiService = {
  fetchContacts: () => chatService.getContacts(),
  fetchConversation: (contactId) => chatService.getConversation(contactId),
  fetchUnreadSummary: () => chatService.getUnreadSummary(),
  sendMessage: ({ recipientId, content = "", imageUrl = "" }) =>
    chatService.sendMessage(recipientId, content, imageUrl),
  uploadImage: (file) => chatService.uploadChatImage(file),
  fetchActivityStatuses: () => userService.getActivityStatuses(),
};

export default chatApiService;
