import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Book, Keyboard, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Help = () => {
  const navigate = useNavigate();

  const helpSections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of SanGPT",
      content: [
        "Start a new conversation by typing your question",
        "Use 'Imagine' keyword to generate images",
        "Attach files using the paperclip icon",
        "Long-press messages for more options"
      ]
    },
    {
      icon: Keyboard,
      title: "Keyboard Shortcuts",
      description: "Speed up your workflow",
      content: [
        "Enter - Send message",
        "Shift + Enter - New line",
        "Ctrl/Cmd + K - New chat",
        "Ctrl/Cmd + / - Toggle sidebar"
      ]
    },
    {
      icon: MessageCircle,
      title: "AI Features",
      description: "What SanGPT can do",
      content: [
        "Answer questions and provide explanations",
        "Generate creative content and code",
        "Analyze documents and images",
        "Translate text and summarize content"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Help & Support</h1>
              <p className="text-sm text-muted-foreground">Everything you need to know about SanGPT</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {helpSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Need More Help?
            </CardTitle>
            <CardDescription>
              Our support team is here to assist you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you can't find the answer you're looking for, feel free to reach out to our support team. 
              We typically respond within 24 hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2">
                <Mail className="h-4 w-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Documentation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                question: "How do I save my conversations?",
                answer: "All conversations are automatically saved to your account. You can access them anytime from the sidebar."
              },
              {
                question: "Can I use SanGPT offline?",
                answer: "SanGPT requires an internet connection to communicate with AI models and process your requests."
              },
              {
                question: "What file types can I upload?",
                answer: "You can upload images, PDFs, text files, and documents. The AI can analyze and extract information from them."
              },
              {
                question: "How do I delete my chat history?",
                answer: "Long-press any conversation in the sidebar to access options including delete, rename, and pin."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Help;
