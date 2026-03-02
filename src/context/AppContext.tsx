
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { translations, TranslationKey } from '@/lib/translations';
import { 
    getAllUsers, 
    getUserByEmail, 
    saveUser,
    getChatHistoryForUser,
    saveChatHistory,
    deleteChatHistory as deleteChatHistoryFile,
    getTestimonials,
    saveTestimonial,
    deleteTestimonial as deleteTestimonialFile,
    updateUserData,
    saveNotification,
    getNotifications,
    getFeedback,
    saveFeedback as saveFeedbackFile,
    type UserData,
    type ChatSession,
    type AppMessage,
    type Testimonial,
    type Notification,
    type Feedback,
} from '@/lib/local-data';
import { v4 as uuidv4 } from 'uuid';
import { toConnectHandle } from '@/lib/connect-profile';

export type { UserData, ChatSession, AppMessage, Testimonial, Notification, Feedback };
export type Language = 'en' | 'hi' | 'en-hi' | 'bn' | 'bh';

interface AppContextType {
  theme: string;
  setTheme: (theme: string) => void;
  messages: AppMessage[];
  setMessages: (messages: AppMessage[]) => void;
  addMessage: (message: AppMessage) => void;
  startNewChat: () => void;
  loadChat: (id: string) => void;
  updateChatTitle: (id: string, title: string) => void;
  deleteChat: (id: string) => Promise<void>;
  history: ChatSession[];
  activeChatId: string | null;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  character: string;
  setCharacter: (character: string) => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  user: UserData | null;
  userEmail: string | null;
  userName: string | null;
  userPlan: UserData['plan'] | null;
  loginUser: (credentials: Pick<any, 'email' | 'password'>) => Promise<boolean>;
  signUpWithEmail: (credentials: Pick<any, 'name' | 'email' | 'password' | 'phone' | 'gender'>) => Promise<UserData | null>;
  logoutUser: () => void;
  updateUser: (data: Partial<Pick<UserData, 'displayName' | 'photoURL'>>) => Promise<void>;
  testimonials: Testimonial[];
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'avatar' | 'avatarHint' | 'createdAt'>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  refreshUserSession: () => Promise<void>;
  saveFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  lastCheckedNotifs: string | null;
  setLastCheckedNotifs: (date: string | null) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

const getInitialMessage = (isLoggedIn: boolean, userName: string | null, language: Language): AppMessage => {
    const t = (key: TranslationKey) => translations[language][key] || translations['en'][key];
    return {
        role: 'assistant',
        content: isLoggedIn && userName
            ? t('chat.initial_message_logged_in').replace('{name}', userName)
            : t('chat.initial_message'),
        createdAt: new Date().toISOString(),
    };
};

const sendPlanNotification = async (user: UserData, t: (key: TranslationKey) => string) => {
    let title = '';
    let description = '';

    switch (user.plan) {
        case 'Free':
            title = `Welcome, ${user.displayName}!`;
            description = `You are on the ${t('plan.free')} Plan. Features: ${t('plan.free.feature1')}, ${t('plan.free.feature2')}.`;
            break;
        case 'Business':
            title = `Welcome Back, ${user.displayName}!`;
            description = `You have the ${t('plan.business')} Plan. Features: ${t('plan.business.feature1')}, ${t('plan.business.feature2')}, and ${t('plan.business.feature3')}.`;
            break;
        case 'Enterprise':
             title = `Welcome, ${user.displayName}!`;
            description = `You have the ${t('plan.enterprise')} Plan with full access. Features: ${t('plan.enterprise.feature1')} and ${t('plan.enterprise.feature3')}.`;
            break;
    }

    if (title && description) {
        await saveNotification({ title, description, userId: user.id });
    }
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState('light');
  const [messages, setMessagesState] = useState<AppMessage[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>('en');
  const [character, setCharacterState] = useState('defaultt');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheckedNotifs, setLastCheckedNotifs] = useState<string | null>(null);
  
  const t = useCallback((key: TranslationKey): string => {
    return translations[language]?.[key] || translations['en'][key];
  }, [language]);

    const fetchTestimonials = useCallback(async () => {
        try {
            const testimonialsList = await getTestimonials();
            setTestimonials(testimonialsList);
        } catch (error) {
            console.error("Error fetching testimonials: ", error);
        }
    }, []);
    
    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        };
        try {
            const notifs = await getNotifications(user.id);
            setNotifications(notifs);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            setNotifications([]);
        }
    }, [user]);


    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);
    
    const fetchHistory = useCallback(async (userId: string) => {
        try {
            const userHistory = await getChatHistoryForUser(userId);
            setHistory(userHistory);
            return userHistory;
        } catch (error) {
            console.error("Error fetching chat history:", error);
            setHistory([]);
            return [];
        }
    }, []);

    const startNewChat = useCallback(async (currentUser: UserData | null, lang: Language) => {
        const isLoggedIn = !!currentUser;
        const userName = currentUser?.displayName || null;
        const initialMessage = getInitialMessage(isLoggedIn, userName, lang);

        if (currentUser) {
            const newChatSession: ChatSession = {
                id: uuidv4(),
                title: "New Chat",
                messages: [initialMessage],
                createdAt: new Date().toISOString()
            };
            await saveChatHistory(currentUser.id, newChatSession);
            setMessagesState([initialMessage]);
            setActiveChatId(newChatSession.id);
            await fetchHistory(currentUser.id)
        } else {
            setMessagesState([initialMessage]);
            setActiveChatId(null);
            setHistory([]);
        }
    }, [fetchHistory]);
    
    const loadChat = useCallback((id: string, chatHistory: ChatSession[]) => {
        const chatToLoad = chatHistory.find(chat => chat.id === id);
        if (chatToLoad) {
            setActiveChatId(chatToLoad.id);
            setMessagesState(chatToLoad.messages);
        } else if (chatHistory.length > 0) {
            // Fallback to the most recent chat if the specified ID is not found
            setActiveChatId(chatHistory[0].id);
            setMessagesState(chatHistory[0].messages);
        }
    }, []);

    const refreshUserSession = useCallback(async (lang: Language) => {
        setLoading(true);
        const userId = sessionStorage.getItem('userId');
        if (userId) {
            const users = await getAllUsers();
            const currentUser = users.find(u => u.id === userId);
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.email === 'support@my.ana');
                setCharacterState(currentUser.character || 'defaultt');
                
                const userHistory = await fetchHistory(currentUser.id);
                if (userHistory.length > 0) {
                    const chatToLoadId = activeChatId || userHistory[0].id;
                    loadChat(chatToLoadId, userHistory);
                } else {
                    const initialMessage = getInitialMessage(true, currentUser.displayName, lang);
                    const chat1: ChatSession = { id: uuidv4(), title: 'Getting Started', messages: [initialMessage], createdAt: new Date().toISOString() };
                    const chat2: ChatSession = { id: uuidv4(), title: 'Example Conversation', messages: [{role: 'assistant', content: 'Here is another example chat.', createdAt: new Date().toISOString()}], createdAt: new Date(Date.now() - 1000).toISOString() };
                    await saveChatHistory(currentUser.id, chat1);
                    await saveChatHistory(currentUser.id, chat2);
                    const newHistory = await fetchHistory(currentUser.id);
                    loadChat(chat1.id, newHistory);
                }
            } else {
                sessionStorage.removeItem('userId');
                setUser(null);
                setIsAdmin(false);
                setCharacterState('defaultt');
                await startNewChat(null, lang);
            }
        } else {
            setUser(null);
            setIsAdmin(false);
            setCharacterState('defaultt');
            await startNewChat(null, lang);
        }
        setLoading(false);
    }, [fetchHistory, loadChat, startNewChat, activeChatId]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setThemeState(savedTheme);
    document.documentElement.className = savedTheme;
    
    const savedLanguage = (localStorage.getItem('language') as Language) || 'en';
    setLanguageState(savedLanguage);
    
    refreshUserSession(savedLanguage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
      if(user) {
          fetchNotifications();
      }
  }, [user, fetchNotifications]);


  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };
  
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };
  
  const setCharacter = (newCharacter: string) => {
    setCharacterState(newCharacter);
    if(user) {
        updateUserData({ ...user, character: newCharacter });
    }
  };

  const addMessage = (message: AppMessage) => {
    setMessagesState(prev => {
        const newMessages = [...prev, message];
        if (activeChatId && user) {
            setHistory(prevHistory => {
                const newHistory = prevHistory.map(chat => 
                    chat.id === activeChatId 
                        ? { ...chat, messages: newMessages, createdAt: new Date().toISOString() } 
                        : chat
                );
                const chatToSave = newHistory.find(c => c.id === activeChatId);
                if (chatToSave) {
                    saveChatHistory(user.id, chatToSave);
                }
                return newHistory;
            });
        }
        return newMessages;
    });
  };
  
  const setMessages = (newMessages: AppMessage[]) => {
      setMessagesState(newMessages);
       if (activeChatId && user) {
            setHistory(prevHistory => {
                const newHistory = prevHistory.map(chat => 
                    chat.id === activeChatId 
                        ? { ...chat, messages: newMessages, createdAt: new Date().toISOString() } 
                        : chat
                );
                const chatToSave = newHistory.find(c => c.id === activeChatId);
                if (chatToSave) {
                    saveChatHistory(user.id, chatToSave);
                }
                return newHistory;
            });
        }
  }

  const startNewChatWrapper = useCallback(() => {
    startNewChat(user, language);
  },[startNewChat, user, language]);
  
  const loadChatWrapper = useCallback((id: string) => {
    const chatHistory = history;
    const chatToLoad = chatHistory.find(chat => chat.id === id);
    if (chatToLoad) {
        setActiveChatId(chatToLoad.id);
        setMessagesState(chatToLoad.messages);
    } else if (chatHistory.length > 0) {
        setActiveChatId(chatHistory[0].id);
        setMessagesState(chatHistory[0].messages);
    }
  }, [history]);

  const deleteChat = async (id: string) => {
    if (!user) return;
    
    await deleteChatHistoryFile(user.id, id);
    const updatedHistory = await fetchHistory(user.id);

    if (id === activeChatId) {
        if (updatedHistory.length > 0) {
            loadChatWrapper(updatedHistory[0].id);
        } else {
            await startNewChat(user, language);
        }
    }
  };


  const updateChatTitle = async (id: string, title: string) => {
      setHistory(prevHistory => {
          const newHistory = prevHistory.map(chat => chat.id === id ? { ...chat, title } : chat);
          if (user) {
            const chatToSave = newHistory.find(c => c.id === id);
            if (chatToSave) {
                saveChatHistory(user.id, chatToSave);
            }
          }
          return newHistory;
      });
  }

  const loginUser = async (credentials: Pick<any, 'email'|'password'>): Promise<boolean> => {
    const userToLogin = await getUserByEmail(credentials.email);
    if(userToLogin && userToLogin.password === credentials.password) {
        sessionStorage.setItem('userId', userToLogin.id);
        await updateUserData(userToLogin);
        await refreshUserSession(language);
        await sendPlanNotification(userToLogin, t);
        return true;
    }
    return false;
  }

  const signUpWithEmail = async (credentials: Pick<any, 'name' | 'email' | 'password' | 'phone' | 'gender'>): Promise<UserData | null> => {
    const fullEmail = `${credentials.email}@my.ana`;
    const existingUser = await getUserByEmail(fullEmail);
    if (existingUser) {
        throw new Error("An account with this email already exists.");
    }
    const newUser: UserData = {
        id: uuidv4(),
        email: fullEmail,
        displayName: credentials.name,
        photoURL: null,
        phone: credentials.phone,
        gender: credentials.gender,
        plan: 'Free',
        password: credentials.password,
        connectProfile: {
            handle: toConnectHandle(credentials.name),
            bio: `Hi, I am ${credentials.name} on My Ana AI.`,
            isPublic: true,
            followingUserIds: [],
        },
        metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
        }
    };
    await saveUser(newUser);
    sessionStorage.setItem('userId', newUser.id);
    await refreshUserSession(language);
    await sendPlanNotification(newUser, t);
    return newUser;
  };
  
  const logoutUser = async () => {
    sessionStorage.removeItem('userId');
    await refreshUserSession(language);
  }

  const updateUser = async (data: Partial<Pick<UserData, 'displayName' | 'photoURL'>>) => {
    if (!user) throw new Error("Not logged in");

    const updatedData = { ...user, ...data };
    
    await updateUserData(updatedData);

    setUser(updatedData);
  }

   const addTestimonial = async (testimonial: Omit<Testimonial, 'id'| 'avatar' | 'avatarHint' | 'createdAt'>) => {
        const testimonialData: Testimonial = {
            id: uuidv4(),
            ...testimonial,
            avatar: 'https://picsum.photos/100/100',
            avatarHint: 'person',
            createdAt: new Date().toISOString()
        };
        await saveTestimonial(testimonialData);
        await fetchTestimonials(); 
    };

    const deleteTestimonial = async (id: string) => {
        if (!isAdmin) return;
        await deleteTestimonialFile(id);
        await fetchTestimonials();
    };

    const saveFeedback = async (feedback: Omit<Feedback, 'id' | 'createdAt'>) => {
        await saveFeedbackFile(feedback);
    }

    const refreshUserSessionWrapper = useCallback(async () => {
        await refreshUserSession(language);
    }, [refreshUserSession, language]);

  return (
    <AppContext.Provider value={{ 
        theme, setTheme, 
        messages, addMessage, setMessages, startNewChat: startNewChatWrapper, loadChat: loadChatWrapper, history, activeChatId, updateChatTitle, deleteChat,
        language, setLanguage, t,
        character, setCharacter,
        isAdmin,
        isLoggedIn: !!user,
        loading,
        user,
        userEmail: user?.email || null,
        userName: user?.displayName || null,
        userPlan: user?.plan || null,
        loginUser,
        signUpWithEmail,
        logoutUser,
        updateUser,
        testimonials,
        addTestimonial,
        deleteTestimonial,
        refreshUserSession: refreshUserSessionWrapper,
        saveFeedback,
        notifications,
        fetchNotifications,
        lastCheckedNotifs,
        setLastCheckedNotifs,
    }}>
      {children}
    </AppContext.Provider>
  );
};
