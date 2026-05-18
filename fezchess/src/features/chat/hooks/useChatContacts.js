import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import chatApiService from "../services/chatApiService";
import {
  CHAT_EVENTS,
  subscribeChatEvent,
  subscribeSocketLifecycle,
} from "../services/chatSocketClient";

const updateContactLastMessageAt = (contacts, contactId, createdAt) => {
  if (!contactId) return contacts;
  return contacts.map((contact) =>
    String(contact._id) === String(contactId)
      ? {
          ...contact,
          lastMessageAt: createdAt || contact.lastMessageAt,
        }
      : contact,
  );
};

export const useChatContacts = ({ currentUserId } = {}) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);

  const refreshContacts = useCallback(async () => {
    try {
      const data = await chatApiService.fetchContacts();
      if (!isMountedRef.current) return;
      setContacts(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(e?.response?.data?.message || "Không thể tải danh sách chat.");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refreshContacts();
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshContacts]);

  useEffect(() => {
    const handleNewMessage = (payload) => {
      if (!payload) return;
      const partnerId =
        String(payload.senderId) === String(currentUserId)
          ? payload.recipientId
          : payload.senderId;
      if (!partnerId) return;
      setContacts((prev) =>
        updateContactLastMessageAt(prev, partnerId, payload.createdAt),
      );
    };

    const offNew = subscribeChatEvent(CHAT_EVENTS.MESSAGE_NEW, handleNewMessage);
    const offSent = subscribeChatEvent(
      CHAT_EVENTS.MESSAGE_SENT,
      handleNewMessage,
    );
    const offLifecycle = subscribeSocketLifecycle({
      onConnect: () => {
        refreshContacts();
      },
      onReconnect: () => {
        refreshContacts();
      },
    });

    return () => {
      offNew();
      offSent();
      offLifecycle();
    };
  }, [currentUserId, refreshContacts]);

  const contactsById = useMemo(() => {
    const map = new Map();
    contacts.forEach((contact) => {
      if (contact?._id) {
        map.set(String(contact._id), contact);
      }
    });
    return map;
  }, [contacts]);

  return {
    contacts,
    contactsById,
    loading,
    error,
    refreshContacts,
  };
};
