
import React, { useEffect, useRef } from 'react';
import { Conversation, MessageType, User, CallType } from '../types';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: User;
  allUsers: User[];
  onSendMessage: (content: string, type: MessageType) => void;
  onStartCall: (contact: User, type: CallType) => void;
  onUserTyping: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, currentUser, allUsers, onSendMessage, onStartCall, onUserTyping }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Header conversation={conversation} currentUser={currentUser} allUsers={allUsers} onStartCall={onStartCall} />
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col">
          {conversation.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSendMessage={onSendMessage} onUserTyping={onUserTyping} />
    </div>
  );
};

export default ChatWindow;
