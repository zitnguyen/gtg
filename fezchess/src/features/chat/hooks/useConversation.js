import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import chatApiService from "../services/chatApiService";
import {
  CHAT_EVENTS,
  emitChatEvent,
  subscribeChatEvent,
  subscribeSocketLifecycle,
} from "../services/chatSocketClient";
import {
  MESSAGE_STATUS,
  buildOptimisticMessage,
  markMessageFailed,
  markMessagePending,
  replaceLocalMessage,
  sortMessagesByCreatedAt,
  upsertMessage,
} from "../utils/messageUtils";

const initialState = {
  messages: [],
  loading: false,
  error: "",
  sending: false,
  uploadingImage: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "RESET":
      return { ...initialState };
    case "LOAD_START":
      return { ...state, loading: true, error: "" };
    case "LOAD_SUCCESS":
      return {
        ...state,
        loading: false,
        messages: sortMessagesByCreatedAt(action.messages || []),
        error: "",
      };
    case "LOAD_FAIL":
      return {
        ...state,
        loading: false,
        error: action.error || "Không thể tải tin nhắn.",
      };
    case "SEND_START":
      return {
        ...state,
        sending: true,
        error: "",
        messages: [...state.messages, action.message],
      };
    case "SEND_SUCCESS":
      return {
        ...state,
        sending: false,
        messages: replaceLocalMessage(
          state.messages,
          action.localId,
          action.message,
        ),
      };
    case "SEND_FAIL":
      return {
        ...state,
        sending: false,
        error: action.error || "Gửi tin nhắn thất bại.",
        messages: markMessageFailed(state.messages, action.localId, action.error),
      };
    case "RETRY":
      return {
        ...state,
        messages: markMessagePending(state.messages, action.localId),
      };
    case "UPLOAD_START":
      return { ...state, uploadingImage: true, error: "" };
    case "UPLOAD_DONE":
      return { ...state, uploadingImage: false };
    case "UPLOAD_FAIL":
      return {
        ...state,
        uploadingImage: false,
        error: action.error || "Gửi ảnh thất bại.",
      };
    case "RECEIVE":
      return {
        ...state,
        messages: upsertMessage(state.messages, action.message),
      };
    case "MARK_READ":
      return {
        ...state,
        messages: state.messages.map((message) =>
          String(message._id) === String(action.messageId)
            ? { ...message, readAt: action.readAt }
            : message,
        ),
      };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    default:
      return state;
  }
};

const isPersistedMessage = (message) =>
  message && typeof message._id === "string" && !message._id.startsWith("local-");

const messageMatchesContact = (message, currentUserId, contactId) => {
  if (!message || !currentUserId || !contactId) return false;
  const senderId = String(message.senderId || "");
  const recipientId = String(message.recipientId || "");
  const meId = String(currentUserId);
  const partnerId = String(contactId);
  return (
    (senderId === meId && recipientId === partnerId) ||
    (senderId === partnerId && recipientId === meId)
  );
};

export const useConversation = ({
  currentUserId,
  selectedContactId,
  onIncomingMessage,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const generationRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadConversation = useCallback(async () => {
    if (!selectedContactId) {
      dispatch({ type: "RESET" });
      return;
    }
    generationRef.current += 1;
    const generation = generationRef.current;
    dispatch({ type: "LOAD_START" });
    try {
      const data = await chatApiService.fetchConversation(selectedContactId);
      if (!isMountedRef.current || generation !== generationRef.current) return;
      dispatch({
        type: "LOAD_SUCCESS",
        messages: Array.isArray(data) ? data : [],
      });
    } catch (e) {
      if (!isMountedRef.current || generation !== generationRef.current) return;
      dispatch({
        type: "LOAD_FAIL",
        error: e?.response?.data?.message || "Không thể tải tin nhắn.",
      });
    }
  }, [selectedContactId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const performSend = useCallback(
    async ({ contactId, content, imageUrl, optimistic }) => {
      try {
        const created = await chatApiService.sendMessage({
          recipientId: contactId,
          content,
          imageUrl,
        });
        if (!isMountedRef.current) return null;
        dispatch({
          type: "SEND_SUCCESS",
          localId: optimistic._localId,
          message: created,
        });
        return created;
      } catch (e) {
        if (!isMountedRef.current) return null;
        dispatch({
          type: "SEND_FAIL",
          localId: optimistic._localId,
          error: e?.response?.data?.message || "Gửi tin nhắn thất bại.",
        });
        return null;
      }
    },
    [],
  );

  const sendTextMessage = useCallback(
    async (rawContent) => {
      if (!selectedContactId) return null;
      const content = String(rawContent || "").trim();
      if (!content) return null;

      const optimistic = buildOptimisticMessage({
        senderId: currentUserId,
        recipientId: selectedContactId,
        content,
      });
      dispatch({ type: "SEND_START", message: optimistic });

      return performSend({
        contactId: selectedContactId,
        content,
        imageUrl: "",
        optimistic,
      });
    },
    [currentUserId, performSend, selectedContactId],
  );

  const sendImageMessage = useCallback(
    async (file) => {
      if (!selectedContactId || !file) return null;
      dispatch({ type: "UPLOAD_START" });
      let imageUrl = "";
      try {
        imageUrl = await chatApiService.uploadImage(file);
        if (!imageUrl) throw new Error("Không upload được ảnh");
      } catch (e) {
        dispatch({
          type: "UPLOAD_FAIL",
          error: e?.response?.data?.message || e?.message || "Gửi ảnh thất bại.",
        });
        return null;
      }
      dispatch({ type: "UPLOAD_DONE" });

      const optimistic = buildOptimisticMessage({
        senderId: currentUserId,
        recipientId: selectedContactId,
        imageUrl,
      });
      dispatch({ type: "SEND_START", message: optimistic });

      return performSend({
        contactId: selectedContactId,
        content: "",
        imageUrl,
        optimistic,
      });
    },
    [currentUserId, performSend, selectedContactId],
  );

  const retryFailedMessage = useCallback(
    async (failedMessage) => {
      if (!failedMessage || !failedMessage._localId) return null;
      if (!selectedContactId) return null;

      const localId = failedMessage._localId;
      dispatch({ type: "RETRY", localId });

      try {
        const created = await chatApiService.sendMessage({
          recipientId: selectedContactId,
          content: failedMessage.content || "",
          imageUrl: failedMessage.imageUrl || "",
        });
        if (!isMountedRef.current) return null;
        dispatch({ type: "SEND_SUCCESS", localId, message: created });
        return created;
      } catch (e) {
        if (!isMountedRef.current) return null;
        dispatch({
          type: "SEND_FAIL",
          localId,
          error: e?.response?.data?.message || "Gửi tin nhắn thất bại.",
        });
        return null;
      }
    },
    [selectedContactId],
  );

  useEffect(() => {
    const handleIncoming = (payload) => {
      if (!payload || !isPersistedMessage(payload)) return;
      if (!messageMatchesContact(payload, currentUserId, selectedContactId)) {
        if (typeof onIncomingMessage === "function") {
          onIncomingMessage(payload);
        }
        return;
      }
      dispatch({ type: "RECEIVE", message: payload });
      if (typeof onIncomingMessage === "function") {
        onIncomingMessage(payload);
      }

      const isFromOther =
        String(payload.senderId) !== String(currentUserId) &&
        payload.readAt == null;
      if (isFromOther) {
        emitChatEvent(CHAT_EVENTS.MESSAGE_MARK_READ, {
          messageId: payload._id,
        });
      }
    };

    const handleMessageRead = (payload) => {
      if (!payload?.messageId) return;
      dispatch({
        type: "MARK_READ",
        messageId: payload.messageId,
        readAt: payload.readAt || new Date().toISOString(),
      });
    };

    const offNew = subscribeChatEvent(CHAT_EVENTS.MESSAGE_NEW, handleIncoming);
    const offSent = subscribeChatEvent(
      CHAT_EVENTS.MESSAGE_SENT,
      handleIncoming,
    );
    const offRead = subscribeChatEvent(
      CHAT_EVENTS.MESSAGE_READ,
      handleMessageRead,
    );
    const offLifecycle = subscribeSocketLifecycle({
      onReconnect: () => {
        loadConversation();
      },
    });

    return () => {
      offNew();
      offSent();
      offRead();
      offLifecycle();
    };
  }, [currentUserId, loadConversation, onIncomingMessage, selectedContactId]);

  const hasPendingMessages = useMemo(
    () => state.messages.some((m) => m._status === MESSAGE_STATUS.PENDING),
    [state.messages],
  );

  return {
    ...state,
    hasPendingMessages,
    sendTextMessage,
    sendImageMessage,
    retryFailedMessage,
    refreshConversation: loadConversation,
  };
};
