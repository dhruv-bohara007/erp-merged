
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Clock, User, Shield } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  companyId: string;
  itemId: string;
  itemName: string;
  productCategory: string;
  senderEmail: string;
  senderName: string;
  receiverEmail: string;
  participants: string[]; // Array containing both sender and receiver emails
  requestId: string; // Same as itemId for request-specific chats
  message: string;
  createdAt: Date;
}

interface ChatHistoryModalProps {
  itemId: string;
  itemName: string;
  productCategory: string;
  children: React.ReactNode;
  isAdmin?: boolean;
  targetEmployeeEmail?: string;
}

const ChatHistoryModal = ({ 
  itemId, 
  itemName, 
  productCategory, 
  children, 
  isAdmin = false,
  targetEmployeeEmail 
}: ChatHistoryModalProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Fetch messages when modal opens - get all messages for this product where current user is a participant
  useEffect(() => {
    if (!open || !currentUser?.companyId || !currentUser?.email) return;

    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('companyId', '==', currentUser.companyId),
      where('itemName', '==', itemName),
      where('productCategory', '==', productCategory),
      where('participants', 'array-contains', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as ChatMessage[];

      console.log('DEBUG - All fetched messages:', fetchedMessages);
      console.log('DEBUG - Current user email:', currentUser?.email);
      console.log('DEBUG - Current user role:', currentUser?.role);
      console.log('DEBUG - Item ID:', itemId);

      // Sort in memory by createdAt to avoid composite index requirement
      fetchedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    });

    return () => unsubscribe();
  }, [open, currentUser?.companyId, currentUser?.email, itemName, productCategory]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.companyId || !currentUser?.email || loading) return;

    setLoading(true);
    try {
      const senderEmail = currentUser.email;
      const receiverEmail = isAdmin 
        ? (targetEmployeeEmail || 'employee') 
        : 'mahesh9000@gmail.com'; // Use actual admin email instead of placeholder
      
      const participants = [senderEmail, receiverEmail];

      await addDoc(collection(db, 'messages'), {
        companyId: currentUser.companyId,
        itemId: itemId,
        itemName: itemName,
        productCategory: productCategory,
        senderEmail: senderEmail,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown',
        receiverEmail: receiverEmail,
        participants: participants, // Array for easier querying
        requestId: itemId, // Using itemId as requestId for request-specific chats
        message: newMessage.trim(),
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      toast({
        title: "Message Sent",
        description: isAdmin ? "Your message has been sent to the employee" : "Your message has been sent to the admin"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Determine if the message is from the current user
  const isCurrentUserMessage = (message: ChatMessage) => {
    return message.senderEmail === currentUser?.email;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Chat History - {itemName}
          </DialogTitle>
          <p className="text-sm text-gray-500">{productCategory}</p>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 h-96 pr-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No messages yet.</p>
                <p className="text-sm">Start a conversation about this item.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full mb-3 ${
                    isCurrentUserMessage(message) ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isCurrentUserMessage(message) && (
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                      isCurrentUserMessage(message)
                        ? 'bg-blue-500 text-white rounded-br-sm ml-auto'
                        : 'bg-white text-gray-900 border rounded-bl-sm'
                    }`}
                  >
                    <div className={`flex items-center gap-1 mb-1 text-xs ${
                      isCurrentUserMessage(message) ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="font-medium">
                        {isCurrentUserMessage(message) ? 'You' : message.senderName || message.senderEmail.split('@')[0]}
                      </span>
                      <span className="opacity-70">•</span>
                      <span className="opacity-70">
                        {format(message.createdAt, 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>

                  {isCurrentUserMessage(message) && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        {currentUser?.role === 'employee' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex items-end gap-2 pt-4 border-t">
          <div className="flex-1">
            <Input
              placeholder={isAdmin ? "Type your message to employee..." : "Type your message to admin..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="resize-none"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-1" />
            {isAdmin ? "Send to Employee" : "Send to Admin"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryModal;
