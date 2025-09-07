import React, { useMemo } from 'react';
import { Conversation, User, CallType } from '../types';
import { PhoneIcon, VideoCameraIcon } from './icons';

interface HeaderProps {
  conversation: Conversation;
  currentUser: User;
  allUsers: User[];
  onStartCall: (contact: User, type: CallType) => void;
}

const Header: React.FC<HeaderProps> = ({ conversation, currentUser, allUsers, onStartCall }) => {
  const chatPartner = useMemo(() => {
    if (conversation.type === 'private') {
      const partnerId = conversation.participants.find(p => p !== currentUser.id);
      return allUsers.find(u => u.id === partnerId);
    }
    return null;
  }, [conversation, currentUser.id, allUsers]);

  const isPartnerTyping = useMemo(() => {
    if (conversation.type === 'private' && chatPartner) {
      return conversation.typingUserIds?.includes(chatPartner.id);
    }
    // Basic group chat typing indicator
    return conversation.typingUserIds && conversation.typingUserIds.length > 0 && conversation.typingUserIds.some(id => id !== currentUser.id);
  }, [conversation, chatPartner, currentUser.id]);

  const name = conversation.type === 'group' ? conversation.name : chatPartner?.name;
  const avatar = conversation.type === 'group' ? conversation.avatar : chatPartner?.avatar;

  const handleCall = (type: CallType) => {
    if (chatPartner) {
      onStartCall(chatPartner, type);
    } else {
      alert("Group calls are not supported yet.");
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center">
        {avatar && <img src={avatar} alt={name || ''} className="w-10 h-10 rounded-full mr-3" />}
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{name}</h2>
          {isPartnerTyping ? (
             <div className="flex items-baseline h-5">
                <span className="text-sm text-blue-500 font-semibold mr-1">typing</span>
                <span className="animate-dot-bounce text-blue-500 text-lg font-semibold" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-dot-bounce text-blue-500 text-lg font-semibold" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-dot-bounce text-blue-500 text-lg font-semibold" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 h-5">
              {conversation.type === 'private' ? 'Online' : `${conversation.participants.length} members`}
            </p>
          )}
        </div>
      </div>
      {conversation.type === 'private' && chatPartner && (
        <div className="flex items-center space-x-3">
          <button onClick={() => handleCall(CallType.VOICE)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-500 transition-colors" aria-label="Start voice call">
            <PhoneIcon className="w-6 h-6" />
          </button>
          <button onClick={() => handleCall(CallType.VIDEO)} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-500 transition-colors" aria-label="Start video call">
            <VideoCameraIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
