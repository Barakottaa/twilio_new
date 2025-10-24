'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Check, Users } from 'lucide-react';

interface TwilioNumber {
  id: string;
  number: string;
  name: string;
  department: string;
  isActive: boolean;
}

interface NumberSelectorProps {
  selectedNumberId: string | null;
  onNumberSelect: (numberId: string) => void;
  conversationId?: string;
}

export function NumberSelector({ selectedNumberId, onNumberSelect, conversationId }: NumberSelectorProps) {
  const [numbers, setNumbers] = useState<TwilioNumber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      const response = await fetch('/api/twilio/numbers');
      if (response.ok) {
        const data = await response.json();
        setNumbers(data.numbers || []);
      }
    } catch (error) {
      console.error('Error fetching numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Select Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading numbers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Select Phone Number
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose which number to send messages from
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {numbers.map((number) => (
            <Button
              key={number.id}
              variant={selectedNumberId === number.id ? "default" : "outline"}
              className={`w-full justify-start h-auto p-4 ${
                selectedNumberId === number.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              }`}
              onClick={() => onNumberSelect(number.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{number.name}</span>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {number.department}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {number.number}
                  </span>
                  {selectedNumberId === number.id && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        {selectedNumberId && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>
                All messages in this conversation will be sent from the selected number
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
