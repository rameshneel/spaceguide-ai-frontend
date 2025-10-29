import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Sparkles, Zap, Shield, Users, ArrowRight } from "lucide-react";

const Home = () => {
  const services = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "A.I. Chatbot Builder",
      description: "Create intelligent chatbots for your website",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "A.I. Open Source Code Editor",
      description: "Code faster with AI assistance",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "A.I. Image Generator",
      description: "Generate stunning images from text",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "A.I. C.R.M. Software",
      description: "Manage customer relationships intelligently",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "A.I. Email Writer",
      description: "Write professional emails effortlessly",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "A.I. Payroll for Business",
      description: "Automate payroll with AI",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              <span className="gradient-text">A.I. Powered Content</span>
              <br />
              And Image Generator
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              SpaceGuideAI is your intelligent co-writer—designed to help
              students, professionals, marketers, and creators transform
              thoughts into words effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn-primary inline-flex items-center justify-center"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="btn-secondary inline-flex items-center justify-center"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Premium A.I. Products and Services
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Explore Space Guide A.I. for free to see its effectiveness, and
            impressive value, in delivering all of your required A.I. tasks in
            one premium A.I. portal.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="service-card p-6 group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Generate Quality Content Effortlessly
              </h3>
              <p className="text-gray-600">
                Space Guide A.I. is the ultimate aggregator of premium A.I.
                services for all kinds of customers, from beginners to experts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Let AI do all the magic for you
              </h3>
              <p className="text-gray-600">
                Unlock the power of AI with cutting-edge technology that helps
                you generate well-crafted and joyfully original content
                effortlessly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Save Time and Money</h3>
              <p className="text-gray-600">
                Save time and money with our automated system that empowers you
                to cut down your expenses while still getting great results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start your free trial today!
          </h2>
          <p className="text-xl mb-8 opacity-90">No credit card is required.</p>
          <Link
            to="/register"
            className="btn-secondary inline-flex items-center"
          >
            Get Started For Free <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
