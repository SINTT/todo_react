import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, StatusBar, ViewStyle } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';

const CUPS_PER_LEVEL = 500;

interface UserData {
  user_id: number;
  first_name: string;
  last_name: string;
  patronymic?: string;
  profile_image?: string;
  post_id?: number;
  full_cup_count: number;
  now_cup_count: number;
  purpose_cup_count: number;
}

const OtherProfileScreen = ({ route, navigation }: any) => {
  const { userId } = route.params;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      setUserData(response.data.user);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLevel = (cups: number) => {
    return Math.floor(cups / CUPS_PER_LEVEL);
  };

  const getProgressWidth = (): ViewStyle => {
    if (!userData?.purpose_cup_count) return { width: '0%' } as ViewStyle;
    const percentage = Math.min((userData.now_cup_count / userData.purpose_cup_count * 100), 100);
    return { width: `${percentage}%` } as ViewStyle;
  };

  const handleMessagePress = () => {
    if (!userData) return;
    
    navigation.navigate('ChatScreen', {
      userId: userData.user_id,
      recipientName: `${userData.first_name} ${userData.last_name}`,
      recipientImage: userData.profile_image,
      isNewChat: true
    });
  };

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#00FF96" />
      <View style={styles.headerBackground} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require('../assets/icons/back_arrow54.png')}
            style={{width: 54, height: 54, tintColor: '#2A2A2A'}}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={
                userData?.profile_image && !imageError
                  ? { uri: userData.profile_image }
                  : require('../assets/images/avatar.jpg')
              }
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text semiBold style={styles.userName}>
              {userData ? `${userData.first_name} ${userData.last_name}` : 'Загрузка...'}
            </Text>
            {userData && (
              <Text style={styles.level}>{calculateLevel(userData.full_cup_count)}lvl</Text>
            )}
          </View>
          <Text style={styles.userRole}>
            {userData?.post_id ? 'Специальность' : 'Нет специальности'}
          </Text>
        </View>

        <View style={styles.socialActions}>
          <TouchableOpacity style={styles.addFriend}>
            <Image
              source={require('../assets/icons/add_friend_ico.png')}
              style={{ width: 24, height: 24 }}
            />  
            <Text medium style={{fontSize: 16}}>Добавить</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addFriend, {backgroundColor: '#2A2A2A'}]}
            onPress={handleMessagePress}
          >
            <Image
              source={require('../assets/tab_icons/messages_ico.png')}
              style={{ width: 24, height: 24, tintColor: '#fff' }}
            />
            <Text style={styles.messageText}>Сообщение</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.widgets}>
          <View style={styles.goalWidget}>
            <View style={styles.goalHeader}>
              <Text semiBold style={styles.goalTitle}>Цель кубков</Text>
            </View>
            
            <View style={styles.goalInfo}>
              <Text style={styles.cupsCount}>
                {userData?.now_cup_count || 0} / {userData?.purpose_cup_count || 0}
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  getProgressWidth()
                ]} 
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
    avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 68,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#00FF96',
  },
  header: {
    height: 175,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatarContainer: {
    width: 124,
    height: 124,
    borderRadius: 68,
    borderWidth: 6,
    borderColor: '#2A2A2A',
    padding: 3,
    backgroundColor: 'white',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  level: {
    fontSize: 16,
    color: '#00D87F',
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  socialActions: {
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addFriend: {
    borderRadius: 16,
    paddingRight: 25,
    paddingLeft: 20,
    height: 64,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F5FD',
  },
  messageText: {
    color: '#fff',
    marginLeft: 8,
  },
  widgets: {
    marginTop: 16,
  },
  goalWidget: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalInfo: {
    marginBottom: 8,
  },
  cupsCount: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00D87F',
  },
});

export default OtherProfileScreen;
