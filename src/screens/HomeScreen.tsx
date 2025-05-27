import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, RefreshControl, LayoutRectangle } from 'react-native';
import { Text } from '../components/CustomText';
import DatePicker from '../components/DatePicker';
import TaskCont from '../components/TaskCont';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';
import AvatarMenu from '../components/AvatarMenu';

// Обновляем интерфейс Task чтобы он соответствовал данным с сервера
interface Task {
  task_id: number;
  task_title: string;
  task_description: string;
  organization_id: number;
  status: string;
  start_date: string;
  finish_date: string;
  reward_points: number;
  subtasks: Array<{ 
    subtask_id: number;
    title: string; 
    description: string; 
    status: string; 
  }>;
  performers: Array<{ 
    user_id: number; 
    first_name: string; 
    last_name: string; 
    profile_image: string | null 
  }>;
  images: string[];
  creator_first_name: string;
  creator_last_name: string;
  creator_profile_image: string | null;
}

const HomeScreen = ({navigation}: any) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ start?: string; end?: string }>();
  const [userRole, setUserRole] = useState<string>('');
  const [hasOrganization, setHasOrganization] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });

  const periodTitles = {
    yesterday: 'Вчера:',
    today: 'Сегодня:',
    week: 'На этой неделе:',
    period: 'За период:',
  };

  const periodButtons = [
    { id: 'yesterday', title: 'Вчера', icon: require('../assets/icons/calendar-yesterday.png') },
    { id: 'today', title: 'Сегодня', icon: require('../assets/icons/calendar-today.png') },
    { id: 'week', title: 'Неделя', icon: require('../assets/icons/calendar-week.png') },
    { id: 'period', title: 'Период', icon: require('../assets/icons/calendar-search.png') },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, selectedPeriod, selectedDates]);

  // Add navigation listener to refresh tasks when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId) {
        fetchTasks();
      }
    });

    return unsubscribe;
  }, [navigation, userId]);

  const loadUserData = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setUserRole(userData.role || '');
      setHasOrganization(!!userData.organization_id);
      setProfileImage(userData.profile_image);
      setUserId(userData.user_id);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTasks().finally(() => setRefreshing(false));
  }, [userId, selectedPeriod, selectedDates]);

  const fetchTasks = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await api.get('/api/tasks', {
        params: {
          userId,
          period: selectedPeriod,
          ...(selectedDates?.start && { startDate: selectedDates.start }),
          ...(selectedDates?.end && { endDate: selectedDates.end })
        }
      });

      if (response.data.success) {
        const taskList = response.data.tasks || [];
        // Сортируем задания: сначала активные (новые и в процессе), потом завершенные
        const sortedTasks = taskList.sort((a: Task, b: Task) => {
          if (a.status === 'completed' && b.status !== 'completed') return 1;
          if (a.status !== 'completed' && b.status === 'completed') return -1;
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        });
        setTasks(sortedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodPress = (periodId: string) => {
    if (periodId === 'period') {
      setIsCalendarVisible(true);
    } else {
      setSelectedPeriod(periodId);
    }
  };

  const handleDateSelect = (dates: { start?: string; end?: string }) => {
    setSelectedDates(dates);
    setSelectedPeriod('period');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('isLoggedIn');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const measureAvatarPosition = (event: LayoutRectangle) => {
    setAvatarPosition({
      x: event.x,
      y: event.y
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      <View style={styles.header}>
        <Text bold style={styles.headerTitle}>Главная</Text>

        <View style={{gap: 14, flexDirection: 'row'}}>
          <TouchableOpacity style={styles.bellButton} onPress={() => navigation.navigate('NotificationsScreen')}>
            <Image 
              source={require('../assets/icons/bell_ico.png')}
              style={styles.bellIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={{borderRadius: 24, borderColor: 'black', borderWidth: 3}}
            onPress={() => setIsMenuVisible(true)}
            onLayout={(event) => measureAvatarPosition(event.nativeEvent.layout)}
          >
            <Image 
              source={
                profileImage && !imageError
                  ? { uri: profileImage }
                  : require('../assets/images/avatar.jpg')
              }
              style={{borderRadius: 24, width: 44, height: 44, borderColor: 'white', borderWidth: 2}}
              onError={() => setImageError(true)}
            />
          </TouchableOpacity>
        </View>
      </View>

      <AvatarMenu 
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        onProfilePress={() => {
          setIsMenuVisible(false);
          navigation.navigate('MainTabs', { screen: 'Профиль' });
        }}
        onSettingsPress={() => {
          setIsMenuVisible(false);
          navigation.navigate('Settings');
        }}
        onLogoutPress={handleLogout}
        avatarPosition={avatarPosition}
      />

      {/* Period buttons */}
      <View style={styles.periodScrollViewContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodContainer}
        >
          {periodButtons.map((button) => (
            <TouchableOpacity
              key={button.id}
              style={[
                styles.periodButton,
                selectedPeriod === button.id && styles.periodButtonActive
              ]}
              onPress={() => handlePeriodPress(button.id)}
            >
              <Image 
                source={button.icon}
                style={[
                  styles.periodIcon,
                  selectedPeriod === button.id && styles.periodIconActive
                ]}
              />
              <Text 
                semiBold 
                style={[
                  styles.periodText,
                  selectedPeriod === button.id && styles.periodTextActive
                ]}
              >
                {button.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <DatePicker
        isVisible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onSelect={handleDateSelect}
        mode="period"
      />

      <Text semiBold style={styles.periodTitleText}>
        {periodTitles[selectedPeriod as keyof typeof periodTitles]}
      </Text>

      <View style={styles.taskListContainer}>
        <ScrollView 
          contentContainerStyle={styles.taskList}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2A2A2A']}
              tintColor="#2A2A2A"
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#2A2A2A" style={{ marginTop: 20 }} />
          ) : tasks && tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCont
                key={task.task_id}
                task={task}
                onPress={() => navigation.navigate('Task', { taskId: task.task_id })}
              />
            ))
          ) : (
            <Text style={styles.emptyMessage}>
              {loading ? 'Загрузка...' : 'Нет заданий'}
            </Text>
          )}
        </ScrollView>
      </View>

      {/* Показываем кнопку создания только для админов и менеджеров в организации */}
      {hasOrganization && (userRole === 'Admin' || userRole === 'Manager') && (
        <TouchableOpacity 
          style={styles.fab}  
          onPress={() => navigation.navigate('CreateTask')}
        >
          <Image 
            source={require('../assets/icons/plus.png')}
            style={{width: 24, height: 24, tintColor: '#fff'}}
          />
          <Text semiBold style={styles.fabText}>Новое задание</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: StatusBar.currentHeight,
  },
  headerTitle: {
    fontSize: 33,
    color: '#2A2A2A',
  },
  bellButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6FB',
    borderRadius: 24,
  },
  bellIcon: {
    width: 28,
    height: 28,
    tintColor: '#2A2A2A',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },
  periodScrollViewContainer: {
    height: 64,
  },
  periodContainer: {
    paddingHorizontal: 24,
    gap: 8,
    paddingVertical: 8,
    height: '100%',
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F6FB',
    borderRadius: 28,
    gap: 8,
  },
  periodButtonActive: {
    backgroundColor: '#2A2A2A',
  },
  periodIcon: {
    width: 24,
    height: 24,
    tintColor: '#2A2A2A',
  },
  periodIconActive: {
    tintColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  periodTitleText: {
    fontSize: 22,
    color: '#2A2A2A',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  taskListContainer: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },
  taskList: {
    paddingHorizontal: 6, 
    paddingVertical: 6,
    gap: 6,
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
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
    marginTop: 20,
    fontFamily: 'Montserrat-Regular',
  },
});

export default HomeScreen;
