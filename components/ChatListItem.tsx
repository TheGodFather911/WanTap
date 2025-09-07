
import React, { useMemo } from 'react';
import { Conversation, User, MessageType } from '../types';

interface ChatListItemProps {
  conversation: Conversation;
  currentUser: User;
  allUsers: User[];
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ conversation, currentUser, allUsers, isSelected, onSelect }) => {
  const chatPartner = useMemo(() => {
    if (conversation.type === 'private') {
      const partnerId = conversation.participants.find(p => p !== currentUser.id);
      return allUsers.find(u => u.id === partnerId);
    }
    return null;
  }, [conversation, currentUser.id, allUsers]);

  const name = conversation.type === 'group' ? conversation.name : chatPartner?.name;
  const avatar = conversation.type === 'group' ? conversation.avatar : chatPartner?.avatar;
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  const getMessageSnippet = () => {
    if (!lastMessage) return "No messages yet";
    const prefix = lastMessage.senderId === currentUser.id ? "You: " : "";
    switch (lastMessage.type) {
      case MessageType.IMAGE:
        return `${prefix}📷 Photo`;
      case MessageType.VIDEO:
        return `${prefix}📹 Video`;
      case MessageType.VOICE:
        return `${prefix}🎤 Voice Message`;
      default:
        // Ensure content is a string before truncating
        const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
        return `${prefix}${content}`;
    }
  };

  const formattedTimestamp = lastMessage 
    ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <li
      onClick={() => onSelect(conversation.id)}
      className={`flex items-center p-3 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-slate-100'
      }`}
    >
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full mr-4" />
      <div className="flex-grow overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 truncate">{name}</h3>
          <span className="text-xs text-slate-500 flex-shrink-0">{formattedTimestamp}</span>
        </div>
        <p className="text-sm text-slate-500 truncate">{getMessageSnippet()}</p>
      </div>
    </li>
  );
};

export default ChatListItem;
