// Fix: Define enums for MessageType and MessageStatus.
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  VOICE = 'voice',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum CallType {
    VOICE = 'voice',
    VIDEO = 'video',
}

// Fix: Define interfaces for User, Message, and Conversation.
export interface User {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string;
}

export interface Message {
  id: string;
  senderId: string;
  // Fix: Add conversationId to the Message interface to align with the database schema and resolve a type error in App.tsx.
  conversationId: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  status: MessageStatus;
}

export interface Conversation {
  id:string;
  type: 'private' | 'group';
  participants: string[];
  messages: Message[];
  name?: string; // for group chats
  avatar?: string; // for group chats
  typingUserIds?: string[]; // for typing indicator
}

export interface CallState {
    isActive: boolean;
    contact: User | null;
    type: CallType | null;
    isLocalVideoEnabled: boolean;
    isMicEnabled: boolean;
}