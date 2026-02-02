"use client";

import Link from "next/link";
import { 
  Sparkles, 
  Zap, 
  Clock, 
  Target, 
  Users, 
  Trophy,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Gamepad2,
  BarChart3,
  FileText,
  GraduationCap,
  Play,
  Star,
  Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Feature data
const features = [
  {
    icon: FileText,
    title: "Any Content Works",
    description: "Upload PDFs, PowerPoints, Word docs, or paste text. Our AI extracts key concepts automatically.",
    color: "blue"
  },
  {
    icon: Target,
    title: "Learning-First Design",
    description: "Questions test understanding, not just recall. Identify and address common misconceptions.",
    color: "yellow"
  },
  {
    icon: Zap,
    title: "Instant Games",
    description: "From upload to gameplay in under 60 seconds. No more spending hours writing quiz questions.",
    color: "purple"
  },
  {
    icon: Gamepad2,
    title: "AI-Designed Mechanics",
    description: "Each game gets unique mechanics matched to your content. No two games are the same.",
    color: "green"
  },
  {
    icon: Users,
    title: "Real-Time Multiplayer",
    description: "Students join with a simple code. Live leaderboards and instant feedback keep them engaged.",
    color: "pink"
  },
  {
    icon: BarChart3,
    title: "Actionable Insights",
    description: "See exactly where students struggle. Use data to guide your next lesson.",
    color: "blue"
  }
];

// Steps for how it works
const steps = [
  {
    number: "01",
    title: "Upload Your Material",
    description: "Drop in your lesson content - slides, documents, or text."
  },
  {
    number: "02",
    title: "Set Your Goal",
    description: "Tell us what students should learn. Choose from 6 objective types."
  },
  {
    number: "03",
    title: "AI Creates the Game",
    description: "Our AI generates questions and designs unique game mechanics."
  },
  {
    number: "04",
    title: "Play & Learn",
    description: "Students join with a code. You control the game and see results live."
  }
];

// Testimonials
const testimonials = [
  {
    quote: "My students actually ASK to review now. The games are so engaging that they forget they're learning.",
    author: "Sarah Chen",
    role: "7th Grade Science Teacher",
    school: "Oak Middle School"
  },
  {
    quote: "I used to spend 2 hours making Kahoot quizzes. Now I upload my slides and have a better game in 2 minutes.",
    author: "Marcus Johnson",
    role: "High School History",
    school: "Lincoln High"
  },
  {
    quote: "The misconception detection is brilliant. I can see exactly which concepts need more explanation.",
    author: "Dr. Emily Rodriguez",
    role: "Professor",
    school: "State University"
  }
];

// Game type examples
const gameTypes = [
  {
    title: "Economic Empire",
    genre: "Economic",
    description: "Students trade resources and answer questions to build their empire.",
    color: "yellow"
  },
  {
    title: "Knowledge Quest",
    genre: "Adventure",
    description: "An RPG-style journey where correct answers unlock new areas.",
    color: "green"
  },
  {
    title: "Science Race",
    genre: "Racing",
    description: "Answer quickly and correctly to speed past opponents.",
    color: "blue"
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 border-b-2 border-paper-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-highlight-yellow rounded-lg border-2 border-paper-900 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-paper-900" />
              </div>
              <span className="font-display text-xl font-bold text-paper-900">LessonPlay</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/create" className="text-paper-600 hover:text-paper-900 transition-colors text-sm font-medium">
                Create Game
              </Link>
              <Button variant="yellow" size="sm" className="hidden sm:flex">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <Badge variant="purple" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Learning Games
              </Badge>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-paper-900 leading-tight mb-6">
                Transform Lessons Into{" "}
                <span className="text-highlight-purple">Epic Games</span>
              </h1>
              <p className="text-lg md:text-xl text-paper-500 mb-8 max-w-xl mx-auto lg:mx-0">
                Upload your teaching materials. Our AI creates interactive classroom games 
                that test understanding, not just memorization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/create">
                  <Button variant="yellow" size="lg" className="w-full sm:w-auto">
                    Create Your First Game
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/promo.mp4" target="_blank">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Play className="w-5 h-5 mr-2" />
                    See How It Works
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 justify-center lg:justify-start mt-8 text-sm text-paper-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-highlight-green" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-highlight-green" />
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-highlight-green" />
                  <span>Takes 60 seconds</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <Card variant="yellow" className="p-6 transform rotate-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-paper-200">
                    <div className="w-10 h-10 bg-highlight-purple/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-highlight-purple" />
                    </div>
                    <div>
                      <p className="font-medium text-paper-900">Upload Complete</p>
                      <p className="text-sm text-paper-500">biology_chapter3.pdf</p>
                    </div>
                    <Badge variant="green" className="ml-auto">Ready</Badge>
                  </div>
                  <div className="p-4 bg-paper-50 rounded-xl border-2 border-paper-200">
                    <p className="text-sm font-medium text-paper-700 mb-2">Learning Objective</p>
                    <p className="text-paper-600">&ldquo;Students should understand photosynthesis and energy transfer&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-paper-500">
                    <div className="w-2 h-2 bg-highlight-green rounded-full animate-pulse" />
                    <span>AI designing game mechanics...</span>
                  </div>
                </div>
              </Card>
              
              {/* Floating elements */}
              <Card variant="green" className="absolute -bottom-6 -left-6 p-4 transform -rotate-6 hidden md:block">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-paper-900">24 players joined</span>
                </div>
              </Card>
              
              <Card variant="blue" className="absolute -top-4 -right-4 p-3 transform rotate-6 hidden md:block">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-highlight-yellow fill-highlight-yellow" />
                  <span className="font-bold text-paper-900">4.9</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-highlight-yellow/30 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-highlight-purple/20 rounded-full blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="border-y-2 border-paper-200 bg-paper-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-4xl font-bold text-paper-900">60s</p>
              <p className="text-paper-500 mt-1">To create a game</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-paper-900">50K+</p>
              <p className="text-paper-500 mt-1">Games played</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-paper-900">1M+</p>
              <p className="text-paper-500 mt-1">Students engaged</p>
            </div>
            <div>
              <p className="font-display text-4xl font-bold text-paper-900">98%</p>
              <p className="text-paper-500 mt-1">Teacher satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="blue" className="mb-4">How It Works</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
              From Lesson to Game in 4 Steps
            </h2>
            <p className="text-lg text-paper-500 max-w-2xl mx-auto">
              No prep work, no writing questions. Just upload and play.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={i} variant="default" className="p-6 relative">
                <span className="font-display text-5xl font-bold text-paper-200 absolute top-4 right-4">
                  {step.number}
                </span>
                <div className="relative">
                  <h3 className="font-display text-xl font-bold text-paper-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-paper-500">{step.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-paper-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="green" className="mb-4">Features</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-paper-500 max-w-2xl mx-auto">
              Built by educators, for educators. Every feature designed to maximize learning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} variant="default" className="p-6 hover:-translate-y-1 transition-transform">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  feature.color === "yellow" ? "bg-highlight-yellow/20" :
                  feature.color === "green" ? "bg-highlight-green/20" :
                  feature.color === "blue" ? "bg-highlight-blue/20" :
                  feature.color === "purple" ? "bg-highlight-purple/20" :
                  feature.color === "pink" ? "bg-highlight-pink/20" :
                  "bg-paper-200"
                }`}>
                  <feature.icon className={`w-6 h-6 ${
                    feature.color === "yellow" ? "text-paper-900" :
                    feature.color === "green" ? "text-green-600" :
                    feature.color === "blue" ? "text-blue-600" :
                    feature.color === "purple" ? "text-highlight-purple" :
                    feature.color === "pink" ? "text-red-600" :
                    "text-paper-600"
                  }`} />
                </div>
                <h3 className="font-display text-xl font-bold text-paper-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-paper-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Game Types Showcase */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="purple" className="mb-4">AI-Generated Games</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
              Every Game is Unique
            </h2>
            <p className="text-lg text-paper-500 max-w-2xl mx-auto">
              Our AI analyzes your content and designs custom game mechanics. 
              No templates, no repetition.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {gameTypes.map((game, i) => (
              <Card 
                key={i} 
                variant={game.color as "yellow" | "green" | "blue" | undefined}
                className="p-6"
              >
                <Badge variant={game.color as "yellow" | "green" | "blue" | undefined} className="mb-4">
                  {game.genre}
                </Badge>
                <h3 className="font-display text-2xl font-bold text-paper-900 mb-2">
                  {game.title}
                </h3>
                <p className="text-paper-600">{game.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Objectives */}
      <section className="py-24 bg-paper-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="yellow" className="mb-4">Learning Science</Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-6">
                Games That Actually Teach
              </h2>
              <p className="text-lg text-paper-500 mb-8">
                Most quiz games test memorization. LessonPlay tests understanding by matching 
                question types to your specific learning objectives.
              </p>
              
              <div className="space-y-4">
                {[
                  "Understand core concepts, not just definitions",
                  "Explain processes and因果关系",
                  "Apply knowledge to novel situations",
                  "Distinguish between similar concepts",
                  "Analyze and evaluate evidence",
                  "Perform procedures correctly"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-highlight-green flex-shrink-0 mt-0.5" />
                    <span className="text-paper-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <Card variant="elevated" className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-highlight-yellow" />
                  <span className="font-semibold text-paper-900">Sample Question</span>
                </div>
                <div className="p-4 bg-paper-50 rounded-xl border-2 border-paper-200 mb-4">
                  <p className="text-paper-900 font-medium mb-4">
                    &ldquo;Why would a plant in a sealed jar eventually die, even with sufficient water?&rdquo;
                  </p>
                  <div className="space-y-2">
                    {[
                      "A. It runs out of water",
                      "B. It uses up all the carbon dioxide",
                      "C. It uses up all the oxygen",
                      "D. It runs out of sunlight"
                    ].map((opt, j) => (
                      <div key={j} className={`p-2 rounded-lg text-sm ${
                        j === 1 
                          ? "bg-highlight-green/20 border border-highlight-green text-paper-900" 
                          : "bg-paper-100 text-paper-600"
                      }`}>
                        {opt}
                        {j === 1 && <span className="ml-2 text-green-600 font-medium">✓ Correct</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-paper-500">
                  <Target className="w-4 h-4" />
                  <span>Tests: Understanding (not recall)</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="pink" className="mb-4">Testimonials</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
              Loved by Teachers
            </h2>
            <p className="text-lg text-paper-500">
              Join thousands of educators transforming their classrooms.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} variant="default" className="p-6">
                <Quote className="w-8 h-8 text-paper-300 mb-4" />
                <p className="text-paper-700 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-paper-900">{t.author}</p>
                  <p className="text-sm text-paper-500">{t.role}</p>
                  <p className="text-sm text-paper-400">{t.school}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-paper-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="blue" className="mb-4">FAQ</Badge>
            <h2 className="font-display text-4xl font-bold text-paper-900 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is LessonPlay really free?",
                a: "Yes! LessonPlay is completely free for educators. We believe great teaching tools should be accessible to everyone."
              },
              {
                q: "What file types can I upload?",
                a: "We support PDFs, PowerPoint (.ppt/.pptx), Word documents (.doc/.docx), Apple Pages & Keynote files, plus plain text/RTF. You can also paste text directly."
              },
              {
                q: "How many students can join a game?",
                a: "There's no hard limit, but we recommend 30-50 students per game for the best experience."
              },
              {
                q: "Do students need accounts?",
                a: "Nope! Students just enter the game code and their name. No signup, no passwords to forget."
              },
              {
                q: "Can I save games for later?",
                a: "Yes! Once you create a game, you can reuse it with different classes. The game code changes each time."
              }
            ].map((faq, i) => (
              <Card key={i} variant="default" className="p-6">
                <h3 className="font-semibold text-paper-900 mb-2">{faq.q}</h3>
                <p className="text-paper-500">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card variant="yellow" className="p-12 text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-paper-900 mb-4">
              Ready to Transform Your Classroom?
            </h2>
            <p className="text-lg text-paper-600 mb-8 max-w-2xl mx-auto">
              Join thousands of teachers who are saving time and increasing engagement 
              with AI-powered learning games.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button variant="yellow" size="lg" className="w-full sm:w-auto border-2 border-paper-900">
                  Create Your First Game
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-paper-500 mt-6">
              Free forever • No credit card required • Takes 60 seconds
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-paper-200 bg-paper-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-highlight-yellow rounded-lg border-2 border-paper-900 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-paper-900" />
                </div>
                <span className="font-display font-bold text-paper-900">LessonPlay</span>
              </div>
              <p className="text-sm text-paper-500">
                Transform lesson materials into interactive classroom games with AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-paper-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/create" className="text-paper-500 hover:text-paper-900">Create Game</Link></li>
                <li><Link href="/play" className="text-paper-500 hover:text-paper-900">Join Game</Link></li>
                <li><span className="text-paper-400">Pricing (Free!)</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-paper-900 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-paper-400">Help Center</span></li>
                <li><span className="text-paper-400">Teaching Tips</span></li>
                <li><span className="text-paper-400">API Docs</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-paper-900 mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-paper-400">Twitter</span></li>
                <li><span className="text-paper-400">Discord</span></li>
                <li><span className="text-paper-400">Contact</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-paper-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-paper-400">
              © 2025 LessonPlay. Built for educators everywhere.
            </p>
            <div className="flex gap-6 text-sm text-paper-400">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
