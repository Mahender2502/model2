// import { create } from 'zustand';
// import { subscribeWithSelector } from 'zustand/middleware';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// const useChatStore = create(
//   subscribeWithSelector((set, get) => ({
//     // State
//     conversations: [],
//     activeConversationId: null,
//     isSidebarOpen: true,
//     selectedModel: 'LAWGPT-4',
//     isLoading: false,
//     isTyping: false,
//     isLoadingConversations: true,
//     editingMessageId: null,

//     // Actions
//     setConversations: (conversations) => set({ conversations }),
//     setActiveConversationId: (id) => set({ activeConversationId: id }),
//     setSidebarOpen: (open) => set({ isSidebarOpen: open }),
//     setSelectedModel: (model) => set({ selectedModel: model }),
//     setIsLoading: (loading) => set({ isLoading: loading }),
//     setIsTyping: (typing) => set({ isTyping: typing }),
//     setIsLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
//     setEditingMessageId: (id) => set({ editingMessageId: id }),

//     // API Actions
//     handleFileUpload: async (file, message) => {
//         const state = get();
        
//         if (!file) return;
        
//         set({ isLoading: true, isTyping: true });
        
//         try {
//           const token = localStorage.getItem('token');
//           const formData = new FormData();
//           formData.append('file', file);
//           formData.append('message', message || '');
//           formData.append('sessionId', state.activeConversationId);
//           formData.append('model', state.selectedModel);
          
//           const res = await fetch('http://localhost:5001/api/chat/upload', {
//             method: 'POST',
//             headers: {
//               Authorization: `Bearer ${token}`
//             },
//             body: formData
//           });
          
//           if (!res.ok) throw new Error('Upload failed');
          
//           const data = await res.json();
          
//           // Update conversation with response
//           const updatedSession = {
//             id: data.session._id,
//             title: data.session.title,
//             createdAt: new Date(data.session.createdAt).getTime(),
//             updatedAt: new Date(data.session.updatedAt).getTime(),
//             messages: data.session.messages.map((msg) => ({
//               id: msg._id || `${Date.now()}-${Math.random()}`,
//               message: msg.message,
//               isUser: msg.sender === 'user',
//               timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit',
//               }),
//             })),
//           };
          
//           set({
//             conversations: state.conversations.map((conv) =>
//               conv.id === state.activeConversationId ? updatedSession : conv
//             ),
//           });
          
//         } catch (err) {
//           console.error('File upload error:', err);
//           alert('Failed to upload file');
//         } finally {
//           set({ isLoading: false, isTyping: false });
//         }
//       },
//     fetchUserSessions: async () => {
//       set({ isLoadingConversations: true });
//       const token = localStorage.getItem('token');

//       if (!token) {
//         console.error('No auth token found');
//         set({ isLoadingConversations: false });
//         return;
//       }

//       try {
//         const res = await fetch(`${API_BASE_URL}/conversation`, {
//           method: 'GET',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`Failed to fetch sessions: ${res.status} - ${errorText}`);
//         }

//         const sessions = await res.json();
//         const transformedSessions = sessions
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//           .map((session) => ({
//             id: session._id,
//             title: session.title || 'New Chat',
//             createdAt: new Date(session.createdAt).getTime(),
//             updatedAt: new Date(session.updatedAt).getTime(),
//             messages: (session.messages || []).map((msg) => ({
//               id: msg._id || `${Date.now()}-${Math.random()}`,
//               message: msg.message,
//               isUser: msg.sender === 'user',
//               timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit',
//               }),
//             })),
//           }));

//         set({ conversations: transformedSessions });

//         const state = get();
//         if (transformedSessions.length > 0 && !state.activeConversationId) {
//           set({ activeConversationId: transformedSessions[0].id });
//         } else if (transformedSessions.length === 0) {
//           get().handleNewConversation();
//         }
//       } catch (err) {
//         console.error('Error fetching sessions:', err);
//         get().handleNewConversation();
//       } finally {
//         set({ isLoadingConversations: false });
//       }
//     },

//     handleSendMessage: async (messageText, model) => {
//       if (!messageText.trim()) return;

//       const state = get();
//       const userMessage = {
//         id: `temp-${Date.now()}`,
//         message: messageText,
//         isUser: true,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//       };

//       const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

//       // Optimistic UI update - add user message immediately
//       if (activeConversation) {
//         const updatedMessages = [...activeConversation.messages, userMessage];
//         const updatedConversation = { ...activeConversation, messages: updatedMessages };
//         set({
//           conversations: state.conversations.map((conv) =>
//             conv.id === state.activeConversationId ? updatedConversation : conv
//           ),
//         });
//       }

//       set({ isLoading: true, isTyping: true });

//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch('http://localhost:5001/api/chat', {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             message: messageText,
//             sessionId: state.activeConversationId,
//             model: model || state.selectedModel,
//           }),
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
//         }

//         const data = await res.json();

//         const updatedSession = {
//           id: data.session._id,
//           title: data.session.title,
//           createdAt: new Date(data.session.createdAt).getTime(),
//           updatedAt: new Date(data.session.updatedAt).getTime(),
//           messages: data.session.messages.map((msg) => ({
//             id: msg._id || `${Date.now()}-${Math.random()}`,
//             message: msg.message,
//             isUser: msg.sender === 'user',
//             timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//               hour: '2-digit',
//               minute: '2-digit',
//             }),
//           })),
//         };

//         set({
//           conversations: state.conversations.map((conv) =>
//             conv.id === state.activeConversationId ? updatedSession : conv
//           ).sort((a, b) => b.updatedAt - a.updatedAt),
//         });

//         if (data.session._id !== state.activeConversationId) {
//           set({ activeConversationId: data.session._id });
//         }
//       } catch (err) {
//         console.error('Error sending message:', err);

//         // Add error message
//         const errorMessage = {
//           id: `error-${Date.now()}`,
//           message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
//           isUser: false,
//           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         };

//         if (activeConversation) {
//           const updatedMessages = [...activeConversation.messages, userMessage, errorMessage];
//           set({
//             conversations: state.conversations.map((conv) =>
//               conv.id === state.activeConversationId ? { ...conv, messages: updatedMessages } : conv
//             ),
//           });
//         }
//       } finally {
//         set({ isLoading: false, isTyping: false });
//       }
//     },

//     handleNewConversation: async () => {
//       const token = localStorage.getItem('token');

//       if (!token) {
//         console.error('No auth token found');
//         return;
//       }

//       try {
//         const res = await fetch(`${API_BASE_URL}/conversation/new`, {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({ title: 'New Legal Session' }),
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`Failed to create new session: ${res.status} - ${errorText}`);
//         }

//         const data = await res.json();

//         const newConversation = {
//           id: data._id,
//           title: data.title,
//           createdAt: new Date(data.createdAt).getTime(),
//           updatedAt: new Date(data.updatedAt).getTime(),
//           messages: data.messages.map((msg) => ({
//             id: msg._id || `${Date.now()}-${Math.random()}`,
//             message: msg.message,
//             isUser: msg.sender === 'user',
//             timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//               hour: '2-digit',
//               minute: '2-digit',
//             }),
//           })),
//         };

//         set({ conversations: [newConversation, ...get().conversations], activeConversationId: newConversation.id });
//       } catch (err) {
//         console.error('Error creating new conversation:', err);

//         // Fallback
//         const fallbackConversation = {
//           id: `temp-${Date.now()}`,
//           title: 'New Legal Session',
//           createdAt: Date.now(),
//           updatedAt: Date.now(),
//           messages: [
//             {
//               id: 1,
//               message: "Hello! I'm LAWGPT, your AI legal assistant. How can I help you with legal questions today?",
//               isUser: false,
//               timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//             },
//           ],
//         };

//         set({ conversations: [fallbackConversation, ...get().conversations], activeConversationId: fallbackConversation.id });
//       }
//     },

//     handleSelectConversation: (id) => {
//       set({ activeConversationId: id });
//       if (window.innerWidth < 1024) {
//         set({ isSidebarOpen: false });
//       }
//     },

//     handleDeleteConversation: async (id) => {
//       const token = localStorage.getItem('token');
//       const state = get();

//       try {
//         const res = await fetch(`${API_BASE_URL}/conversation/${id}`, {
//           method: 'DELETE',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`Failed to delete conversation: ${res.status} - ${errorText}`);
//         }

//         const remaining = state.conversations.filter((c) => c.id !== id);
//         set({ conversations: remaining });

//         if (id === state.activeConversationId) {
//           if (remaining.length > 0) {
//             set({ activeConversationId: remaining[0].id });
//           } else {
//             get().handleNewConversation();
//           }
//         }
//       } catch (err) {
//         console.error('Error deleting conversation:', err);
//         alert('An error occurred while deleting the conversation. Please try again.');
//       }
//     },

//     handleUpdateConversation: async (conversationId, updates) => {
//       const token = localStorage.getItem('token');
//       const state = get();

//       if (!token) {
//         console.error('No auth token found');
//         return;
//       }

//       try {
//         const res = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
//           method: 'PUT',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(updates),
//         });

//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`Failed to update conversation: ${res.status} - ${errorText}`);
//         }

//         const data = await res.json();

//         set({
//           conversations: state.conversations.map((conv) =>
//             conv.id === conversationId
//               ? { ...conv, title: data.title, updatedAt: new Date(data.updatedAt).getTime() }
//               : conv
//           ).sort((a, b) => b.createdAt - a.createdAt),
//         });
//       } catch (err) {
//         console.error('Error updating conversation:', err);
//         alert('An error occurred while updating the conversation. Please try again.');
//       }
//     },

//     handleEditMessage: (messageId) => set({ editingMessageId: messageId }),

//     // handleEditSubmit: async (messageId, editedText) => {
//     //   const state = get();
//     //   const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

//     //   if (!activeConversation) return;

//     //   // Immediately update frontend state to remove messages below the edited one
//     //   const editedIndex = activeConversation.messages.findIndex((msg) => msg.id === messageId);
//     //   if (editedIndex !== -1) {
//     //     const updatedMessages = [...activeConversation.messages.slice(0, editedIndex + 1)];
//     //     // Update the edited message text and timestamp
//     //     updatedMessages[editedIndex] = {
//     //       ...updatedMessages[editedIndex],
//     //       message: editedText,
//     //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     //     };
//     //     const updatedConversation = { ...activeConversation, messages: updatedMessages };
//     //     set({
//     //       conversations: state.conversations.map((conv) =>
//     //         conv.id === state.activeConversationId ? updatedConversation : conv
//     //       ),
//     //     });
//     //   }

//     //   set({ isLoading: true, isTyping: true, editingMessageId: null });

//     //   try {
//     //     const token = localStorage.getItem('token');
//     //     if (!token) {
//     //       console.error('No auth token found');
//     //       return;
//     //     }

//     //     // Update message in backend (this also removes subsequent messages on backend)
//     //     const updateRes = await fetch(`${API_BASE_URL}/conversation/messages/${messageId}`, {
//     //       method: 'PUT',
//     //       headers: {
//     //         Authorization: `Bearer ${token}`,
//     //         'Content-Type': 'application/json',
//     //       },
//     //       body: JSON.stringify({
//     //         message: editedText,
//     //         timestamp: new Date().toISOString(),
//     //       }),
//     //     });

//     //     if (!updateRes.ok) {
//     //       const errorText = await updateRes.text();
//     //       throw new Error(`Failed to update message: ${updateRes.status}`);
//     //     }

//     //     // Send new response from backend
//     //     const chatRes = await fetch('http://localhost:5001/api/chat', {
//     //       method: 'POST',
//     //       headers: {
//     //         Authorization: `Bearer ${token}`,
//     //         'Content-Type': 'application/json',
//     //       },
//     //       body: JSON.stringify({
//     //         message: editedText,
//     //         sessionId: state.activeConversationId,
//     //         model: state.selectedModel,
//     //       }),
//     //     });

//     //     if (!chatRes.ok) {
//     //       const errorText = await chatRes.text();
//     //       throw new Error(`Failed to get response: ${chatRes.status}`);
//     //     }

//     //     const data = await chatRes.json();

//     //     // Update state with the full backend response
//     //     const updatedSession = {
//     //       id: data.session._id,
//     //       title: data.session.title,
//     //       createdAt: new Date(data.session.createdAt).getTime(),
//     //       updatedAt: new Date(data.session.updatedAt).getTime(),
//     //       messages: data.session.messages.map((msg) => ({
//     //         id: msg._id || `${Date.now()}-${Math.random()}`,
//     //         message: msg.message,
//     //         isUser: msg.sender === 'user',
//     //         timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//     //           hour: '2-digit',
//     //           minute: '2-digit',
//     //         }),
//     //       })),
//     //     };

//     //     set({
//     //       conversations: state.conversations.map((conv) =>
//     //         conv.id === state.activeConversationId ? updatedSession : conv
//     //       ).sort((a, b) => b.updatedAt - a.updatedAt),
//     //     });

//     //   } catch (err) {
//     //     console.error('Error in edit flow:', err);
//     //     alert('Failed to edit message. Please try again.');
//     //   } finally {
//     //     set({ isLoading: false, isTyping: false });
//     //   }
//     // },
// handleEditSubmit: async (messageId, editedText) => {
//   const state = get();
//   const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

//   if (!activeConversation) return;

//   // Immediately update UI to show edited message and remove messages below it
//   const editedIndex = activeConversation.messages.findIndex((msg) => msg.id === messageId);
//   if (editedIndex !== -1) {
//     const updatedMessages = activeConversation.messages.slice(0, editedIndex + 1);
//     updatedMessages[editedIndex] = {
//       ...updatedMessages[editedIndex],
//       message: editedText,
//       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//     };
    
//     set({
//       conversations: state.conversations.map((conv) =>
//         conv.id === state.activeConversationId 
//           ? { ...conv, messages: updatedMessages }
//           : conv
//       ),
//     });
//   }

//   set({ isLoading: true, isTyping: true, editingMessageId: null });

//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       console.error('No auth token found');
//       set({ isLoading: false, isTyping: false });
//       return;
//     }

//     // Step 1: Update message in backend (removes subsequent messages)
//     const updateRes = await fetch(`${API_BASE_URL}/conversation/messages/${messageId}`, {
//       method: 'PUT',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message: editedText,
//         timestamp: new Date().toISOString(),
//       }),
//     });

//     if (!updateRes.ok) {
//       const errorText = await updateRes.text();
//       throw new Error(`Failed to update message: ${updateRes.status} - ${errorText}`);
//     }

//     console.log('Message updated in backend');

//     // Step 2: Get new bot response with isEdit flag
//     const chatRes = await fetch('http://localhost:5001/api/chat', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         message: editedText,
//         sessionId: state.activeConversationId,
//         model: state.selectedModel,
//         isEdit: true,  // THIS IS THE KEY - tells backend not to re-add user message
//       }),
//     });

//     if (!chatRes.ok) {
//       const errorText = await chatRes.text();
//       throw new Error(`Failed to get response: ${chatRes.status} - ${errorText}`);
//     }

//     const data = await chatRes.json();
//     console.log('Bot response received');

//     // Step 3: Update state with the complete backend response
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
//       })),
//     };

//     set({
//       conversations: state.conversations
//         .map((conv) =>
//           conv.id === state.activeConversationId ? updatedSession : conv
//         )
//         .sort((a, b) => b.updatedAt - a.updatedAt),
//     });

//   } catch (err) {
//     console.error('Error in edit flow:', err);
//     alert('Failed to edit message. Please try again.');
//   } finally {
//     set({ isLoading: false, isTyping: false });
//   }
// },
//     handleEditCancel: () => set({ editingMessageId: null }),

//     toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
//   }))
// );

// export default useChatStore;


import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useChatStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    conversations: [],
    activeConversationId: null,
    isSidebarOpen: true,
    selectedModel: 'LAWGPT-4',
    isLoading: false,
    isTyping: false,
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

    // Fixed File Upload Handler
    handleFileUpload: async (file, message) => {
      const state = get();
      
      if (!file) {
        console.error('No file provided');
        return;
      }

      if (!state.activeConversationId) {
        console.error('No active conversation');
        alert('Please create or select a conversation first');
        return;
      }
      
      set({ isLoading: true, isTyping: true });
      
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', message || `Analyze this document: ${file.name}`);
        formData.append('sessionId', state.activeConversationId);
        formData.append('model', state.selectedModel);
        formData.append('useContext', 'true');
        
        console.log('📤 Uploading file:', {
          fileName: file.name,
          fileSize: file.size,
          sessionId: state.activeConversationId,
          model: state.selectedModel
        });

        const res = await fetch('http://localhost:5001/api/chat/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `Upload failed with status ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ File upload response:', data);
        
        // Update conversation with the complete response from backend
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
        
        // Update the specific conversation in state
        set({
          conversations: state.conversations.map((conv) =>
            conv.id === state.activeConversationId ? updatedSession : conv
          ).sort((a, b) => b.updatedAt - a.updatedAt),
        });

        console.log('✅ Conversation updated with file upload');
        
      } catch (err) {
        console.error('❌ File upload error:', err);
        alert(`Failed to upload file: ${err.message}`);
      } finally {
        set({ isLoading: false, isTyping: false });
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
        const res = await fetch(`${API_BASE_URL}/conversation`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch sessions: ${res.status} - ${errorText}`);
        }

        const sessions = await res.json();
        const transformedSessions = sessions
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
          }));

        set({ conversations: transformedSessions });

        const state = get();
        if (transformedSessions.length > 0 && !state.activeConversationId) {
          set({ activeConversationId: transformedSessions[0].id });
        } else if (transformedSessions.length === 0) {
          get().handleNewConversation();
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
      const userMessage = {
        id: `temp-${Date.now()}`,
        message: messageText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

      if (activeConversation) {
        const updatedMessages = [...activeConversation.messages, userMessage];
        const updatedConversation = { ...activeConversation, messages: updatedMessages };
        set({
          conversations: state.conversations.map((conv) =>
            conv.id === state.activeConversationId ? updatedConversation : conv
          ),
        });
      }

      set({ isLoading: true, isTyping: true });

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: state.activeConversationId,
            model: model || state.selectedModel,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to send message: ${res.status} - ${errorText}`);
        }

        const data = await res.json();

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
          ).sort((a, b) => b.updatedAt - a.updatedAt),
        });

        if (data.session._id !== state.activeConversationId) {
          set({ activeConversationId: data.session._id });
        }
      } catch (err) {
        console.error('Error sending message:', err);

        const errorMessage = {
          id: `error-${Date.now()}`,
          message: "I apologize, but I'm having trouble processing your request right now. Please try again.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        if (activeConversation) {
          const updatedMessages = [...activeConversation.messages, userMessage, errorMessage];
          set({
            conversations: state.conversations.map((conv) =>
              conv.id === state.activeConversationId ? { ...conv, messages: updatedMessages } : conv
            ),
          });
        }
      } finally {
        set({ isLoading: false, isTyping: false });
      }
    },

    handleNewConversation: async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No auth token found');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/conversation/new`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'New Legal Session' }),
        });

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

        set({ conversations: [newConversation, ...get().conversations], activeConversationId: newConversation.id });
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

        set({ conversations: [fallbackConversation, ...get().conversations], activeConversationId: fallbackConversation.id });
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
        const res = await fetch(`${API_BASE_URL}/conversation/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to delete conversation: ${res.status} - ${errorText}`);
        }

        const remaining = state.conversations.filter((c) => c.id !== id);
        set({ conversations: remaining });

        if (id === state.activeConversationId) {
          if (remaining.length > 0) {
            set({ activeConversationId: remaining[0].id });
          } else {
            get().handleNewConversation();
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
        const res = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

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
          ).sort((a, b) => b.createdAt - a.createdAt),
        });
      } catch (err) {
        console.error('Error updating conversation:', err);
        alert('An error occurred while updating the conversation. Please try again.');
      }
    },

    handleEditMessage: (messageId) => set({ editingMessageId: messageId }),

    handleEditSubmit: async (messageId, editedText) => {
      const state = get();
      const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId);

      if (!activeConversation) return;

      const editedIndex = activeConversation.messages.findIndex((msg) => msg.id === messageId);
      if (editedIndex !== -1) {
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
      }

      set({ isLoading: true, isTyping: true, editingMessageId: null });

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token found');
          set({ isLoading: false, isTyping: false });
          return;
        }

        const updateRes = await fetch(`${API_BASE_URL}/conversation/messages/${messageId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: editedText,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!updateRes.ok) {
          const errorText = await updateRes.text();
          throw new Error(`Failed to update message: ${updateRes.status} - ${errorText}`);
        }

        console.log('Message updated in backend');

        const chatRes = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: editedText,
            sessionId: state.activeConversationId,
            model: state.selectedModel,
            isEdit: true,
          }),
        });

        if (!chatRes.ok) {
          const errorText = await chatRes.text();
          throw new Error(`Failed to get response: ${chatRes.status} - ${errorText}`);
        }

        const data = await chatRes.json();
        console.log('Bot response received');

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
          conversations: state.conversations
            .map((conv) =>
              conv.id === state.activeConversationId ? updatedSession : conv
            )
            .sort((a, b) => b.updatedAt - a.updatedAt),
        });

      } catch (err) {
        console.error('Error in edit flow:', err);
        alert('Failed to edit message. Please try again.');
      } finally {
        set({ isLoading: false, isTyping: false });
      }
    },

    handleEditCancel: () => set({ editingMessageId: null }),

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  }))
);

export default useChatStore;