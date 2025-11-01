import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  LockClosedIcon,
  CalendarDaysIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'password' | 'leave' | 'attendance' | 'account';
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'password',
    question: 'Forgot my password?',
    answer: 'No worries! Click "Forgot Password?" on the login page, enter your email, and we\'ll send you a reset link. The link expires in 30 minutes, so check your inbox (and spam folder) right away.',
  },
  {
    id: '2',
    category: 'password',
    question: 'Didn\'t receive the reset email?',
    answer: 'Check your spam folder first—sometimes emails end up there. If it\'s still missing after a few minutes, try requesting another link. Still having issues? Contact IT support.',
  },
  {
    id: '3',
    category: 'leave',
    question: 'How do I request time off?',
    answer: 'Go to the Leave section and click "Request Leave". Choose your leave type, dates, and add a reason. Your request goes to your manager for approval. You\'ll get a notification when they respond.',
  },
  {
    id: '4',
    category: 'leave',
    question: 'How long until my leave is approved?',
    answer: 'Usually within 24-48 hours during weekdays, but it depends on your manager\'s schedule. You\'ll get notified as soon as a decision is made.',
  },
  {
    id: '5',
    category: 'leave',
    question: 'Can I cancel a leave request?',
    answer: 'Yes, if it\'s still pending approval, you can cancel it in the Leave section. Once approved, you\'ll need to contact your manager or HR to make changes.',
  },
  {
    id: '6',
    category: 'attendance',
    question: 'How do I clock in and out?',
    answer: 'You can use the kiosk at your branch (scan your QR code or enter your employee ID) or clock in online from "My Attendance". Clock in before 8:00 AM to be marked Present; after 8:00 AM counts as Late.',
  },
  {
    id: '7',
    category: 'attendance',
    question: 'Forgot to clock in today',
    answer: 'Contact your manager or HR as soon as possible. They can manually fix your attendance record. The sooner you report it, the easier it is to correct.',
  },
  {
    id: '8',
    category: 'attendance',
    question: 'Where can I see my attendance history?',
    answer: 'Go to "My Attendance" to see your stats and full history—dates, clock-in/out times, and status (Present, Late, Absent, or On Leave).',
  },
  {
    id: '9',
    category: 'account',
    question: 'Need to update my personal info?',
    answer: 'Contact HR or your department head. They handle updates to your address, phone number, emergency contacts, and other details. Some changes might require documentation.',
  },
  {
    id: '10',
    category: 'account',
    question: 'Can\'t log in to my account',
    answer: 'Double-check your email and password (watch out for Caps Lock). Try the "Forgot Password?" link, or clear your browser cache and try again. Still stuck? Contact IT support.',
  },
  {
    id: '11',
    category: 'general',
    question: 'Which browsers work best?',
    answer: 'Chrome is recommended, but Firefox, Edge, and Safari (latest versions) work fine too. Just make sure your browser is up to date.',
  },
  {
    id: '12',
    category: 'general',
    question: 'How do I see my notifications?',
    answer: 'Click the bell icon in the top navigation. Unread notifications have a red badge. You can also visit the Notifications page to see everything and manage them.',
  },
  {
    id: '13',
    category: 'general',
    question: 'Found a bug or error?',
    answer: 'Use the "Report an Issue" form below. Include what you were doing, what happened, any error messages, and your browser info. The more details, the faster we can fix it.',
  },
  {
    id: '14',
    category: 'leave',
    question: 'What\'s my leave balance?',
    answer: 'Go to "My Leave" and you\'ll see your balance for each leave type at the top. You can also check your history and upcoming approved leaves there.',
  },
  {
    id: '15',
    category: 'attendance',
    question: 'What\'s the difference between Present and Late?',
    answer: 'Clock in before 8:00 AM = Present. Clock in after 8:00 AM (but same day) = Late. No clock-in and no approved leave = Absent (marked automatically at end of day).',
  },
];

export default function HelpSupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({
    name: '',
    email: '',
    subject: '',
    description: '',
    priority: 'low',
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: InformationCircleIcon },
    { id: 'general', name: 'General', icon: InformationCircleIcon },
    { id: 'password', name: 'Password', icon: LockClosedIcon },
    { id: 'leave', name: 'Leave', icon: CalendarDaysIcon },
    { id: 'attendance', name: 'Attendance', icon: ClockIcon },
    { id: 'account', name: 'Account', icon: UserCircleIcon },
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      toast.success('Issue reported! We\'ll get back to you soon.');
      setIssueForm({
        name: '',
        email: '',
        subject: '',
        description: '',
        priority: 'low',
      });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      {/* Background Image - Same as Login */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url('/background.jpg')`,
        }}
      />
      
      {/* Animated Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Simple Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
            <div className="flex items-center space-x-3 mb-2">
              <QuestionMarkCircleIcon className="w-8 h-8 text-green-300" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Help & Support</h1>
            </div>
            <p className="text-green-100 text-lg">Get answers and help when you need it</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 pb-16">
          {/* Quick Actions - Simplified */}
          <div className="mb-10">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to="/forgot-password"
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <LockClosedIcon className="w-5 h-5 text-green-300" />
                    <span className="text-white font-medium">Reset Password</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#contact"
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-green-300" />
                    <span className="text-white font-medium">Contact HR</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* FAQs - Simpler Design */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Common Questions</h2>
              <span className="text-sm text-green-200">
                {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'}
              </span>
            </div>

            {filteredFAQs.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-8 text-center">
                <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-white/80">No results found. Try a different search or category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                      className="w-full px-5 py-4 flex items-start justify-between hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <QuestionMarkCircleIcon className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                          <h3 className="text-white font-medium pr-4">{faq.question}</h3>
                        </div>
                      </div>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          openFAQ === faq.id ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFAQ === faq.id && (
                      <div className="px-5 pb-4 pt-0 border-t border-white/10">
                        <div className="pl-8 pt-3">
                          <p className="text-white/90 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div id="contact" className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
            <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <EnvelopeIcon className="w-5 h-5 text-green-300" />
                    <h3 className="text-white font-semibold">Email Us</h3>
                  </div>
                  <a href="mailto:support@siclife.com" className="text-green-300 hover:text-green-200">
                    support@siclife.com
                  </a>
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <PhoneIcon className="w-5 h-5 text-green-300" />
                    <h3 className="text-white font-semibold">Call Us</h3>
                  </div>
                  <a href="tel:+233302123456" className="text-green-300 hover:text-green-200">
                    +233 302 123 456
                  </a>
                  <p className="text-white/60 text-sm mt-1">Mon-Fri, 8:00 AM - 5:00 PM GMT</p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Issue */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Report an Issue</h2>
            <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-6">
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={issueForm.name}
                      onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Your Email</label>
                    <input
                      type="email"
                      required
                      value={issueForm.email}
                      onChange={(e) => setIssueForm({ ...issueForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="john.doe@siclife.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={issueForm.subject}
                      onChange={(e) => setIssueForm({ ...issueForm, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Priority</label>
                    <select
                      value={issueForm.priority}
                      onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="low" className="bg-gray-800">Low</option>
                      <option value="medium" className="bg-gray-800">Medium</option>
                      <option value="high" className="bg-gray-800">High</option>
                      <option value="urgent" className="bg-gray-800">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={issueForm.description}
                    onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the issue in detail..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Issue</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}