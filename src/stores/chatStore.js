import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to add timeout to fetch requests
const fetchWithTimeout = (url, options = {}, timeout = 180000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout - the model is taking too long to respond. Please try again.')), timeout)
    )
  ]);
};

const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    conversations: [],
    activeConversationId: null,
    isSidebarOpen: true,
    selectedModel: 'LAWGPT-4',
    conversationLoadingStates: {},
    isLoadingConversations: true,
    editingMessageId: null,

    // Actions
    setConversations: (conversations) => set({ conversations }),
    setActiveConversationId: (id) => set({ activeConversationId: id }),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setSelectedModel: (model) => set({ selectedModel: model }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setIsTyping: (typing) => set({ isTyping: typing }),
    setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
    setEditingMessageId: (id) => set({ editingMessageId: id }),

    setConversationLoadingState: (conversationId, isLoading, isTyping) =>
      set((state) => ({
        conversationLoadingStates: {
          ...state.conversationLoadingStates,
          [conversationId]: { isLoading, isTyping }
        }
      })),

    clearConversationLoadingState: (conversationId) =>
      set((state) => {
        const { [conversationId]: removed, ...remainingStates } = state.conversationLoadingStates;
        return { conversationLoadingStates: remainingStates };
      }),

    getConversationLoadingState: (conversationId) => {
      const state = get();
      return state.conversationLoadingStates[conversationId] || { isLoading: false, isTyping: false };
    },

    // NEW: Updated to accept pre-uploaded file metadata
    handleFileUpload: async (file, message, fileMetadata) => {
      const state = get();
      
      if (!state.activeConversationId) {
        console.error('No active conversation');
        alert('Please create or select a conversation first');
        return;
      }

      // If file metadata is provided, file was already uploaded
      if (fileMetadata) {
        console.log('📎 Using pre-uploaded file metadata');
        
        const optimisticUserMessage = {
          id: `temp-${Date.now()}`,
          message: message ,
          isUser: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          fileMetadata: {
            fileName: fileMetadata.fileName,
            fileSize: fileMetadata.fileSize,
            fileType: fileMetadata.fileType
          }
        };

        // Add optimistic message to UI
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === state.activeConversationId
              ? { ...conv, messages: [...conv.messages, optimisticUserMessage] }
              : conv
          ),
        }));

        get().setConversationLoadingState(state.activeConversationId, true, true);
        
        try {
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error('No authentication token found');
          }

          // Send message with pre-extracted file data
          const res = await fetchWithTimeout('http://localhost:5001/api/chat/with-file', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: message || '',
              sessionId: state.activeConversationId,
              model: state.selectedModel,
              useContext: true,
              fileMetadata: fileMetadata // Include full metadata with extracted text
            })
          }, 180000);
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
            throw new Error(errorData.error || `Request failed with status ${res.status}`);
          }
          
          const data = await res.json();
          console.log('✅ Message with file sent successfully:', data);
          
          const updatedSession = {
            id: data.session._id,
            title: data.session.title,
            createdAt: new Date(data.session.createdAt).getTime(),
            updatedAt: new Date(data.session.updatedAt).getTime(),
            messages: data.session.messages.map((msg) => ({
              id: msg._id || `${Date.now()}-${Math.random()}`,
              message: msg.message,
              isUser: msg.sender === 'user',
              timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              fileMetadata: msg.fileMetadata || null
            })),
          };
          
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === state.activeConversationId ? updatedSession : conv
            )
          }));

          console.log('✅ Conversation updated with file message');
          
        } catch (err) {
          console.error('❌ Error sending message with file:', err);
          
          const errorMessage = {
            id: `error-${Date.now()}`,
            message: `⚠️ Failed to send message: ${err.message}`,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            fileMetadata: null
          };
          
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === state.activeConversationId
                ? { 
                    ...conv, 
                    messages: [
                      ...conv.messages.filter(m => m.id !== optimisticUserMessage.id),
                      errorMessage
                    ] 
                  }
                : conv
            ),
          }));
          
        } finally {
          get().setConversationLoadingState(state.activeConversationId, false, false);
        }
      }
    },

    fetchUserSessions: async () => {
      set({ isLoadingConversations: true });
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        set({ isLoadingConversations: false });
        return;
      }

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/conversation`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }, 30000);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch sessions: ${res.status} - ${errorText}`);
        }

        const sessions = await res.json();
        const transformedSessions = sessions
          .map((session) => ({
            id: session._id,
            title: session.title || 'New Chat',
            createdAt: new Date(session.createdAt).getTime(),
            updatedAt: new Date(session.updatedAt).getTime(),
            messages: (session.messages || []).map((msg) => ({
              id: msg._id || `${Date.now()}-${Math.random()}`,
              message: msg.message,
              isUser: msg.sender === 'user',
              timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              fileMetadata: msg.fileMetadata || null
            })),
          }))
          .sort((a, b) => b.updatedAt - a.updatedAt);

        set({ conversations: transformedSessions });

        const state = get();
        if (transformedSessions.length > 0 && !state.activeConversationId) {
          set({ activeConversationId: transformedSessions[0].id });
        } else if (transformedSessions.length === 0) {
            // get().handleNewConversation();
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
         get().handleNewConversation();
      } finally {
        set({ isLoadingConversations: false });
      }
    },

    handleSendMessage: async (messageText, model) => {
      if (!messageText.trim()) return;

      const state = get();
      const conversationId = state.activeConversationId;
      const userMessage = {
        id: `temp-${Date.now()}`,
        message: messageText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, userMessage] }
            : conv
        ),
      }));

      get().setConversationLoadingState(conversationId, true, true);

      try {
        const token = localStorage.getItem('token');
        const res = await fetchWithTimeout('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: conversationId,
            model: model || state.selectedModel,
          }),
        }, 180000);
       
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
        }

        const data = await res.json();

        const newMessages = data.session.messages.map((msg) => ({
          id: msg._id || `${Date.now()}-${Math.random()}`,
          message: msg.message,
          isUser: msg.sender === 'user',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          fileMetadata: msg.fileMetadata || null,
        }));

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: newMessages,
                  title: data.session.title,
                  updatedAt: new Date(data.session.updatedAt).getTime(),
                }
              : conv
          )
        }));

        if (data.session._id !== conversationId) {
          set({ activeConversationId: data.session._id });
        }
      } catch (err) {
        console.error('Error sending message:', err);

        const errorMessage = {
          id: `error-${Date.now()}`,
          message: "⚠️ Sorry, I'm having trouble processing your request. Please try again.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, errorMessage] }
              : conv
          ),
        }));
      } finally {
        get().setConversationLoadingState(conversationId, false, false);
      }
    },

    handleNewConversation: async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        return;
      }

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/conversation/new`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'New Legal Session' }),
        }, 30000);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to create new session: ${res.status} - ${errorText}`);
        }

        const data = await res.json();

        const newConversation = {
          id: data._id,
          title: data.title,
          createdAt: new Date(data.createdAt).getTime(),
          updatedAt: new Date(data.updatedAt).getTime(),
          messages: data.messages.map((msg) => ({
            id: msg._id || `${Date.now()}-${Math.random()}`,
            message: msg.message,
            isUser: msg.sender === 'user',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })),
        };

        set({ 
          conversations: [newConversation, ...get().conversations], 
          activeConversationId: newConversation.id 
        });
      } catch (err) {
        console.error('Error creating new conversation:', err);

        const fallbackConversation = {
          id: `temp-${Date.now()}`,
          title: 'New Legal Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: 1,
              message: "Hello! I'm LAWGPT, your AI legal assistant. How can I help you with legal questions today?",
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ],
        };

        set({ 
          conversations: [fallbackConversation, ...get().conversations], 
          activeConversationId: fallbackConversation.id 
        });
      }
    },

    handleSelectConversation: (id) => {
      set({ activeConversationId: id });
      if (window.innerWidth < 1024) {
        set({ isSidebarOpen: false });
      }
    },

    handleDeleteConversation: async (id) => {
      const token = localStorage.getItem('token');
      const state = get();

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/conversation/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }, 30000);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to delete conversation: ${res.status} - ${errorText}`);
        }

        const remaining = state.conversations.filter((c) => c.id !== id);
        set({ conversations: remaining });

        if (id === state.activeConversationId) {
          if (remaining.length > 0) {
            set({ activeConversationId: remaining[0].id });
          }
           else {
            // get().handleNewConversation();
          }
        }
      } catch (err) {
        console.error('Error deleting conversation:', err);
        alert('An error occurred while deleting the conversation. Please try again.');
      }
    },

    handleUpdateConversation: async (conversationId, updates) => {
      const token = localStorage.getItem('token');
      const state = get();

      if (!token) {
        console.error('No auth token found');
        return;
      }

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/conversation/${conversationId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }, 30000);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to update conversation: ${res.status} - ${errorText}`);
        }

        const data = await res.json();

        set({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title: data.title, updatedAt: new Date(data.updatedAt).getTime() }
              : conv
          )
        });
      } catch (err) {
        console.error('Error updating conversation:', err);
        alert('An error occurred while updating the conversation. Please try again.');
      }
    },

    handleEditMessage: (messageId) => set({ editingMessageId: messageId }),

    // NEW: Updated to handle file metadata in edits
    // handleEditSubmit: async (messageId, editedText) => {
    //   const state = get();
    //   const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

    //   if (!activeConversation) return;

    //   const editedIndex = activeConversation.messages.findIndex((msg) => msg.id === messageId);
    //   if (editedIndex === -1) return;

    //   const messageToEdit = activeConversation.messages[editedIndex];
      
    //   // Preserve file metadata if it exists
    //   const preservedFileMetadata = messageToEdit.fileMetadata;

    //   // ✅ CLEAR EDIT MODE IMMEDIATELY when Send is clicked
    //   set({ editingMessageId: null });

    //   const updatedMessages = activeConversation.messages.slice(0, editedIndex + 1);
    //   updatedMessages[editedIndex] = {
    //     ...updatedMessages[editedIndex],
    //     message: editedText,
    //     timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    //   };
      
    //   set({
    //     conversations: state.conversations.map((conv) =>
    //       conv.id === state.activeConversationId 
    //         ? { ...conv, messages: updatedMessages }
    //         : conv
    //     ),
    //   });

    //   get().setConversationLoadingState(state.activeConversationId, true, true);

    //   try {
    //     const token = localStorage.getItem('token');
    //     if (!token) {
    //       console.error('No auth token found');
    //       get().setConversationLoadingState(state.activeConversationId, false, false);
    //       return;
    //     }

    //     // Update the message in backend
    //     const updateRes = await fetchWithTimeout(`${API_BASE_URL}/conversation/messages/${messageId}`, {
    //       method: 'PUT',
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         message: editedText,
    //         timestamp: new Date().toISOString(),
    //       }),
    //     }, 30000);

    //     if (!updateRes.ok) {
    //       const errorText = await updateRes.text();
    //       throw new Error(`Failed to update message: ${updateRes.status} - ${errorText}`);
    //     }

    //     console.log('✏️ Message updated in backend');

    //     // Generate new response - check if original message had file metadata
    //     let chatEndpoint = 'http://localhost:5001/api/chat';
    //     let chatBody = {
    //       message: editedText,
    //       sessionId: state.activeConversationId,
    //       model: state.selectedModel,
    //       isEdit: true,
    //     };

    //     // If the edited message had file metadata, use the file endpoint
    //     if (preservedFileMetadata && preservedFileMetadata.extractedText) {
    //       console.log('📎 Edited message has file metadata, using file endpoint');
    //       chatEndpoint = 'http://localhost:5001/api/chat/with-file';
    //       chatBody.fileMetadata = preservedFileMetadata;
    //     }

    //     const chatRes = await fetchWithTimeout(chatEndpoint, {
    //       method: 'POST',
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(chatBody),
    //     }, 180000);

    //     if (!chatRes.ok) {
    //       const errorText = await chatRes.text();
    //       throw new Error(`Failed to get response: ${chatRes.status} - ${errorText}`);
    //     }

    //     const data = await chatRes.json();
    //     console.log('✅ Bot response received for edited message');

    //     const updatedSession = {
    //       id: data.session._id,
    //       title: data.session.title,
    //       createdAt: new Date(data.session.createdAt).getTime(),
    //       updatedAt: new Date(data.session.updatedAt).getTime(),
    //       messages: data.session.messages.map((msg) => ({
    //         id: msg._id || `${Date.now()}-${Math.random()}`,
    //         message: msg.message,
    //         isUser: msg.sender === 'user',
    //         timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
    //           hour: '2-digit',
    //           minute: '2-digit',
    //         }),
    //         fileMetadata: msg.fileMetadata || null
    //       })),
    //     };

    //     set({
    //       conversations: state.conversations.map((conv) =>
    //         conv.id === state.activeConversationId ? updatedSession : conv
    //       ),
    //     });

    //   } catch (err) {
    //     console.error('Error in edit flow:', err);
    //     alert('Failed to edit message. Please try again.');
    //   } finally {
    //     get().setConversationLoadingState(state.activeConversationId, false, false);
    //   }
    // },
    // Updated handleEditSubmit function in chatStore.js

handleEditSubmit: async (messageId, editedText) => {
  const state = get();
  const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

  if (!activeConversation) return;

  const editedIndex = activeConversation.messages.findIndex((msg) => msg.id === messageId);
  if (editedIndex === -1) return;

  const messageToEdit = activeConversation.messages[editedIndex];
  
  // ✅ DEBUG: Check what we have
  console.log('🔍 DEBUG - Original message:', {
    id: messageToEdit.id,
    message: messageToEdit.message,
    hasFileMetadata: !!messageToEdit.fileMetadata,
    fileMetadata: messageToEdit.fileMetadata
  });
  
  const preservedFileMetadata = messageToEdit.fileMetadata;
  
  // ✅ DEBUG: Check extracted text
  if (preservedFileMetadata) {
    console.log('📎 DEBUG - File metadata details:', {
      fileName: preservedFileMetadata.fileName,
      fileType: preservedFileMetadata.fileType,
      fileSize: preservedFileMetadata.fileSize,
      hasExtractedText: !!preservedFileMetadata.extractedText,
      extractedTextLength: preservedFileMetadata.extractedText?.length || 0,
      extractedTextPreview: preservedFileMetadata.extractedText?.substring(0, 100) || 'NONE'
    });
  } else {
    console.log('⚠️ DEBUG - No file metadata found');
  }

  set({ editingMessageId: null });

  const updatedMessages = activeConversation.messages.slice(0, editedIndex + 1);
  updatedMessages[editedIndex] = {
    ...updatedMessages[editedIndex],
    message: editedText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  
  set({
    conversations: state.conversations.map((conv) =>
      conv.id === state.activeConversationId 
        ? { ...conv, messages: updatedMessages }
        : conv
    ),
  });

  get().setConversationLoadingState(state.activeConversationId, true, true);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      get().setConversationLoadingState(state.activeConversationId, false, false);
      return;
    }

    const updateRes = await fetchWithTimeout(`${API_BASE_URL}/conversation/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: editedText,
        timestamp: new Date().toISOString(),
      }),
    }, 30000);

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`Failed to update message: ${updateRes.status} - ${errorText}`);
    }

    console.log('✏️ Message updated in backend');

    let chatEndpoint = 'http://localhost:5001/api/chat';
    let chatBody = {
      message: editedText,
      sessionId: state.activeConversationId,
      model: state.selectedModel,
      isEdit: true,
    };

    if (preservedFileMetadata?.extractedText) {
      console.log('📎 ✅ Edited message has file with extracted text!');
      console.log('📄 Using file endpoint with metadata:', {
        fileName: preservedFileMetadata.fileName,
        extractedTextLength: preservedFileMetadata.extractedText.length,
        extractedTextPreview: preservedFileMetadata.extractedText.substring(0, 200) + '...'
      });
      
      chatEndpoint = 'http://localhost:5001/api/chat/with-file';
      chatBody.fileMetadata = preservedFileMetadata;
    } else {
      console.log('📝 ⚠️ No extracted text found, using regular endpoint');
    }

    console.log('🔄 Sending request:', {
      endpoint: chatEndpoint,
      hasFileMetadata: !!chatBody.fileMetadata,
      messageLength: chatBody.message.length
    });

    const chatRes = await fetchWithTimeout(chatEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatBody),
    }, 180000);

    if (!chatRes.ok) {
      const errorText = await chatRes.text();
      throw new Error(`Failed to get response: ${chatRes.status} - ${errorText}`);
    }

    const data = await chatRes.json();
    console.log('✅ Bot response received for edited message');

    const updatedSession = {
      id: data.session._id,
      title: data.session.title,
      createdAt: new Date(data.session.createdAt).getTime(),
      updatedAt: new Date(data.session.updatedAt).getTime(),
      messages: data.session.messages.map((msg) => ({
        id: msg._id || `${Date.now()}-${Math.random()}`,
        message: msg.message,
        isUser: msg.sender === 'user',
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fileMetadata: msg.fileMetadata || null
      })),
    };

    set({
      conversations: state.conversations.map((conv) =>
        conv.id === state.activeConversationId ? updatedSession : conv
      ),
    });

  } catch (err) {
    console.error('❌ Error in edit flow:', err);
    alert('Failed to edit message. Please try again.');
  } finally {
    get().setConversationLoadingState(state.activeConversationId, false, false);
  }
},

    handleEditCancel: () => {
      // ✅ Clear edit mode immediately
      set({ editingMessageId: null });
    },

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  }))
);

export default useChatStore;