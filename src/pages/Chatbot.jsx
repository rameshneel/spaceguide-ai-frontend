import { useState } from "react";
import { MessageSquare } from "lucide-react";

const Chatbot = () => {
  const [messages] = useState([
    { role: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">AI Chatbot Builder</h1>

      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center mb-4">
          <MessageSquare className="w-6 h-6 mr-2 text-primary-600" />
          <h2 className="text-2xl font-semibold">Chat Interface</h2>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field flex-1"
            placeholder="Type your message..."
          />
          <button className="btn-primary">Send</button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
