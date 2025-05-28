import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Text } from '../components/CustomText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';

interface Chat {
  chat_id: number;
  chat_name: string;
  chat_image?: string;
  last_message?: {
    message_text: string;
    date: string;
    sender_name: string;
  };
  is_group_chat: boolean;
  is_active: boolean;
  task_id?: number;
  unread_count: number;
  participants?: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_image?: string;
  }[];
}

const MessagesScreen = ({ navigation }: any) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadChats();
    
    // Refresh chats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadChats();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = await AsyncStorage.getItem('userToken');
      if (userData) {
        const { user_id } = JSON.parse(userData);
        setCurrentUserId(user_id);
      }
    };

    fetchUserId();
  }, [navigation]);

  const loadChats = async () => {
    try {
      const userData = await AsyncStorage.getItem('userToken');
      if (!userData) return;

      const { user_id } = JSON.parse(userData);
      const response = await api.get(`/api/chats/user/${user_id}`);

      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getInterlocutorInfo = (chat: Chat) => {
    if (!currentUserId || chat.is_group_chat) return null;
    return chat.participants?.find(p => p.user_id !== currentUserId);
  };

  const renderChat = ({ item }: { item: Chat }) => {
    if (!item.is_active) return null;

    const interlocutor = getInterlocutorInfo(item);
    let chatName = item.chat_name;
    let avatarImage = null;

    // Для личных чатов используем информацию о собеседнике
    if (!item.is_group_chat && interlocutor) {
      chatName = `${interlocutor.first_name} ${interlocutor.last_name}`;
      avatarImage = interlocutor.profile_image;
    } else {
      // Для групповых чатов используем изображение чата
      avatarImage = item.chat_image;
    }

    const firstLetter = chatName?.charAt(0) || "Ч";

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => navigation.navigate('ChatScreen', { 
          chatId: item.chat_id,
          recipientName: chatName,
          recipientImage: avatarImage,
          isNewChat: false
        })}
      >
        <View style={styles.chatAvatar}>
          {avatarImage ? (
            <Image 
              source={{ uri: avatarImage }} 
              style={styles.avatarImage}
              defaultSource={require('../assets/images/avatar.png')}
            />
          ) : (
            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {firstLetter.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text semiBold style={styles.chatName} numberOfLines={1}>
              {chatName}
            </Text>
            {item.last_message && (
              <Text style={styles.messageTime}>
                {formatDate(item.last_message.date)}
              </Text>
            )}
          </View>

          <View style={styles.messagePreview}>
            {item.last_message ? (
              <Text numberOfLines={1} style={styles.lastMessage}>
                <Text semiBold>{item.last_message.sender_name}: </Text>
                {item.last_message.message_text}
              </Text>
            ) : (
              <Text style={styles.noMessages}>Нет сообщений</Text>
            )}
            
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text semiBold style={styles.headerTitle}>Сообщения</Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={item => item.chat_id.toString()}
        contentContainerStyle={styles.chatList}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {loading ? 'Загрузка...' : 'Нет активных диалогов'}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.fab}  
        onPress={() => navigation.navigate('AiChatScreen')}
      >
        <Image 
          source={require('../assets/icons/plus.png')}
          style={{width: 24, height: 24, tintColor: '#fff'}}
        />
        <Text semiBold style={styles.fabText}>ИИ-ассистент</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    paddingRight: 25,
    paddingLeft: 20,
    height: 64,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
  },

  chatList: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'center',
  },
  chatAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#666',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  noMessages: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: '#00D87F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});

export default MessagesScreen;