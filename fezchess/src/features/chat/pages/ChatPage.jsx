import ContactList from "../components/ContactList";
import ConversationHeader from "../components/ConversationHeader";
import MessageInput from "../components/MessageInput";
import MessageList from "../components/MessageList";
import { useChatPageController } from "../hooks/useChatPageController";

const ChatPage = () => {
  const {
    currentUserId,
    isAdmin,
    selectedContact,
    selectedContactId,
    contactsLoading,
    sortedContacts,
    onlineContacts,
    unreadBySender,
    activityById,
    messages,
    messagesLoading,
    sending,
    uploadingImage,
    isPartnerTyping,
    draftContent,
    errorMessage,
    handleSelectContact,
    handleClearSelection,
    handleDraftChange,
    handleSendDraft,
    handleSendImage,
    handleRetryMessage,
  } = useChatPageController();

  const hasSelection = Boolean(selectedContactId);
  const inputDisabled = !hasSelection;

  return (
    <div className="p-3 md:p-6 h-[calc(100dvh-90px)] md:h-[calc(100vh-90px)]">
      <div className="bg-background border border-border rounded-2xl shadow-sm h-full flex overflow-hidden">
        <ContactList
          contacts={sortedContacts}
          selectedContactId={selectedContactId}
          unreadBySender={unreadBySender}
          activityById={activityById}
          onlineContacts={onlineContacts}
          isAdmin={isAdmin}
          loading={contactsLoading}
          onSelectContact={handleSelectContact}
          hidden={hasSelection}
        />

        <section
          className={`flex-1 flex-col ${hasSelection ? "flex" : "hidden md:flex"}`}
        >
          <ConversationHeader
            contact={selectedContact}
            activity={
              isAdmin && selectedContactId
                ? activityById.get(String(selectedContactId))
                : null
            }
            isAdmin={isAdmin}
            isPartnerTyping={isPartnerTyping}
            onClearSelection={handleClearSelection}
          />

          <MessageList
            messages={messages}
            loading={messagesLoading}
            currentUserId={currentUserId}
            selectedContactId={selectedContactId}
            isPartnerTyping={isPartnerTyping}
            onRetryMessage={handleRetryMessage}
          />

          <MessageInput
            value={draftContent}
            onChange={handleDraftChange}
            onSend={handleSendDraft}
            onSendImage={handleSendImage}
            disabled={inputDisabled}
            uploadingImage={uploadingImage}
            sending={sending}
          />

          {errorMessage && (
            <div className="px-4 pb-3 text-xs text-rose-500" role="alert">
              {errorMessage}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
