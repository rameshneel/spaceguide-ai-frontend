# 🤖 AI Chatbot Implementation Plan

## 📋 Backend Flow Analysis

### **API Endpoints**

1. **Query Chatbot** (Main)

   - `POST /api/chatbot/:id/query`
   - **Request Body:**
     ```json
     {
       "query": "string (3-1000 chars)",
       "sessionId": "optional string"
     }
     ```
   - **Response:**
     ```json
     {
       "success": true,
       "data": {
         "response": "AI response text",
         "sessionId": "generated-session-id",
         "tokens": 150,
         "responseTime": 1250,
         "sources": ["source-id-1", "source-id-2"]
       },
       "message": "Query processed successfully"
     }
     ```

2. **Get User's Chatbots**

   - `GET /api/chatbot/`
   - **Response:**
     ```json
     {
       "success": true,
       "data": {
         "chatbots": [
           {
             "_id": "chatbot-id",
             "name": "Customer Support Bot",
             "description": "...",
             "status": "active",
             "createdAt": "..."
           }
         ]
       }
     }
     ```

3. **Get Conversation History**

   - `GET /api/chatbot/:id/conversations?sessionId=xxx`
   - **Response:**
     ```json
     {
       "success": true,
       "data": {
         "conversations": [
           {
             "id": "conv-id",
             "sessionId": "session-id",
             "messages": [
               { "role": "user", "content": "...", "timestamp": "..." },
               { "role": "assistant", "content": "...", "timestamp": "..." }
             ],
             "messageCount": 10,
             "totalTokens": 1500,
             "createdAt": "..."
           }
         ]
       }
     }
     ```

4. **Get Usage Stats**
   - Uses same endpoint as other services: `GET /api/subscription/usage`
   - Service type: `ai_chatbot_builder`
   - Limit type: `messagesPerDay`

### **Flow Steps**

1. **User selects chatbot** → Load chatbot list
2. **User sends message** → `POST /api/chatbot/:id/query`
3. **Backend processes** → RAG (Retrieval Augmented Generation)
4. **Response returned** → Display in chat
5. **Session maintained** → Use `sessionId` for conversation context
6. **Usage tracked** → Socket.IO updates

---

## 🎨 UI/UX Design

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│  Header (Gradient Icon + Title + Usage Stats)          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │                  │  │                          │  │
│  │  Chatbot Selector│  │   Chat Messages Area     │  │
│  │  (Sidebar)       │  │                          │  │
│  │                  │  │  [User Message]          │  │
│  │  - Bot 1         │  │  [Bot Response]          │  │
│  │  - Bot 2         │  │  [User Message]          │  │
│  │  - Bot 3         │  │  [Bot Response]          │  │
│  │                  │  │                          │  │
│  │  [+ Create Bot]  │  │                          │  │
│  │                  │  │                          │  │
│  └──────────────────┘  │  ┌────────────────────┐  │  │
│                        │  │  Input Field       │  │  │
│                        │  │  [Type message...] │  │  │
│                        │  │  [Send Button]     │  │  │
│                        │  └────────────────────┘  │  │
│                        └──────────────────────────┘  │
│                                                         │
│  [History Panel Toggle]                                │
└─────────────────────────────────────────────────────────┘
```

### **Key Components**

1. **Header Section**

   - Gradient icon box (MessageSquare icon)
   - Title: "AI Chatbot"
   - Usage stats bar (messages used / limit)
   - Percentage with color coding

2. **Chatbot Selector (Left Sidebar)**

   - List of user's chatbots
   - Active chatbot highlighted
   - "Create New Chatbot" button
   - Status indicators (active/training)

3. **Chat Interface (Main Area)**

   - Message list (scrollable)
   - User messages (right-aligned, blue)
   - Bot messages (left-aligned, gray)
   - Loading indicator when bot is typing
   - Timestamps on messages
   - Sources indicator (if available)

4. **Input Area**

   - Text input (textarea for multi-line)
   - Send button (disabled when loading)
   - Character counter (optional)
   - Auto-focus on send

5. **History Panel (Right Drawer)**
   - Toggle button
   - Conversation sessions list
   - Load conversation on click
   - Clear conversation button

---

## 🏗️ Implementation Structure

### **File Organization**

```
src/
├── pages/
│   └── Chatbot.jsx              # Main chatbot page
├── services/
│   └── aiServices.js            # Add chatbot API functions
├── components/
│   └── chatbot/
│       ├── ChatbotSelector.jsx  # Sidebar with chatbot list
│       ├── ChatMessage.jsx      # Individual message component
│       ├── ChatInput.jsx        # Input area component
│       └── ChatHistoryPanel.jsx # History drawer component
├── constants/
│   └── api.js                   # Add chatbot endpoints
└── hooks/
    └── useChatbot.js            # Custom hook for chatbot logic
```

### **State Management**

```javascript
// Main state in Chatbot.jsx
const [selectedChatbot, setSelectedChatbot] = useState(null);
const [chatbots, setChatbots] = useState([]);
const [messages, setMessages] = useState([]);
const [sessionId, setSessionId] = useState(null);
const [loading, setLoading] = useState(false);
const [usageData, setUsageData] = useState(null);
```

---

## 💻 Code Implementation Steps

### **Step 1: API Service Functions**

Add to `services/aiServices.js`:

- `getChatbots()` - Get user's chatbots
- `queryChatbot(chatbotId, query, sessionId)` - Send message
- `getConversationHistory(chatbotId, sessionId)` - Get history
- `getChatbotUsage()` - Get usage stats

### **Step 2: Constants**

Add to `constants/api.js`:

- Chatbot endpoints

### **Step 3: Components**

1. **Chatbot.jsx** - Main page
2. **ChatbotSelector.jsx** - Sidebar
3. **ChatMessage.jsx** - Message component
4. **ChatInput.jsx** - Input component
5. **ChatHistoryPanel.jsx** - History drawer

### **Step 4: Features**

- ✅ Chat interface with message list
- ✅ Real-time message sending/receiving
- ✅ Session management
- ✅ Usage stats display
- ✅ Error handling
- ✅ Loading states
- ✅ Socket.IO integration
- ✅ Conversation history
- ✅ Auto-scroll to latest message

---

## 🎯 Best Practices

1. **Performance**

   - useMemo for expensive calculations
   - useCallback for event handlers
   - Virtual scrolling for long message lists (future)

2. **Error Handling**

   - Try-catch blocks
   - User-friendly error messages
   - Retry logic for failed requests

3. **UX**

   - Loading indicators
   - Auto-scroll to latest message
   - Empty states
   - Keyboard shortcuts (Enter to send)

4. **Accessibility**

   - ARIA labels
   - Keyboard navigation
   - Screen reader support

5. **Code Quality**
   - Consistent naming
   - Comments for complex logic
   - PropTypes validation
   - Error boundaries

---

## 📊 Usage Tracking

- Service type: `ai_chatbot_builder`
- Limit type: `messagesPerDay`
- Track via Socket.IO events: `usage_updated`
- Display in header with progress bar

---

## 🚀 Implementation Order

1. ✅ API service functions
2. ✅ Constants update
3. ✅ Basic Chatbot page structure
4. ✅ Chatbot selector component
5. ✅ Chat message component
6. ✅ Chat input component
7. ✅ Message sending/receiving
8. ✅ Session management
9. ✅ Usage stats display
10. ✅ Error handling
11. ✅ History panel
12. ✅ Socket.IO integration
13. ✅ Polish & testing

---

**Status:** Ready for implementation ✅
