import { memo } from "react";
import ContactListItem from "./ContactListItem";
import OnlineUsersPanel from "./OnlineUsersPanel";

const ContactListSkeleton = () => (
  <div className="px-2 space-y-2 py-2">
    {Array.from({ length: 5 }).map((_, idx) => (
      <div
        key={idx}
        className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/40 animate-pulse"
      >
        <div className="w-9 h-9 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-2 w-16 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

const ContactList = ({
  contacts,
  selectedContactId,
  unreadBySender,
  activityById,
  onlineContacts,
  isAdmin,
  loading,
  onSelectContact,
  hidden,
}) => {
  return (
    <aside
      className={`w-full md:w-72 lg:w-80 border-r border-border p-3 overflow-y-auto bg-background/60 backdrop-blur-sm ${
        hidden ? "hidden md:block" : "block"
      }`}
    >
      <div className="text-sm font-semibold text-foreground px-2 py-2">
        Cuộc trò chuyện
      </div>

      {isAdmin && (
        <OnlineUsersPanel
          onlineContacts={onlineContacts}
          selectedContactId={selectedContactId}
          onSelect={onSelectContact}
        />
      )}

      {loading ? (
        <ContactListSkeleton />
      ) : contacts.length === 0 ? (
        <div className="text-sm text-muted-foreground px-2 py-4">
          Không có liên hệ khả dụng.
        </div>
      ) : (
        contacts.map((contact) => {
          const idStr = String(contact._id);
          return (
            <ContactListItem
              key={contact._id}
              contact={contact}
              isSelected={idStr === String(selectedContactId)}
              unreadCount={Number(unreadBySender[idStr] || 0)}
              activity={activityById.get(idStr)}
              showActivity={isAdmin}
              onSelect={onSelectContact}
            />
          );
        })
      )}
    </aside>
  );
};

export default memo(ContactList);
