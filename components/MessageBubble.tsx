import React from 'react';
import { Message, MessageStatus, MessageType } from '../types';
import { CheckIcon, DoubleCheckIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
    switch (status) {
        case MessageStatus.SENT:
            return <CheckIcon className="w-4 h-4 text-slate-400" />;
        case MessageStatus.DELIVERED:
            return <DoubleCheckIcon className="w-4 h-4 text-slate-400" />;
        case MessageStatus.READ:
            return <DoubleCheckIcon className="w-4 h-4 text-blue-500" />;
        default:
            return null;
    }
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const bubbleClasses = isOwn
    ? 'bg-blue-500 text-white self-end'
    : 'bg-white text-slate-800 self-start';
  
  const isMedia = message.type === MessageType.IMAGE || message.type === MessageType.VIDEO;

  const renderContent = () => {
    switch (message.type) {
      case MessageType.IMAGE:
        return <img src={message.content} alt="shared content" className="rounded-lg max-w-xs md:max-w-sm cursor-pointer" />;
      case MessageType.VIDEO:
        return <video src={message.content} controls className="rounded-lg max-w-xs md:max-w-sm" />;
      case MessageType.VOICE:
        return <audio src={message.content} controls className="w-64" />;
      case MessageType.TEXT:
      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end animate-fade-in-slide-right' : 'items-start animate-fade-in-slide-left'} mb-4`}>
        <div className={`rounded-xl p-1 max-w-lg ${bubbleClasses} ${isMedia ? 'bg-transparent' : ''}`}>
             <div className={`px-3 py-2 ${isMedia ? 'p-0' : ''}`}>
                 {renderContent()}
             </div>
        </div>
        <div className="flex items-center mt-1 px-2">
            <span className="text-xs text-slate-400 mr-1">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && <StatusIcon status={message.status} />}
        </div>
    </div>
  );
};

export default MessageBubble;