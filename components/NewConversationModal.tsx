
import React, { useState } from 'react';
import { User } from '../types';
import { XMarkIcon } from './icons';

interface NewConversationModalProps {
  contacts: User[];
  currentUser: User;
  onClose: () => void;
  onCreateConversation: (participantIds: string[], groupName?: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ contacts, currentUser, onClose, onCreateConversation }) => {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  const availableContacts = contacts.filter(c => c.id !== currentUser.id);

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleCreate = () => {
    if (selectedContactIds.length === 0) return;
    if (selectedContactIds.length > 1 && !groupName.trim()) {
      alert('Please enter a group name.');
      return;
    }
    onCreateConversation(selectedContactIds, groupName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">New Conversation</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <XMarkIcon className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {selectedContactIds.length > 1 && (
            <div className="mb-4">
              <label htmlFor="groupName" className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter group name"
              />
            </div>
          )}
          <h3 className="text-sm font-semibold text-slate-500 mb-2">Contacts</h3>
          <ul className="divide-y divide-slate-200">
            {availableContacts.map(contact => (
              <li key={contact.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full mr-3" />
                  <span className="font-medium">{contact.name}</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedContactIds.includes(contact.id)}
                  onChange={() => handleToggleContact(contact.id)}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t bg-slate-50">
          <button
            onClick={handleCreate}
            disabled={selectedContactIds.length === 0}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-slate-400 transition-colors"
          >
            Create Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
