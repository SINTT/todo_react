import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, FlatList, View, Image, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Text } from '../components/CustomText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api'; // Ensure this is correctly configured
import { AxiosError } from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import { ImageViewerModal } from '../components/ImageViewer';

interface Message {
  message_id: number;
  message_text: string;
  sender_id: number;
  date: string;
  sender_name: string;
  sender_image: string;
}

interface ChatInfo {
  chat_id: number;
  chat_name: string;
  chat_image?: string;
  is_group_chat: boolean;
  task_id?: number;
  is_active: boolean;
  participants?: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_image?: string;
  }[];
}

interface ChatImage {
  image_id: number;
  image_url: string;
  created_at: string;
  sender_name: string;
  sender_id: number;
  sender_image: string;  // Added missing property
}

interface DraftImage {
  uri: string;
  base64: string;
  type: string;
}

interface ChatItem {
  id: string;
  type: 'message' | 'image';
  data: Message | ChatImage;
  timestamp: string;
}

const ChatScreen = ({ route, navigation }: any) => {
  const { chatId, userId, recipientName, recipientImage, isNewChat } = route.params;
  const [messages, setMessages] = useState<Message[]>([]); // Define type for messages
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [images, setImages] = useState<ChatImage[]>([]);
  const [draftImage, setDraftImage] = useState<DraftImage | null>(null);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<number | null>(chatId || null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = await AsyncStorage.getItem('userToken');
      if (userData) {
        const { user_id } = JSON.parse(userData);
        setCurrentUserId(user_id);
      }
    };

    fetchUserId();
    if (!isNewChat) {
      loadMessages();
      loadChatInfo();
      loadImages();
    }

    // Only set up polling for existing chats
    let interval: NodeJS.Timeout;
    if (!isNewChat) {
      interval = setInterval(loadMessages, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chatId, isNewChat]);

  useEffect(() => {
    // Combine and sort messages and images
    const items: ChatItem[] = [
      ...messages.map(msg => ({
        id: `msg_${msg.message_id}`,
        type: 'message' as const,
        data: msg,
        timestamp: msg.date
      })),
      ...images.map(img => ({
        id: `img_${img.image_id}`,
        type: 'image' as const,
        data: img,
        timestamp: img.created_at
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setChatItems(items);
  }, [messages, images]);

  const loadMessages = async () => {
    if (!currentChatId) return;
    
    try {
      const response = await api.get(`/api/chats/${currentChatId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const loadChatInfo = async () => {
    try {
      const response = await api.get(`/api/chats/${chatId}`);
      if (response.data.success) {
        setChatInfo(response.data.chat);
        setError('');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{error: string}>;
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          setError('Чат не найден');
          navigation.goBack();
        } else {
          setError(axiosError.response.data.error || 'Ошибка при загрузке информации о чате');
        }
      } else if (axiosError.request) {
        setError('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        setError('Произошла неизвестная ошибка');
      }
      console.error('Error loading chat info:', axiosError);
    }
  };

  const loadImages = async () => {
    try {
      const response = await api.get(`/api/chats/${chatId}/images`);
      if (response.data.success) {
        setImages(response.data.images);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    }
  };

  const handleImagePick = () => {
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.5,
        maxWidth: 800,
        maxHeight: 800,
      },
      async response => {
        if (response.didCancel || !response.assets?.[0]) return;
        
        const asset = response.assets[0];
        if (asset.base64) {
          setDraftImage({
            uri: asset.uri || '',
            base64: asset.base64,
            type: asset.type || 'image/jpeg'
          });
        }
      },
    );
  };

  const removeDraftImage = () => {
    setDraftImage(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !draftImage) return;

    try {
      if (draftImage) {
        const base64Image = `data:${draftImage.type};base64,${draftImage.base64}`;
        await api.post(`/api/chats/${chatId}/images`, {
          image: base64Image,
          sender_id: currentUserId,
        });
        setDraftImage(null);
        loadImages();
      }

      if (newMessage.trim()) {
        if (isNewChat) {
          // Create new direct chat
          const response = await api.post('/api/chats/direct', {
            recipient_id: userId,
            sender_id: currentUserId,
            message: newMessage
          });

          if (response.data.success) {
            setCurrentChatId(response.data.chat_id);
            // Update route params with new chatId
            navigation.setParams({ 
              chatId: response.data.chat_id,
              isNewChat: false
            });
          }
        } else {
          // Send message to existing chat
          await api.post(`/api/chats/${chatId}/messages`, {
            message_text: newMessage,
            sender_id: currentUserId,
          });
        }
        setNewMessage('');
        loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Ошибка', 'Не удалось отправить сообщение');
    }
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === currentUserId;
    
    return (
      <View style={[
        styles.messageWrapper,
        isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper
      ]}>
        {!isMyMessage && (
          <Image
            source={
              item.sender_image
                ? { uri: item.sender_image }
                : require('../assets/images/avatar.jpg')
            }
            style={styles.senderAvatar}
          />
        )}
        
        <View style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
          {!isMyMessage && (
            <Text semiBold style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={styles.messageText}>{item.message_text}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.date)}
          </Text>
        </View>
      </View>
    );
  };

  const renderImage = ({ item }: { item: ChatImage }) => {
    const isMyImage = item.sender_id === currentUserId;
    
    return (
      <View style={[
        styles.messageWrapper,
        isMyImage ? styles.myMessageWrapper : styles.otherMessageWrapper
      ]}>
        {!isMyImage && (
          <Image
            source={{ uri: item.sender_image }}
            style={styles.senderAvatar}
          />
        )}
        <View style={[
          styles.imageContainer,
          isMyImage ? styles.myMessage : styles.otherMessage
        ]}>
          {!isMyImage && (
            <Text semiBold style={[styles.senderName, {marginLeft: 8, marginTop: 4}]}>{item.sender_name}</Text>
          )}
          <TouchableOpacity onPress={() => setSelectedImage(item.image_url)}>
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.chatImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={[styles.messageTime, {marginRight: 8}]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => {
    if (item.type === 'message') {
      return renderMessage({ item: item.data as Message });
    } else {
      return renderImage({ item: item.data as ChatImage });
    }
  };

  // Добавим функцию для получения информации о собеседнике
  const getInterlocutorInfo = () => {
    if (!chatInfo || !currentUserId || chatInfo.is_group_chat) return null;
    return chatInfo.participants?.find(p => p.user_id !== currentUserId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/icons/back_arrow54.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        
        <Text semiBold style={styles.chatName}>
          {isNewChat 
            ? recipientName 
            : chatInfo?.is_group_chat 
              ? chatInfo.chat_name 
              : getInterlocutorInfo()
                ? `${getInterlocutorInfo()?.first_name} ${getInterlocutorInfo()?.last_name}`
                : 'Загрузка...'}
        </Text>

        <Image
          source={
            isNewChat 
              ? (recipientImage ? { uri: recipientImage } : require('../assets/images/avatar.png'))
              : chatInfo?.is_group_chat
                ? (chatInfo.chat_image ? { uri: chatInfo.chat_image } : require('../assets/images/avatar.png'))
                : getInterlocutorInfo()?.profile_image
                  ? { uri: getInterlocutorInfo()?.profile_image }
                  : require('../assets/images/avatar.jpg')
          }
          style={styles.chatAvatar}
        />
      </View>

      <FlatList
        data={chatItems}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        inverted // Show the latest messages at the bottom
      />
      
      <View>
        {draftImage && (
          <View style={styles.draftImageContainer}>
            <Image 
              source={{ uri: draftImage.uri }} 
              style={styles.draftImage} 
            />
            <TouchableOpacity 
              style={styles.removeDraftButton}
              onPress={removeDraftImage}
            >
              <Image 
                source={require('../assets/icons/close.png')}
                style={styles.removeDraftIcon}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton} 
            onPress={handleImagePick}
          >
            <Image 
              source={require('../assets/icons/paperclip.png')}
              style={styles.attachIcon}
            />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              draftImage && styles.inputWithImage
            ]}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() && !draftImage) && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!newMessage.trim() && !draftImage}
          >
            <Image 
              source={require('../assets/icons/send.png')}
              style={[
                styles.sendIcon,
                (!newMessage.trim() && !draftImage) && styles.sendIconDisabled
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bottomSafeArea} />
      <ImageViewerModal 
        images={[selectedImage || '']}
        visible={!!selectedImage}
        initialIndex={0}
        onClose={() => setSelectedImage(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 54,
    height: 54,
    tintColor: '#000',
  },
  chatInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 30,
    marginRight: 12,
  },
  chatName: {
    fontSize: 18,
    color: '#000',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContainer: {
    padding: 15,
    borderRadius: 16,
    maxWidth: '75%',
  },
  myMessage: {
    backgroundColor: '#c6dfff',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 14,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#666',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  bottomSafeArea: {
    height: 34, // Высота для учета навигационной панели Android
    backgroundColor: '#fff',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFE5E5',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  imageContainer: {
    padding: 2,
    paddingBottom: 8,
    borderRadius: 16,
    maxWidth: '85%',
  },
  chatImage: {
    width: 280,
    height: 350,
    borderRadius: 12,
    marginVertical: 4,
  },
  attachButton: {
    padding: 10,
  },
  attachIcon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
  draftImageContainer: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  removeDraftButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  removeDraftIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  inputWithImage: {
    flex: 1,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendIconDisabled: {
    tintColor: '#999',
  },
});

export default ChatScreen;