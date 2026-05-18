import { useCallback, useEffect, useMemo, useState } from "react";
import authService from "../../../services/authService";
import { useActivityStatus } from "./useActivityStatus";
import { useChatContacts } from "./useChatContacts";
import { useConversation } from "./useConversation";
import { useTypingIndicator } from "./useTypingIndicator";
import { useUnreadSummary } from "./useUnreadSummary";

const isAdminRole = (role) => String(role || "").toLowerCase() === "admin";

const buildSortedContacts = (contacts, unreadBySender) =>
  [...contacts].sort((a, b) => {
    const unreadA = Number(unreadBySender[String(a._id)] || 0);
    const unreadB = Number(unreadBySender[String(b._id)] || 0);
    if (unreadA !== unreadB) return unreadB - unreadA;
    const timeA = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const timeB = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return String(a.fullName || a.username || "").localeCompare(
      String(b.fullName || b.username || ""),
      "vi",
    );
  });

const buildOnlineContacts = ({ activityUsers, contacts, isAdmin }) => {
  if (!isAdmin || activityUsers.length === 0) return [];
  const contactIds = new Set(contacts.map((c) => String(c._id)));
  return activityUsers
    .filter((user) => user.isActive && contactIds.has(String(user._id)))
    .sort(
      (a, b) =>
        new Date(b.lastSeenAt || 0).getTime() -
        new Date(a.lastSeenAt || 0).getTime(),
    );
};

export const useChatPageController = () => {
  const currentUser = useMemo(() => authService.getCurrentUser(), []);
  const currentUserId = currentUser?._id || currentUser?.userId;
  const isAdmin = isAdminRole(currentUser?.role);

  const [selectedContactId, setSelectedContactId] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const {
    contacts,
    contactsById,
    loading: contactsLoading,
    error: contactsError,
  } = useChatContacts({ currentUserId });

  const { activityUsers } = useActivityStatus({ enabled: isAdmin });

  const { unreadBySender, clearUnreadFor } = useUnreadSummary({
    currentUserId,
    selectedContactId,
  });

  const conversation = useConversation({
    currentUserId,
    selectedContactId,
  });

  const { onUserTyping, sendStopTypingNow, isPartnerTyping } =
    useTypingIndicator({
      recipientId: selectedContactId,
    });

  useEffect(() => {
    setSelectedContactId((prev) => {
      if (prev && contactsById.has(String(prev))) return prev;
      return contacts.length > 0 ? String(contacts[0]._id) : "";
    });
  }, [contacts, contactsById]);

  const selectedContact = selectedContactId
    ? contactsById.get(String(selectedContactId)) || null
    : null;

  const sortedContacts = useMemo(
    () => buildSortedContacts(contacts, unreadBySender),
    [contacts, unreadBySender],
  );

  const onlineContacts = useMemo(
    () => buildOnlineContacts({ activityUsers, contacts, isAdmin }),
    [activityUsers, contacts, isAdmin],
  );

  const activityById = useMemo(() => {
    const map = new Map();
    activityUsers.forEach((user) => {
      if (user?._id) map.set(String(user._id), user);
    });
    return map;
  }, [activityUsers]);

  const handleSelectContact = useCallback(
    (contactId) => {
      setSelectedContactId(String(contactId || ""));
      clearUnreadFor(contactId);
      setDraftContent("");
      sendStopTypingNow();
    },
    [clearUnreadFor, sendStopTypingNow],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedContactId("");
    setDraftContent("");
    sendStopTypingNow();
  }, [sendStopTypingNow]);

  const handleDraftChange = useCallback(
    (value) => {
      setDraftContent(value);
      if (value && value.trim().length > 0) {
        onUserTyping();
      }
    },
    [onUserTyping],
  );

  const handleSendDraft = useCallback(async () => {
    if (!draftContent.trim()) return;
    sendStopTypingNow();
    const result = await conversation.sendTextMessage(draftContent);
    if (result) {
      setDraftContent("");
    }
  }, [conversation, draftContent, sendStopTypingNow]);

  const handleSendImage = useCallback(
    async (file) => {
      if (!file) return;
      sendStopTypingNow();
      await conversation.sendImageMessage(file);
    },
    [conversation, sendStopTypingNow],
  );

  const handleRetryMessage = useCallback(
    (failedMessage) => {
      conversation.retryFailedMessage(failedMessage);
    },
    [conversation],
  );

  const errorMessage =
    conversation.error || contactsError || "";

  return {
    currentUserId,
    isAdmin,
    selectedContact,
    selectedContactId,
    contactsLoading,
    sortedContacts,
    onlineContacts,
    unreadBySender,
    activityById,
    messages: conversation.messages,
    messagesLoading: conversation.loading,
    sending: conversation.sending,
    uploadingImage: conversation.uploadingImage,
    isPartnerTyping,
    draftContent,
    errorMessage,
    handleSelectContact,
    handleClearSelection,
    handleDraftChange,
    handleSendDraft,
    handleSendImage,
    handleRetryMessage,
  };
};
