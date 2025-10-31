import { Search } from "lucide-react";

const AISearch = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
        <Search className="w-10 h-10 text-primary-600" />
        AI Search
      </h1>

      <div className="card max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">AI Search Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're working on an advanced AI-powered search feature that will
            help you find information quickly and accurately.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✨ Intelligent semantic search</p>
            <p>🔍 Natural language queries</p>
            <p>⚡ Fast and accurate results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISearch;
