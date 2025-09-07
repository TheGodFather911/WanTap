
import React from 'react';
import { Conversation, User } from '../types';
import ChatListItem from './ChatListItem';
import { PlusIcon, LogoutIcon } from './icons';

interface ChatListProps {
  conversations: Conversation[];
  currentUser: User;
  allUsers: User[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onLogout: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ conversations, currentUser, allUsers, activeConversationId, onSelectConversation, onNewConversation, onLogout }) => {
  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Chats</h1>
        <div className="flex items-center space-x-2">
          <button onClick={onNewConversation} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-500" aria-label="New Conversation">
            <PlusIcon className="w-6 h-6" />
          </button>
          <button onClick={onLogout} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-red-500" aria-label="Logout">
            <LogoutIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {conversations.map((convo) => (
          <ChatListItem
            key={convo.id}
            conversation={convo}
            currentUser={currentUser}
            allUsers={allUsers}
            isSelected={convo.id === activeConversationId}
            onSelect={onSelectConversation}
          />
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
