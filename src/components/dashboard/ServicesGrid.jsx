import { Link } from "react-router-dom";
import { Sparkles, Image, MessageSquare, Search } from "lucide-react";

const ServicesGrid = () => {
  const services = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "AI Text Writer",
      description: "Generate high-quality content effortlessly",
      link: "/ai-writer",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: "AI Image Generator",
      description: "Create stunning images from text",
      link: "/image-generator",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "AI Chatbot Builder",
      description: "Build intelligent chatbots",
      link: "/chatbot",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: "AI Search",
      description: "LLM-powered research",
      link: "#",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="lg:col-span-2">
      <h2 className="text-2xl font-bold mb-6">AI Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, index) => (
          <Link key={index} to={service.link} className="service-card group">
            <div
              className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
            >
              {service.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600">{service.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ServicesGrid;
