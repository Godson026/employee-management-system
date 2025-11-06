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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
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
          className="w-full pl-12 pr-24 py-2.5 bg-gradient-to-br from-white/90 to-emerald-50/50 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-12 pr-3 flex items-center"
          >
            <svg
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-white/50 border border-gray-200 rounded-lg">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchQuery.trim().length >= 2 || results.length > 0 || isLoading) && (
        <div className="absolute mt-2 w-full bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/50 z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-5 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 flex items-center space-x-3 group first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="flex-shrink-0">{getTypeIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-900 truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="px-5 py-8 text-center">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-500">No results found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

