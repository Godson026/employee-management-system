import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleName } from '../roles';
import api from '../api';
import debounce from 'lodash.debounce';

interface SearchResult {
  id: string;
  type: 'employee' | 'department' | 'branch';
  title: string;
  subtitle?: string;
  url: string;
}

export default function SearchBar() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdminUser = hasRole(RoleName.SYSTEM_ADMIN) || hasRole(RoleName.HR_MANAGER);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const searchResults: SearchResult[] = [];

      try {
        // Search employees (available to all roles, backend handles filtering)
        try {
          const employeesRes = await api.get('/employees', {
            params: { search: query, limit: 5 },
          });
          const employees = Array.isArray(employeesRes.data)
            ? employeesRes.data
            : employeesRes.data?.data || [];

          employees.forEach((emp: any) => {
            searchResults.push({
              id: emp.id,
              type: 'employee',
              title: `${emp.first_name} ${emp.last_name}`,
              subtitle: emp.job_title || emp.department?.name || 'Employee',
              url: `/employees/${emp.id}`,
            });
          });
        } catch (err) {
          console.error('Error searching employees:', err);
        }

        // Search departments (Admin/HR only)
        if (isAdminUser) {
          try {
            const departmentsRes = await api.get('/departments');
            const departments = Array.isArray(departmentsRes.data)
              ? departmentsRes.data
              : [];

            departments
              .filter((dept: any) =>
                dept.name?.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 3)
              .forEach((dept: any) => {
                searchResults.push({
                  id: dept.id,
                  type: 'department',
                  title: dept.name,
                  subtitle: dept.department_head
                    ? `Head: ${dept.department_head.first_name} ${dept.department_head.last_name}`
                    : 'No head assigned',
                  url: `/departments/${dept.id}`,
                });
              });
          } catch (err) {
            console.error('Error searching departments:', err);
          }
        }

        // Search branches (Admin/HR only)
        if (isAdminUser) {
          try {
            const branchesRes = await api.get('/branches');
            const branches = Array.isArray(branchesRes.data)
              ? branchesRes.data
              : [];

            branches
              .filter((branch: any) =>
                branch.name?.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 3)
              .forEach((branch: any) => {
                searchResults.push({
                  id: branch.id,
                  type: 'branch',
                  title: branch.name,
                  subtitle: branch.address || branch.location || 'Branch',
                  url: `/branches/${branch.id}`,
                });
              });
          } catch (err) {
            console.error('Error searching branches:', err);
          }
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [isAdminUser]
  );

  // Handle search input change
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      performSearch(searchQuery);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [searchQuery, performSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return (
          <svg
            className="w-5 h-5 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 'department':
        return (
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      case 'branch':
        return (
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative group">
        {/* Glow effect on focus */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
        
        {/* Search Icon Container */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/20 rounded-lg blur-md animate-pulse"></div>
            <div className="relative p-1.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg">
              <svg
                className={`w-5 h-5 text-emerald-600 transition-all duration-300 ${isOpen ? 'scale-110 text-emerald-700' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search employees, departments..."
          className="relative w-full pl-14 pr-28 py-3 bg-gradient-to-br from-white/95 to-emerald-50/60 backdrop-blur-xl border border-emerald-200/60 rounded-2xl shadow-lg hover:shadow-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all duration-300 text-sm font-medium placeholder:text-gray-400 placeholder:font-normal"
        />
        
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-16 pr-3 flex items-center group/clear"
          >
            <div className="p-1 rounded-lg hover:bg-emerald-100/50 transition-colors">
              <svg
                className="w-4 h-4 text-gray-400 group-hover/clear:text-emerald-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </button>
        )}
        
        {/* Keyboard Shortcut Badge */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-lg shadow-sm">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchQuery.trim().length >= 2 || results.length > 0 || isLoading) && (
        <div className="absolute mt-3 w-full bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/60 z-50 max-h-96 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="px-5 py-10 text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative inline-block animate-spin rounded-full h-8 w-8 border-3 border-emerald-500 border-t-transparent"></div>
                </div>
                <p className="mt-3 text-sm font-semibold text-emerald-700">Searching...</p>
                <p className="text-xs text-gray-500 mt-1">Finding matches across the app</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-5 py-3.5 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 active:from-emerald-100 active:to-teal-100 transition-all duration-200 flex items-center space-x-4 group border-b border-emerald-100/50 last:border-b-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-shrink-0 relative">
                      <div className="absolute inset-0 bg-emerald-400/10 rounded-lg blur-sm group-hover:bg-emerald-400/20 transition-colors"></div>
                      <div className="relative p-2 bg-white/50 rounded-lg group-hover:bg-white transition-colors">
                        {getTypeIcon(result.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-900 transition-colors truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 group-hover:text-emerald-600/80 truncate mt-1 transition-colors">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="p-1.5 rounded-lg bg-emerald-100/50 group-hover:bg-emerald-200 transition-colors">
                        <svg
                          className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="px-5 py-10 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-emerald-400/10 rounded-full blur-xl"></div>
                  <svg
                    className="relative w-14 h-14 text-gray-300 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-600">No results found</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  Try searching with different keywords
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

