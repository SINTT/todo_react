import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubTask {
  subtask_id: number;
  title: string;
  description: string;
  status: string;
}

interface TaskDetails {
  task_id: number;
  task_title: string;
  task_description: string;
  status: string;
  start_date: string;
  finish_date: string;
  reward_points: number;
  subtasks: SubTask[];
  performers: Array<{
    user_id: number;
    first_name: string;
    last_name: string;
    profile_image: string | null;
  }>;
  images: string[]; // упростим тип до массива строк
  creator_first_name: string;
  creator_last_name: string;
  creator_profile_image: string | null;
}

const TaskScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState(0);

  useEffect(() => {
    loadUserData();
    fetchTaskDetails();
  }, []);

  const loadUserData = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setUserId(userData.user_id);
    }
  };

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/api/tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.task);
        checkCanStart(response.data.task);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanStart = (taskData: TaskDetails) => {
    if (!userId) return;
    const isPerformer = taskData.performers.some(p => p.user_id === userId);
    setCanStart(isPerformer && taskData.status === 'open');
  };

  const startTask = async () => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/start`);
      if (response.data.success) {
        fetchTaskDetails();
      }
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const completeSubtask = async (subtaskId: number) => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/subtasks/${subtaskId}/complete`);
      if (response.data.success) {
        fetchTaskDetails();
        // Переходим к следующей подзадаче, если есть
        if (task && currentSubtaskIndex < task.subtasks.length - 1) {
          setCurrentSubtaskIndex(currentSubtaskIndex + 1);
        }
      }
    } catch (error) {
      console.error('Error completing subtask:', error);
    }
  };

  const completeTask = async () => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/complete`);
      if (response.data.success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2A2A" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Задание не найдено</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      
      {/* Header */}
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
        <Text bold style={styles.headerTitle}>Задание</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Task Info */}
        <View style={styles.taskInfoBlock}>
          <View style={styles.taskHeader}>
            <Text semiBold style={styles.taskTitle}>{task.task_title}</Text>
            <Text style={styles.reward}>🏆 {task.reward_points}</Text>
          </View>
          
          <Text style={styles.description}>{task.task_description}</Text>
          
          {/* Images */}
          {task.images && task.images.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imagesContainer}
            >
              {task.images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.taskImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              {formatDate(task.start_date)} - {formatDate(task.finish_date)}
            </Text>
          </View>

          {/* Creator Info */}
          <View style={styles.creatorInfo}>
            <Image
              source={
                task.creator_profile_image
                  ? { uri: task.creator_profile_image }
                  : require('../assets/images/avatar.png')
              }
              style={styles.creatorAvatar}
            />
            <Text style={styles.creatorName}>
              {task.creator_first_name} {task.creator_last_name}
            </Text>
          </View>
        </View>

        {/* Subtasks */}
        <View style={styles.subtasksBlock}>
          <Text semiBold style={styles.blockTitle}>Подзадачи:</Text>
          {task.subtasks.map((subtask, index) => (
            <View 
              key={subtask.subtask_id} 
              style={[
                styles.subtaskItem,
                subtask.status === 'completed' && styles.subtaskCompleted,
                index === currentSubtaskIndex && task.status === 'in_progress' && styles.subtaskCurrent
              ]}
            >
              <View style={styles.subtaskHeader}>
                <Text semiBold style={styles.subtaskTitle}>{subtask.title}</Text>
                {subtask.status === 'completed' && (
                  <Image
                    source={require('../assets/icons/plus2.png')}
                    style={styles.checkIcon}
                  />
                )}
              </View>
              <Text style={styles.subtaskDescription}>{subtask.description}</Text>
              {index === currentSubtaskIndex && 
               task.status === 'in_progress' && 
               subtask.status !== 'completed' && (
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => completeSubtask(subtask.subtask_id)}
                >
                  <Text style={styles.completeButtonText}>Завершить подзадачу</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        {canStart && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={startTask}
          >
            <Text semiBold style={styles.actionButtonText}>Начать выполнение</Text>
          </TouchableOpacity>
        )}

        {task.status === 'in_progress' && 
         currentSubtaskIndex === task.subtasks.length - 1 &&
         task.subtasks[currentSubtaskIndex].status === 'completed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeTaskButton]}
            onPress={completeTask}
          >
            <Text semiBold style={styles.actionButtonText}>Завершить задание</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    padding: 24,
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    width: 54,
    height: 54,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 54,
    height: 54,
    tintColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 24,
    color: '#2A2A2A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  taskInfoBlock: {
    backgroundColor: '#F3F6FB',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 20,
    flex: 1,
  },
  reward: {
    fontSize: 18,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 15,
  },
  imagesContainer: {
    marginBottom: 15,
  },
  taskImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  dateInfo: {
    marginBottom: 15,
  },
  dateText: {
    color: '#666666',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  creatorName: {
    color: '#666666',
  },
  subtasksBlock: {
    backgroundColor: '#F3F6FB',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },
  blockTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  subtaskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  subtaskCompleted: {
    backgroundColor: '#E8F5E9',
  },
  subtaskCurrent: {
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subtaskTitle: {
    fontSize: 16,
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: '#4CAF50',
  },
  subtaskDescription: {
    color: '#666666',
  },
  actionButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeTaskButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default TaskScreen;