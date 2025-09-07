

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { CallState, CallType, User } from '../types';
import { PhoneIcon, MicrophoneIcon, MicrophoneSlashIcon, VideoCameraIcon, VideoCameraSlashIcon } from './icons';

interface CallModalProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleLocalVideo: () => void;
  currentUser: User;
}

// Fix: Provide valid base64 encoded audio for mute/unmute sounds.
const MUTE_SOUND_B64 = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABgAZGF0YUYAAAD//w==';
const UNMUTE_SOUND_B64 = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABgAZGF0YUYAAAAIAAE=';

// Fix: Implement the CallModal component and add a default export. This resolves all errors.
const CallModal: React.FC<CallModalProps> = ({ callState, onEndCall, onToggleMic, onToggleLocalVideo, currentUser }) => {
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const muteAudio = useMemo(() => new Audio(MUTE_SOUND_B64), []);
  const unmuteAudio = useMemo(() => new Audio(UNMUTE_SOUND_B64), []);

  useEffect(() => {
    // Fix: Use ReturnType<typeof setInterval> for the timer to avoid NodeJS namespace errors in a browser environment.
    let timer: ReturnType<typeof setInterval>;
    if (callState.isActive) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.isActive]);

  useEffect(() => {
    if (callState.type === CallType.VIDEO && callState.isActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream; // Mock remote with local stream
        })
        .catch(err => {
          console.error("Error accessing media devices.", err);
          alert("Could not access camera or microphone. Please check permissions.");
        });
    } else if (!callState.isActive) {
        [localVideoRef, remoteVideoRef].forEach(ref => {
            if (ref.current && ref.current.srcObject) {
                const stream = ref.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                ref.current.srcObject = null;
            }
        });
    }
  }, [callState.type, callState.isActive]);
  
  const handleToggleMicWithSound = () => {
    if (callState.isMicEnabled) {
      muteAudio.play().catch(e => console.error("Error playing mute sound", e));
    } else {
      unmuteAudio.play().catch(e => console.error("Error playing unmute sound", e));
    }
    onToggleMic();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!callState.isActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center text-white p-4 animate-fade-in">
      <div className="text-center mb-4">
        <img src={callState.contact?.avatar} alt={callState.contact?.name} className="w-24 h-24 rounded-full mx-auto mb-3 border-4 border-white" />
        <h2 className="text-3xl font-bold">{callState.contact?.name}</h2>
        <p className="text-lg">{formatDuration(callDuration)}</p>
      </div>

      {callState.type === CallType.VIDEO && (
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden mb-4 shadow-lg">
          <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" muted={!callState.isMicEnabled}></video>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className={`absolute bottom-4 right-4 w-1/4 max-w-[150px] rounded-lg border-2 border-white transition-all duration-300 ${callState.isLocalVideoEnabled ? 'opacity-100' : 'opacity-0 scale-90'}`}
          ></video>
        </div>
      )}

      <div className="flex items-center space-x-6 mt-4">
        <button onClick={handleToggleMicWithSound} className={`p-4 rounded-full transition-colors ${callState.isMicEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
          {callState.isMicEnabled ? <MicrophoneIcon className="w-7 h-7" /> : <MicrophoneSlashIcon className="w-7 h-7" />}
        </button>
        {callState.type === CallType.VIDEO && (
          <button onClick={onToggleLocalVideo} className={`p-4 rounded-full transition-colors ${callState.isLocalVideoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'}`}>
            {callState.isLocalVideoEnabled ? <VideoCameraIcon className="w-7 h-7" /> : <VideoCameraSlashIcon className="w-7 h-7" />}
          </button>
        )}
        <button onClick={onEndCall} className="p-4 bg-red-500 rounded-full hover:bg-red-600 transition-colors">
          <PhoneIcon className="w-7 h-7 transform -rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default CallModal;