import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      toast.success('Login Successful!');
      await login(response.data.access_token);
      navigate('/');
    } catch (err) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900">
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{
          backgroundImage: `url('/background.jpg')`,
          backgroundAttachment: 'fixed',
          minHeight: '100vh'
        }}
      />
      
      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/20 animate-fade-in">
        <div className="flex min-h-[600px]">
          {/* Left Branding Section */}
          <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white p-12 relative overflow-hidden">
            {/* Animated background shapes */}
            <div className="absolute inset-0">
              <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
              <div className="absolute bottom-32 left-20 w-24 h-24 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="text-center z-10 animate-slide-up">
              {/* Company Logo */}
              <div className="mb-6 h-48 flex items-center justify-center transform hover:scale-110 transition-transform duration-500">
                <img 
                  src="/logo.png" 
                  alt="SIC Life Logo" 
                  className="h-40 w-auto max-w-full drop-shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = '/logo.svg';
                  }}
                />
              </div>
              
              <h1 className="text-5xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-200 bg-clip-text text-transparent animate-gradient">
                Employee<br />
                Management<br />
                System
              </h1>
              <p className="text-lg text-green-50 leading-relaxed max-w-md mx-auto font-light">
                Streamline attendance, leave requests, reporting & performance across branches and departments.
              </p>
              
              {/* Feature Pills */}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">📊 Analytics</span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">⏰ Time Tracking</span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">📅 Leave Management</span>
              </div>
            </div>
          </div>
          
          {/* Right Form Section */}
          <div className="w-full lg:w-1/2 flex items-center justify-center bg-white/95 backdrop-blur-sm p-8 relative">
            {/* Mobile Logo */}
            <div className="lg:hidden absolute top-8 left-1/2 transform -translate-x-1/2">
              <img 
                src="/logo.png" 
                alt="SIC Life Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  e.currentTarget.src = '/logo.svg';
                }}
              />
            </div>

            <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="mb-8 mt-16 lg:mt-0">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  Welcome Back
                </h2>
                <p className="text-gray-600 text-base font-light">Sign in to access your workspace</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email Input with Animation */}
                <div className="relative">
                  <label 
                    htmlFor="email" 
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                      emailFocused || email 
                        ? '-top-2.5 text-xs bg-white px-2 text-green-600 font-semibold' 
                        : 'top-3.5 text-base text-gray-500'
                    }`}
                  >
                    Work Email
                  </label>
                  <input
                    id="email" 
                    type="email" 
                    autoComplete="email" 
                    required
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 hover:border-green-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  <div className="absolute right-4 top-4 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Password Input with Animation */}
                <div className="relative">
                  <label 
                    htmlFor="password" 
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                      passwordFocused || password 
                        ? '-top-2.5 text-xs bg-white px-2 text-green-600 font-semibold' 
                        : 'top-3.5 text-base text-gray-500'
                    }`}
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-4 pr-24 border-2 border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 hover:border-green-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-4 text-gray-400 hover:text-green-600 transition-all duration-300 hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="group relative w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-green-300 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                    <span className="relative flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg">Sign In</span>
                          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-6 flex justify-between text-sm">
                <Link 
                  to="/forgot-password" 
                  className="group font-semibold text-green-600 hover:text-green-700 transition-all duration-300 flex items-center space-x-1"
                >
                  <span>Forgot Password?</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link 
                  to="/help" 
                  className="group font-semibold text-gray-600 hover:text-gray-800 transition-all duration-300 flex items-center space-x-1"
                >
                  <span>Need Help?</span>
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
              
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center text-xs text-gray-500 space-x-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Secured by SIC Life Applications and eBusiness Systems © 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
}