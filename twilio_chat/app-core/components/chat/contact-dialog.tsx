'use client';

import { useState } from 'react';
import type { Chat } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Clock, MessageSquare, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get initials from any name format
function getInitials(name: string): string {
  if (!name || name === "Anonymous") return "AN";
  
  // If it's a phone number format like "+20 15 5700 0970", extract numbers
  if (name.match(/^\+\d/)) {
    const numbers = name.replace(/\D/g, ''); // Remove all non-digits
    return numbers.slice(-2); // Take last 2 digits
  }
  
  // For regular names, take first 2 characters
  return name.substring(0, 2).toUpperCase();
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
}

export function ContactDialog({ open, onOpenChange, chat }: ContactDialogProps) {
  const customer = chat.customer;
  const customerName = customer?.name || "Anonymous";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Information</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Picture and Name */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={customer?.avatar} alt={customerName} />
              <AvatarFallback className="text-lg">{getInitials(customerName)}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{customerName}</h3>
              <p className="text-sm text-muted-foreground">Customer</p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="w-full space-y-3">
            {customer.phoneNumber && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
                </div>
              </div>
            )}

            {customer.email && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.lastSeen && (
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Seen</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(customer.lastSeen), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">{chat.messages.length} messages</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Assigned Agent</p>
                <p className="text-sm text-muted-foreground">{chat.agent.name}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 w-full">
            <Button variant="outline" className="flex-1">
              Call
            </Button>
            <Button variant="outline" className="flex-1">
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
