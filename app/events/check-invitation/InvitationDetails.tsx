import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Ticket,
  QrCode,
  Phone,
  Info,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface InvitationDetailsProps {
  result: any;
  onClose: () => void;
  onScanAnother: () => void;
}

export default function InvitationDetails({ 
  result, 
  onClose, 
  onScanAnother 
}: InvitationDetailsProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (isUsed: boolean) => {
    return isUsed ? 'warning' : 'success';
  };

  const getStatusIcon = () => {
    if (!result.invitation) {
      return <XCircle className="h-6 w-6 text-destructive" />;
    }

    if (result.invitation.isUsed) {
      return <AlertTriangle className="h-6 w-6 text-warning" />;
    } else {
      return <CheckCircle className="h-6 w-6 text-success" />;
    }
  };

  const formatCheckInTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    if (timeString) {
      return `${formattedDate} at ${timeString}`;
    }
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedDate} at ${formattedTime}`;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'QR_CODE':
        return <QrCode className="h-4 w-4" />;
      case 'SEVEN_DIGIT_CODE':
        return <Ticket className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleCheckIn = async () => {
    if (!result.invitation || !result.allowCheckIn) return;

    setIsCheckingIn(true);
    try {
      // TODO: Implement actual check-in API call here
      toast({
        title: "Check-in Successful!",
        description: "Welcome to the event. Have a great time!",
      });
      
             // Update the local state to reflect the check-in
       if (result.invitation) {
         result.invitation.isUsed = true;
         result.invitation.checkInTime = new Date().toISOString();
         result.allowCheckIn = false;
       }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process check-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
                 <h2 className="text-xl font-bold text-foreground mb-2">
           {result.success ? 'Check-in Successful' : 'Already Checked In'}
         </h2>
        <p className={`text-sm ${
          result.alertType === 'success' ? 'text-success' :
          result.alertType === 'warning' ? 'text-warning' :
          result.alertType === 'error' ? 'text-destructive' :
          'text-muted-foreground'
        }`}>
          {result.message}
        </p>
      </div>

      {/* Invitation Details */}
      {result.invitation && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            {/* Event Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-foreground">
                  {result.invitation.event}
                </h3>
                <Badge variant={getStatusColor(result.invitation.isUsed) as any}>
                  {result.invitation.isUsed ? 'USED' : 'VALID'}
                </Badge>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {result.invitation.eventDates && result.invitation.eventDates.length > 0 
                      ? new Date(result.invitation.eventDates[0]).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : result.invitation.checkInDate 
                        ? new Date(result.invitation.checkInDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'TBD'
                    }
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{result.invitation.checkInTime || 'TBD'}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Event Venue</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attendee Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Attendee Information</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{result.invitation.fullName}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">Free Event Ticket</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Attended {result.invitation.attendedTimes || 0} time(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in History for Used Tickets */}
            {result.invitation.isUsed && result.checkInDetails && result.checkInDetails.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Check-in History</h4>
                  <div className="space-y-2">
                    {result.checkInDetails.map((checkIn: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-primary">
                          {getMethodIcon(checkIn.method)}
                          <span className="text-xs font-medium uppercase">
                            {checkIn.method.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium text-foreground">
                            {formatCheckInTime(checkIn.checkInDate, checkIn.checkInTime)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Check-in #{index + 1}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {result.invitation.totalCheckIns && (
                    <div className="flex items-center gap-3 text-sm pt-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        Total check-ins: {result.invitation.totalCheckIns}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Additional Info for Valid Tickets */}
            {!result.invitation.isUsed && (result.invitation.lastCheckIn || result.checkInDetails) && (
              <>
                <Separator />
                <div className="space-y-3">
                  {result.invitation.lastCheckIn && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        Last check-in: {new Date(result.invitation.lastCheckIn.checkInDate).toLocaleString()}
                        {result.invitation.lastCheckIn.method && ` (${result.invitation.lastCheckIn.method})`}
                      </span>
                    </div>
                  )}
                  
                  {result.checkInDetails && result.checkInDetails.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-foreground">
                        <div>Previous check-ins:</div>
                        {result.checkInDetails.map((checkIn: any, index: number) => (
                          <div key={index} className="ml-4 text-xs text-muted-foreground">
                            • {new Date(checkIn.checkInDate).toLocaleString()} ({checkIn.method})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.invitation.totalCheckIns && (
                    <div className="flex items-center gap-3 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        Total check-ins: {result.invitation.totalCheckIns}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Contact Info */}
            <Separator />
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Contact: </span>
              <span className="text-foreground">Contact event organizer</span>
            </div>
          </div>

                     {/* Check-in Button */}
           {result.allowCheckIn && !result.invitation.isUsed && (
            <Button 
              onClick={handleCheckIn}
              disabled={isCheckingIn}
              className="w-full"
              size="lg"
            >
              {isCheckingIn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  Confirm Check-in
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onScanAnother} className="flex-1">
          Scan Another
        </Button>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
}