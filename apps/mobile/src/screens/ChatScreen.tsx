import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { messageService } from '../services/messages';
import websocketService from '../services/websocket';
import { authService } from '../services/auth';
import { Message } from '../types';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { matchId, match } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCall = (media: 'voice' | 'video') => {
    if (!currentUserId || !match?.user?.id) return;
    navigation.navigate('Call', {
      selfId: currentUserId,
      peerId: match.user.id,
      callId: uuidv4(),
      media,
      incoming: false,
    });
  };

  useEffect(() => {
    initializeChat();

    return () => {
      websocketService.off('message');
      websocketService.off('typing');
      websocketService.disconnect();
      if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Get current user
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load messages
      const messagesData = await messageService.getMessages(matchId);
      setMessages(messagesData.reverse());

      // Connect to the real-time chat gateway for this match. The gateway
      // broadcasts `chat:message` to everyone in the room whenever either
      // party sends a message via the REST API below — so we only need to
      // listen here, not send through the socket too (that would create the
      // message twice).
      await websocketService.connect(matchId);

      websocketService.on('message', (data: Message) => {
        // Our own messages are already appended locally from the REST
        // response in handleSend — only append the peer's broadcast copy.
        if (data.senderId === match.user.id) {
          setMessages((prev) => [...prev, data]);
          scrollToBottom();
        }
      });

      websocketService.on('typing', (data: { userId: string; isTyping: boolean }) => {
        if (data.userId === match.user.id) {
          setPeerTyping(!!data.isTyping);
        }
      });

      navigation.setOptions({ title: match.user.name });
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // The REST call persists the message and triggers the gateway to
      // broadcast it to the peer in real time (see MessagesController ->
      // ChatGateway.emitMessage) — no separate socket send needed here.
      const sentMessage = await messageService.sendMessage(matchId, messageContent);

      setMessages((prev) => [...prev, sentMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    websocketService.sendTyping(true);
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => websocketService.sendTyping(false), 3000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
      />

      {peerTyping && (
        <Text style={styles.typingIndicator}>{match.user.name} is typing…</Text>
      )}

      <View style={styles.callActions}>
        <TouchableOpacity style={styles.callButton} onPress={() => startCall('voice')}>
          <Text style={styles.callButtonText}>Voice Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton} onPress={() => startCall('video')}>
          <Text style={styles.callButtonText}>Video Call</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            if (text.length > 0) {
              handleTyping();
            }
          }}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#EC4899',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#fff',
    opacity: 0.8,
  },
  theirMessageTime: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  callActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
