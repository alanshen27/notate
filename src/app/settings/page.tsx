'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name?: string; tokens?: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
        setEditName(data.name || '');
      });
  }, []);

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
        setEditName(data.name || '');
        toast.success('Name updated!');
      } else {
        toast.error('Failed to update name');
      }
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePurchase = async (amount: number) => {
    return alert('Coming soon if interest is sufficient.');

    setIsLoading(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase tokens');
      }
      
      toast.success(`Successfully purchased ${amount} tokens!`);
    } catch {
      toast.error('Failed to purchase tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tokenBalance = userInfo?.tokens ?? 0;

  return (
    <main className="flex justify-center pt-10">
      <div className="container max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          
          <Tabs defaultValue="tokens" className="space-y-6">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="tokens" className="space-y-6">
              <Card>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold">{tokenBalance} tokens</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Mini</CardTitle>
                        <CardDescription>4,000 words</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">$0.50</p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => handlePurchase(100)}
                          disabled={isLoading}
                        >
                          Purchase
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Standard</CardTitle>
                        <CardDescription>20,000 words</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">$2.00</p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => handlePurchase(500)}
                          disabled={isLoading}
                        >
                          Purchase
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Pro</CardTitle>
                        <CardDescription>80,000 words</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">$6.00</p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={() => handlePurchase(1000)}
                          disabled={isLoading}
                        >
                          Purchase
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <label htmlFor="name">Name</label>
                      <input
                        id="name"
                        className="border rounded px-3 py-2"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        disabled={isSavingName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={session?.user?.email || ''} disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveName} disabled={isSavingName || !editName.trim()}>
                    {isSavingName ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
} 