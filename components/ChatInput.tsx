
import React, { useState, useRef } from 'react';
import { MessageType } from '../types';
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon, MicrophoneIcon, TrashIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (content: string, type: MessageType) => void;
  onUserTyping: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onUserTyping }) => {
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onUserTyping();
  };

  const handleSend = () => {
    if (mediaFile && mediaPreview) {
      onSendMessage(mediaPreview, mediaFile.type.startsWith('image') ? MessageType.IMAGE : MessageType.VIDEO);
      setMediaFile(null);
      setMediaPreview(null);
    } else if (text.trim()) {
      onSendMessage(text.trim(), MessageType.TEXT);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setMediaFile(null);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access was denied. Please allow microphone access in your browser settings to record voice messages.");
    }
  };

  const stopRecording = (send: boolean) => {
    if (mediaRecorderRef.current && recordingIntervalRef.current) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingIntervalRef.current);

      mediaRecorderRef.current.onstop = () => {
        if (send) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            onSendMessage(base64data, MessageType.VOICE);
          };
        }
        
        setRecordingSeconds(0);
        setIsRecording(false);
        audioChunksRef.current = [];
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      };
    }
  };

  return (
    <div className="bg-slate-100 p-4 border-t border-slate-200">
      {mediaPreview && !isRecording && (
        <div className="relative w-32 h-32 mb-2 p-2 border border-slate-300 rounded-lg bg-slate-200">
          {mediaFile?.type.startsWith('image') ? (
            <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover rounded" />
          ) : (
            <video src={mediaPreview} className="w-full h-full object-cover rounded" controls={false} />
          )}
          <button onClick={clearMedia} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isRecording ? (
        <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-blue-500 mr-3">
            <PaperClipIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-grow bg-transparent focus:outline-none"
            disabled={!!mediaPreview}
          />
          {text.trim() || mediaFile ? (
            <button onClick={handleSend} className="bg-blue-500 text-white rounded-full p-2 ml-3 hover:bg-blue-600 transition-colors">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleStartRecording} className="text-slate-500 hover:text-blue-500 p-2 ml-3 rounded-full hover:bg-slate-100 transition-colors">
              <MicrophoneIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white rounded-full px-4 py-2 shadow-sm">
          <button onClick={() => stopRecording(false)} className="text-red-500 p-2 rounded-full hover:bg-red-50">
            <TrashIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center text-slate-700 font-mono">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            <span>{formatDuration(recordingSeconds)}</span>
          </div>
          <button onClick={() => stopRecording(true)} className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatInput;