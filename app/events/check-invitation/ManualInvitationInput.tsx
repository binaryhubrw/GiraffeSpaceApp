import React, { useState } from 'react';
import { Hash, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ManualInvitationInputProps {
  onSubmit: (invitationId: string) => void;
  isProcessing: boolean;
}

export default function ManualInvitationInput({ 
  onSubmit, 
  isProcessing 
}: ManualInvitationInputProps) {
  const [invitationId, setInvitationId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!invitationId.trim()) {
      setError('Please enter a 7-digit code');
      return;
    }

    // Basic validation for 7-digit code format
    const trimmedId = invitationId.trim();
    if (trimmedId.length !== 7) {
      setError('Code must be exactly 7 digits long');
      return;
    }

    // Check if it's all digits
    if (!/^\d{7}$/.test(trimmedId)) {
      setError('Code must contain only digits');
      return;
    }

    onSubmit(trimmedId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setInvitationId(value);
    if (error) setError('');
  };



  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
          <Hash className="h-8 w-8 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Enter 7-Digit Code</h3>
        <p className="text-sm text-muted-foreground">
          Type the 7-digit code exactly as it appears on your invitation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invitation-id" className="text-sm font-medium">
            7-Digit Code
          </Label>
          <Input
            id="invitation-id"
            type="text"
            placeholder="e.g., 6304646"
            value={invitationId}
            onChange={handleInputChange}
            className="text-center font-mono text-lg tracking-wider"
            disabled={isProcessing}
            maxLength={7}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isProcessing || !invitationId.trim()}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Checking...
            </>
          ) : (
            <>
              Check Invitation
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Your 7-digit code is usually found at the top or bottom of your invitation
        </p>
      </div>
    </div>
  );
}