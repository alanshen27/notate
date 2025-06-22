'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [userInfo, setUserInfo] = useState<{ name?: string; tokens?: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => setUserInfo(data));
    }
  }, [status]);

  useEffect(() => {
    const searchNotes = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch('/api/notes');
        const notes = await response.json();
        const filtered = notes.filter((note: Note) => 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error('Error searching notes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchNotes, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  // if page = login, display nothing
  if (pathname === '/login') {
    return null;
  }

  const tokenBalance = userInfo?.tokens ?? 100;
  const approxWords = Math.round(tokenBalance * 3.5);

  return (
    <nav className="top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900 flex flex-row items-center gap-2">
              <Image src="/logo-ico.png" alt="notate" width={24} height={24} />
              <span>notate<span className="text-primary">.sh</span></span>
            </Link>
          </div>

          {status === 'authenticated' && <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="search"
                name="search"
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded">
                ⌘P
              </kbd>
              
              {showResults && (searchQuery || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-sm text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((note) => (
                        <button
                          key={note.id}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          onClick={() => {
                            router.push(`/notes/${note.id}`);
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="font-medium">{note.title}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {note.content.substring(0, 100)}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </form>
          </div>}

          <div className="flex items-center gap-4">
            {status === 'authenticated' ? (
              <>
                <Link
                  href="/notes"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  My Notes
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                        <AvatarFallback>
                          {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {session.user?.name || session.user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Token Usage</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-medium">
                                {tokenBalance}
                                <Badge className="ml-2" variant="secondary">~{approxWords} words</Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Tokens: {tokenBalance}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 