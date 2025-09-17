'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, collection, query, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import ProfileModal from './ProfileModal';
import Onboarding from './Onboarding';
import Settings from './Settings';
import Dashboard from './Dashboard';
import { uiStrings } from '../lib/i18n';

// A new component for the Plot Selection Modal
// A new component for the Plot Selection Modal
function PlotSelectorModal({ plots, activePlot, onSelect, onClose }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800 text-center">Switch Plot</h3>
        </div>
        <ul className="p-2 flex-1 overflow-y-auto">
          {plots.map(plot => (
            <li key={plot.id}>
              <button 
                onClick={() => onSelect(plot)}
                className={`w-full text-left p-3 my-1 rounded-lg flex items-center justify-between transition-colors ${activePlot?.id === plot.id ? 'bg-green-100 text-green-900 font-bold' : 'hover:bg-gray-100 text-gray-800'}`}
              >
                <span className="break-words overflow-hidden pr-2">{plot.plotName}</span>
                {activePlot?.id === plot.id && <i className="fas fa-check text-green-600 flex-shrink-0 ml-2"></i>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


export default function Chat({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [plots, setPlots] = useState([]);
  const [activePlot, setActivePlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlotSelectorOpen, setIsPlotSelectorOpen] = useState(false); // State for the new modal
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [plotToEdit, setPlotToEdit] = useState(null);
  const [speechState, setSpeechState] = useState({ isSpeaking: false, isPaused: false, messageId: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [currentView, setCurrentView] = useState('chat');
  const [networkStatus, setNetworkStatus] = useState('online');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [micError, setMicError] = useState('');

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const synthRef = useRef(null);
  const fileInputRef = useRef(null);

  const t = uiStrings[userProfile?.language] || uiStrings.en;

  // PWA Installation Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setShowInstallButton(false);
        }
        setInstallPrompt(null);
      });
    }
  };

  // Network Status Detection
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const plotsColRef = collection(db, "users", user.uid, "plots");

    const unsubUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) setUserProfile(doc.data());
    });
    
    const unsubPlots = onSnapshot(query(plotsColRef, orderBy("plotName", "asc")), (snapshot) => {
        const userPlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPlots(userPlots);
        if (userPlots.length > 0) {
            if (!activePlot || !userPlots.some(p => p.id === activePlot.id)) {
                setActivePlot(userPlots[0]);
            }
            setShowOnboarding(false);
        } else {
            setShowOnboarding(true);
            setActivePlot(null);
        }
        setLoading(false);
    });
    return () => { unsubUser(); unsubPlots(); };
  }, [user, activePlot]);

  useEffect(() => {
    if (!activePlot?.id || currentView !== 'chat') { setMessages([]); return; }
    const messagesColRef = collection(db, "users", user.uid, "plots", activePlot.id, "messages");
    const q = query(messagesColRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && activePlot) {
        const welcomeText = `This is the chat for '${activePlot.plotName}'. How can I help?`;
        setMessages([{ id: 'welcome', text: welcomeText, isUser: false, timestamp: new Date() }]);
      } else {
        const fetchedMessages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, timestamp: doc.data().timestamp?.toDate() }));
        setMessages(fetchedMessages);
      }
    });
    return () => unsubscribe();
  }, [activePlot, user.uid, currentView]);
  
  const speak = useCallback((text, messageId) => {
      if (synthRef.current && text) {
          synthRef.current.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = userProfile?.language ? `${userProfile.language}-IN` : 'en-IN';
          utterance.onstart = () => setSpeechState({ isSpeaking: true, isPaused: false, messageId });
          utterance.onpause = () => setSpeechState(prev => ({ ...prev, isPaused: true }));
          utterance.onresume = () => setSpeechState(prev => ({ ...prev, isPaused: false }));
          utterance.onend = () => setSpeechState({ isSpeaking: false, isPaused: false, messageId: null });
          utterance.onerror = () => setSpeechState({ isSpeaking: false, isPaused: false, messageId: null });
          synthRef.current.speak(utterance);
      }
  }, [userProfile]);
  
  const handleSpeechControl = (action) => {
      if (!synthRef.current) return;
      if (action === 'pause') synthRef.current.pause();
      if (action === 'resume') synthRef.current.resume();
      if (action === 'stop') synthRef.current.cancel();
  };

  const handleSendMessage = useCallback(async (text, imageFile = null) => {
    const messageText = text.trim();
    if ((!messageText && !imageFile) || isLoadingAI || !activePlot) return;
    
    setInputMessage('');
    setImagePreview(null);
    setIsLoadingAI(true);
    
    const messagesColRef = collection(db, "users", user.uid, "plots", activePlot.id, "messages");
    
    let imageInfo = null;
    if (imageFile) {
        const reader = new FileReader();
        imageInfo = await new Promise((resolve) => {
            reader.readAsDataURL(imageFile);
            reader.onloadend = () => {
                resolve({
                    base64: reader.result.split(',')[1],
                    type: imageFile.type,
                    url: URL.createObjectURL(imageFile)
                });
            };
        });
    }

    const userMessage = { text: messageText, isUser: true, timestamp: new Date(), imageUrl: imageInfo?.url || null };
    await addDoc(messagesColRef, userMessage);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: [...messages, userMessage], 
                plotData: activePlot, 
                userProfile,
                imageData: imageInfo?.base64 || null,
                imageMimeType: imageInfo?.type || null
            }),
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed to get response.');
        const result = await response.json();
        let aiText = result.text;
        
        if (aiText.includes("PROACTIVE_UPDATE_SUGGESTION:")) {
            const parts = aiText.split("PROACTIVE_UPDATE_SUGGESTION:");
            aiText = parts[0].trim();
            const cropToUpdate = parts[1].trim();
            const updateMessage = {
                text: `Shall I update your plot details to show you are growing ${cropToUpdate}?`,
                isUser: false, isUpdateSuggestion: true, crop: cropToUpdate, timestamp: new Date()
            };
            if (aiText) {
                const aiMsgDoc = await addDoc(messagesColRef, { text: aiText, isUser: false, timestamp: new Date() });
                speak(aiText, aiMsgDoc.id);
            }
            await addDoc(messagesColRef, updateMessage);
        } else {
            const aiResponse = { text: aiText, isUser: false, timestamp: new Date() };
            const docRef = await addDoc(messagesColRef, aiResponse);
            speak(aiText, docRef.id);
        }
    } catch (error) {
        console.error("API Error:", error);
        const errorResponse = { text: `Sorry, an error occurred: ${error.message}`, isUser: false, timestamp: new Date() };
        const docRef = await addDoc(messagesColRef, errorResponse);
        speak(errorResponse.text, docRef.id);
    } finally {
        setIsLoadingAI(false);
    }
  }, [isLoadingAI, messages, activePlot, user.uid, userProfile, speak]);

  const executeSend = useCallback(() => {
      handleSendMessage(inputMessage, imagePreview?.file);
  }, [handleSendMessage, inputMessage, imagePreview]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = userProfile?.language ? `${userProfile.language}-IN` : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setMicError('');
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
        };
        
        recognition.onerror = (event) => {
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission denied. Please allow access in your browser settings.');
            console.error('Speech recognition error: not-allowed. Please grant microphone permission.');
          } else if (event.error !== 'no-speech') {
            setMicError('An error occurred with speech recognition.');
            console.error('Speech recognition error:', event.error);
          }
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [userProfile]);

  const handleSignOut = () => signOut(auth);

  const toggleListen = () => {
    if (!recognitionRef.current) {
        setMicError('Speech recognition is not supported by your browser.');
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      synthRef.current.cancel();
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setMicError('Could not start microphone. Please try again.');
        setIsListening(false); 
      }
    }
  };

  const handleSavePlot = async (plotData) => {
    const plotId = plotToEdit?.id || Date.now().toString();
    const plotDocRef = doc(db, "users", user.uid, "plots", plotId);
    const dataToSave = {...plotData, location: plotData.location || initialLocation };
    await setDoc(plotDocRef, dataToSave, { merge: true });
    if (!plotToEdit) setActivePlot({ id: plotDocRef.id, ...dataToSave });
    setIsProfileModalOpen(false);
    setPlotToEdit(null);
  };
  
  const handleUpdateUser = async (userData) => {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, userData, { merge: true });
  };
  
  const handleUpdateCrop = async (plot, crop) => {
    if (!plot) return;
    const plotDocRef = doc(db, "users", user.uid, "plots", plot.id);
    await setDoc(plotDocRef, { crop: crop }, { merge: true });
    const messagesColRef = collection(db, "users", user.uid, "plots", plot.id, "messages");
    await addDoc(messagesColRef, { text: `Ok, I've updated your plot to show you are growing ${crop}. What's our next step?`, isUser: false, timestamp: new Date()});
  };

  const openModalForNewPlot = () => { setPlotToEdit(null); setIsProfileModalOpen(true); };
  const openModalForEdit = (plot) => { setPlotToEdit(plot); setIsProfileModalOpen(true); };
  
  const handleOnboardingFinish = (detectedLocation) => {
      setInitialLocation(detectedLocation);
      setShowOnboarding(false);
      openModalForNewPlot();
  }
  
  const handleFileChange = (event) => {
      const file = event.target.files[0];
      if (file) setImagePreview({ file, url: URL.createObjectURL(file) });
      event.target.value = null;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-lg">Loading Your Farm...</p></div>;
  if (showOnboarding) return <Onboarding onComplete={handleOnboardingFinish} />;

  return (
    <>
      <div className="flex flex-col h-screen w-full mx-auto bg-white shadow-2xl font-sans">
        {/* Network Status Indicator */}
        {networkStatus === 'offline' && (
          <div className="bg-yellow-500 text-white text-center py-1 text-sm">
            <i className="fas fa-wifi-slash mr-2"></i> Offline Mode
          </div>
        )}
        
        <header className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 sm:px-5 py-3 flex justify-between items-center shadow-lg shrink-0">
          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full shadow-md">
              <i className="fas fa-seedling text-2xl text-white"></i>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide drop-shadow-sm">
              Krishi <span className="text-yellow-300">Sakhi</span>
            </h1>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-1 text-xs sm:text-sm bg-white text-green-700 font-medium rounded-full shadow-sm hover:bg-gray-100 transition"
              >
                <i className="fas fa-download mr-1"></i> Install
              </button>
            )}

            <button
              title={t.settings}
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-full hover:bg-white/20 transition"
            >
              <i className="fas fa-cog text-lg sm:text-xl"></i>
            </button>

            <button
              title="Sign Out"
              onClick={handleSignOut}
              className="px-3 py-1 bg-red-100/40 text-red-500 font-semibold rounded-full hover:bg-red-200/60 hover:text-red-600 transition text-xs sm:text-sm"
            >
              <i className="fas fa-sign-out-alt mr-1"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'chat' ? (
            <>
              {/* --- IMPROVED PLOT SELECTOR BAR --- */}
              <div className="p-3 bg-gray-50 z-10 shrink-0 border-b border-gray-200">
                <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4">
                  {activePlot ? (
                    <div className="flex items-center justify-between w-full space-x-2">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-grow min-w-0">
                        <i className="fas fa-leaf text-green-600 text-3xl sm:text-4xl"></i>
                        <button onClick={() => setIsPlotSelectorOpen(true)} className="flex-grow min-w-0 text-left">
                          <div className="flex items-center">
                            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{activePlot.plotName || 'Unnamed Plot'}</p>
                            <i className="fas fa-chevron-down text-gray-500 text-xs ml-2 shrink-0"></i>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{`${activePlot.landSize || ''} | ${activePlot.crop || 'Crop not set'}`}</p>
                        </button>
                      </div>
                      <button onClick={() => openModalForEdit(activePlot)} className="text-xs sm:text-sm font-semibold text-green-600 hover:text-green-800 flex items-center flex-shrink-0 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">{t.editPlot}</span>
                      </button>
                    </div>
                  ) : ( <p className="text-center text-gray-500">Please create a plot in Settings to begin.</p> )}
                </div>
              </div>

              <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-100">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-fit max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow relative ${msg.isUser ? 'bg-green-100 text-gray-900' : 'bg-white text-gray-900'}`}>
                        {msg.imageUrl && ( <div className="relative h-40 sm:h-48 w-full mb-2"><Image src={msg.imageUrl} alt="User upload" layout="fill" objectFit="cover" className="rounded-lg" /></div> )}
                        <p className="text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></p>
                        {!msg.isUser && !msg.isUpdateSuggestion && (
                            <div className="absolute -bottom-3 -right-2 flex space-x-1">
                                {speechState.isSpeaking && speechState.messageId === msg.id ? (
                                    <>
                                        <button onClick={() => speechState.isPaused ? handleSpeechControl('resume') : handleSpeechControl('pause')} className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"><i className={`fas ${speechState.isPaused ? 'fa-play' : 'fa-pause'} text-xs`}></i></button>
                                        <button onClick={() => handleSpeechControl('stop')} className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"><i className="fas fa-stop text-xs"></i></button>
                                    </>
                                ) : (
                                    <button onClick={() => speak(msg.text, msg.id)} className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"><i className="fas fa-volume-up text-xs"></i></button>
                                )}
                            </div>
                        )}
                        {msg.isUpdateSuggestion && (
                            <div className="mt-2 pt-2 border-t border-green-200">
                                <button onClick={() => handleUpdateCrop(activePlot, msg.crop)} className="w-full text-left text-sm font-bold text-green-700 hover:bg-green-200 p-2 rounded-md">{t.updatePlotTo(msg.crop)}</button>
                            </div>
                        )}
                    </div>
                  </div>
                ))}
                {isLoadingAI && ( <div className="flex justify-start"><div className="w-fit max-w-xs md:max-w-md rounded-2xl p-3 shadow bg-white"><p className="text-gray-500 animate-pulse">{t.typing}</p></div></div> )}
                <div ref={chatEndRef} />
              </main>
              
              <div className="bg-white border-t shrink-0">
                  {imagePreview && (
                      <div className="p-2 bg-gray-100 relative">
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                              <Image src={imagePreview.url} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                          </div>
                          <button onClick={() => setImagePreview(null)} className="absolute top-0 right-0 m-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"><i className="fas fa-times"></i></button>
                      </div>
                  )}
                  {micError && <p className="text-xs text-red-500 text-center px-3 pt-2">{micError}</p>}
                  <div className="p-3 flex items-center space-x-2">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <button title="Upload Image" onClick={() => fileInputRef.current.click()} className="bg-green-100 text-green-700 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 hover:bg-green-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                      <input type="text" placeholder={imagePreview ? "Ask about this image..." : t.inputPlaceholder} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeSend()} className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-full text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <button onClick={executeSend} className="bg-green-600 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 hover:bg-green-700"><i className="fas fa-paper-plane text-lg sm:text-xl"></i></button>
                      <button onClick={toggleListen} className={`${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0`}><i className={`fas ${isListening ? 'fa-microphone-slash' : 'fa-microphone'} text-lg sm:text-xl`}></i></button>
                  </div>
              </div>
            </>
          ) : (
            <Dashboard 
              user={user} 
              userProfile={userProfile} 
              plots={plots} 
              activePlot={activePlot} 
              onEditPlot={openModalForEdit}
            />
          )}
        </div>
        
        {/* Bottom Navigation Bar */}
        <nav className="bg-white border-t border-gray-200 p-2 flex justify-around items-center shrink-0">
          <button 
            onClick={() => setCurrentView('chat')} 
            className={`flex flex-col items-center justify-center w-16 sm:w-20 h-14 sm:h-16 rounded-xl ${currentView === 'chat' ? 'bg-green-100 text-green-700' : 'text-gray-600'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Chat</span>
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`flex flex-col items-center justify-center w-16 sm:w-20 h-14 sm:h-16 rounded-xl ${currentView === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-600'} transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
        </nav>
      </div>

      {/* --- MODALS --- */}
      {isPlotSelectorOpen && (
        <PlotSelectorModal
          plots={plots}
          activePlot={activePlot}
          onClose={() => setIsPlotSelectorOpen(false)}
          onSelect={(plot) => {
            setActivePlot(plot);
            setIsPlotSelectorOpen(false);
          }}
        />
      )}
      {isProfileModalOpen && ( <ProfileModal plotData={plotToEdit || { location: initialLocation }} onSave={handleSavePlot} onClose={() => { setIsProfileModalOpen(false); setPlotToEdit(null); }} /> )}
      {isSettingsModalOpen && <Settings user={user} userProfile={userProfile} onUpdateUser={handleUpdateUser} plots={plots} onEditPlot={(plot) => { setIsSettingsModalOpen(false); openModalForEdit(plot); }} onAddNewPlot={() => { setIsSettingsModalOpen(false); openModalForNewPlot(); }} onClose={() => setIsSettingsModalOpen(false)} />}
    </>
  );
}