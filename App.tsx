
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import NewConversationModal from './components/NewConversationModal';
import CallModal from './components/CallModal';
import Login from './components/Login';
import { supabaseClient } from './lib/supabase';
import { Conversation, User, Message, MessageType, MessageStatus, CallState, CallType } from './types';
import { SpinnerIcon } from './components/icons';

const INITIAL_CALL_STATE: CallState = {
    isActive: false,
    contact: null,
    type: null,
    isLocalVideoEnabled: true,
    isMicEnabled: true,
};

// Helper to convert snake_case from DB to camelCase for UI
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};


const App: React.FC = () => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(() => localStorage.getItem('messenger-user-id'));
    const [users, setUsers] = useState<User[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [callState, setCallState] = useState<CallState>(INITIAL_CALL_STATE);
    const typingTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

    const currentUser = useMemo(() => users.find(u => u.id === currentUserId), [users, currentUserId]);
    const activeConversation = useMemo(() => conversations.find(c => c.id === activeConversationId), [conversations, activeConversationId]);

    useEffect(() => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: usersData, error: usersError } = await supabaseClient.from('users').select('*');
                if (usersError) throw usersError;
                setUsers(toCamelCase(usersData));

                const { data: convosData, error: convosError } = await supabaseClient.from('conversations').select(`
                    id,
                    type,
                    name,
                    avatar,
                    conversation_participants!inner(user_id)
                `).eq('conversation_participants.user_id', currentUserId);

                if (convosError) throw convosError;

                const processedConvos: Conversation[] = toCamelCase(convosData).map((c: any) => ({
                    ...c,
                    participants: c.conversationParticipants.map((p: any) => p.userId),
                    messages: []
                }));

                if (processedConvos.length > 0) {
                    const convoIds = processedConvos.map(c => c.id);
                    const { data: messagesData, error: messagesError } = await supabaseClient
                        .from('messages')
                        .select('*')
                        .in('conversation_id', convoIds)
                        .order('timestamp', { ascending: true });

                    if (messagesError) throw messagesError;

                    const messagesByConvo: { [key: string]: Message[] } = {};
                    toCamelCase(messagesData).forEach((msg: Message) => {
                        if (!messagesByConvo[msg.conversationId]) {
                            messagesByConvo[msg.conversationId] = [];
                        }
                        messagesByConvo[msg.conversationId].push(msg);
                    });

                    processedConvos.forEach(convo => {
                        convo.messages = messagesByConvo[convo.id] || [];
                    });
                    
                    processedConvos.sort((a, b) => {
                        const lastMsgA = a.messages[a.messages.length - 1];
                        const lastMsgB = b.messages[b.messages.length - 1];
                        if (!lastMsgA) return 1;
                        if (!lastMsgB) return -1;
                        return new Date(lastMsgB.timestamp).getTime() - new Date(lastMsgA.timestamp).getTime();
                    });

                    setActiveConversationId(processedConvos[0].id);
                }
                setConversations(processedConvos);

            } catch (err: any) {
                console.error("Initialization error:", err);
                let errorMessage = "An unexpected error occurred.";
                if (err && err.message) errorMessage = err.message;
                setError(`Failed to load chat data: ${errorMessage}. Check your Supabase connection and permissions.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            supabaseClient.removeAllChannels();
        };
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabaseClient.channel('messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMessage: Message = toCamelCase(payload.new);
                setConversations(prevConvos => {
                    const newConvos = [...prevConvos];
                    const convoIndex = newConvos.findIndex(c => c.id === newMessage.conversationId);
                    if (convoIndex > -1) {
                        const updatedConvo = { ...newConvos[convoIndex] };
                        updatedConvo.messages = [...updatedConvo.messages, newMessage];
                        newConvos.splice(convoIndex, 1);
                        newConvos.unshift(updatedConvo);
                    }
                    return newConvos;
                });
            })
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [currentUserId]);

    const handleLoginSuccess = (userId: string) => {
        localStorage.setItem('messenger-user-id', userId);
        setCurrentUserId(userId);
    };

    const handleLogout = () => {
        localStorage.removeItem('messenger-user-id');
        setCurrentUserId(null);
        setConversations([]);
        setActiveConversationId(null);
        setUsers([]);
        setError(null);
    };

    const handleSendMessage = async (content: string, type: MessageType) => {
        if (!activeConversationId || !currentUserId) return;

        const newMessage = {
            sender_id: currentUserId,
            conversation_id: activeConversationId,
            content: content,
            type: type,
            status: MessageStatus.SENT,
        };

        const { error } = await supabaseClient.from('messages').insert(newMessage);
        if (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        }
    };
    
    const handleCreateConversation = async (participantIds: string[], groupName?: string) => {
        if (!currentUserId) return;
        const allParticipantIds = [...new Set([currentUserId, ...participantIds])];

        if (allParticipantIds.length < 2) {
            alert("Cannot create a conversation with yourself.");
            return;
        }

        try {
            if (allParticipantIds.length === 2 && !groupName) { // Private chat
                const { data: existing, error: existingError } = await supabaseClient.rpc('get_private_conversation_id', {
                    user1_id: allParticipantIds[0],
                    user2_id: allParticipantIds[1]
                });

                if (existingError) throw existingError;
                
                if (existing) {
                    setActiveConversationId(existing);
                    setIsNewConvoModalOpen(false);
                    return;
                }
            }

            const { data: convoData, error: convoError } = await supabaseClient.from('conversations').insert({
                type: allParticipantIds.length > 2 ? 'group' : 'private',
                name: groupName || null,
                avatar: groupName ? `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(groupName)}` : null,
            }).select().single();

            if (convoError) throw convoError;

            const participantsToInsert = allParticipantIds.map(userId => ({
                conversation_id: convoData.id,
                user_id: userId,
            }));

            const { error: participantsError } = await supabaseClient.from('conversation_participants').insert(participantsToInsert);
            if (participantsError) throw participantsError;

            const newConversation: Conversation = {
                ...toCamelCase(convoData),
                participants: allParticipantIds,
                messages: [],
            };

            setConversations(prev => [newConversation, ...prev]);
            setActiveConversationId(newConversation.id);
            setIsNewConvoModalOpen(false);

        } catch (err: any) {
            console.error("Error creating conversation:", err);
            alert(`Failed to create conversation: ${err.message}`);
        }
    };
    
    const handleUserTyping = () => {
        if (!activeConversationId || !currentUserId) return;
        const convoId = activeConversationId;
        
        if (typingTimers.current[convoId]) {
            clearTimeout(typingTimers.current[convoId]);
        }

        setConversations(prev => prev.map(c => {
            if (c.id === convoId) {
                const typingUserIds = [...new Set([...(c.typingUserIds || []), currentUserId])];
                return { ...c, typingUserIds };
            }
            return c;
        }));

        typingTimers.current[convoId] = setTimeout(() => {
            setConversations(prev => prev.map(c => {
                if (c.id === convoId) {
                    const typingUserIds = c.typingUserIds?.filter(id => id !== currentUserId);
                    return { ...c, typingUserIds };
                }
                return c;
            }));
            delete typingTimers.current[convoId];
        }, 3000);
    };

    const handleStartCall = (contact: User, type: CallType) => setCallState({ isActive: true, contact, type, isLocalVideoEnabled: true, isMicEnabled: true });
    const handleEndCall = () => setCallState(INITIAL_CALL_STATE);
    const handleToggleMic = () => setCallState(prev => ({ ...prev, isMicEnabled: !prev.isMicEnabled }));
    const handleToggleLocalVideo = () => setCallState(prev => ({ ...prev, isLocalVideoEnabled: !prev.isLocalVideoEnabled }));
    
    if (!currentUserId) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100"><SpinnerIcon className="w-12 h-12 text-blue-500" /></div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center h-screen bg-red-50 text-red-700 p-4"><p className="whitespace-pre-wrap">{error}</p></div>;
    }

    if (!currentUser) {
         return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4">
                <p>Could not load current user data. The session might be invalid.</p>
                <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    Return to Login
                </button>
            </div>
         );
    }

    return (
        <div className="h-screen w-screen flex antialiased text-slate-800">
            <div className="w-full max-w-xs md:w-96 hidden sm:flex flex-col">
                <ChatList
                    conversations={conversations}
                    currentUser={currentUser}
                    allUsers={users}
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                    onNewConversation={() => setIsNewConvoModalOpen(true)}
                    onLogout={handleLogout}
                />
            </div>
            <div className="flex-1 flex flex-col">
                {activeConversation ? (
                    <ChatWindow
                        key={activeConversation.id}
                        conversation={activeConversation}
                        currentUser={currentUser}
                        allUsers={users}
                        onSendMessage={handleSendMessage}
                        onStartCall={handleStartCall}
                        onUserTyping={handleUserTyping}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-slate-50">
                        <p className="text-slate-500">Select a conversation or start a new one.</p>
                    </div>
                )}
            </div>
            {isNewConvoModalOpen && (
                <NewConversationModal
                    contacts={users}
                    currentUser={currentUser}
                    onClose={() => setIsNewConvoModalOpen(false)}
                    onCreateConversation={handleCreateConversation}
                />
            )}
            <CallModal
                callState={callState}
                onEndCall={handleEndCall}
                onToggleMic={handleToggleMic}
                onToggleLocalVideo={handleToggleLocalVideo}
                currentUser={currentUser}
            />
        </div>
    );
};

export default App;
