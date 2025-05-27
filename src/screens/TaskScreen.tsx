import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, Switch, Alert } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageViewerModal } from '../components/ImageViewer';

interface SubTask {
  subtask_id: number;
  title: string;
  description: string;
  status: string;
  created_at: string; // Add this for sorting
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
  task_creater_id: number; // Add this property
}

const TaskScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [currentSubtaskIndex, setCurrentSubtaskIndex] = useState<number | null>(null);
  const [allSubtasksCompleted, setAllSubtasksCompleted] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTaskDetails();
    }
  }, [userId]);

  useEffect(() => {
    if (task) {
      // Check if all subtasks are completed
      const completed = task.subtasks.every(st => st.status === 'completed');
      setAllSubtasksCompleted(completed);

      // Find first incomplete subtask
      const firstIncompleteIndex = task.subtasks.findIndex(st => st.status !== 'completed');
      setCurrentSubtaskIndex(firstIncompleteIndex === -1 ? null : firstIncompleteIndex);
    }
  }, [task]);

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
        setIsCreator(response.data.task.task_creater_id === userId);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Replace checkCanStart function
  const checkCanStart = (taskData: TaskDetails) => {
    if (!userId) return;
    const isPerformer = taskData.performers.some(p => p.user_id === userId);
    const canStartTask = isPerformer && taskData.status === 'open';
    setCanStart(canStartTask);
  };

  // Replace toggleSubtask function
  const toggleSubtask = async (subtaskId: number, newStatus: string) => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
        status: newStatus
      });
      
      if (response.data.success) {
        await fetchTaskDetails();
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  // Replace completeTask function
  const completeTask = async () => {
    if (!allSubtasksCompleted) {
      // Show error message
      return;
    }

    try {
      const response = await api.post(`/api/tasks/${taskId}/complete`);
      if (response.data.success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const startTask = async () => {
    try {
      const response = await api.post(`/api/tasks/${taskId}/start`);
      if (response.data.success) {
        await fetchTaskDetails();
      }
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const deleteTask = async () => {
    Alert.alert(
      "Подтверждение",
      "Вы уверены, что хотите удалить это задание?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete(`/api/tasks/${taskId}`);
              if (response.data.success) {
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
            }
          }
        }
      ]
    );
  };

  // Add sorted subtasks getter
  const getSortedSubtasks = () => {
    if (!task) return [];
    return [...task.subtasks].sort((a, b) => a.subtask_id - b.subtask_id);
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

  const getStatusText = (status: string) => {
  switch (status) {
    case 'open':
      return 'Открыто';
    case 'in_progress':
      return 'В процессе';
    case 'completed':
      return 'Завершено';
    default:
      return 'Неизвестно';
  };
};

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

        <View style={styles.backButton}/>
      </View>

      

      <ScrollView style={styles.content}>

        <View style={{flexDirection: 'row', alignItems: 'center', paddingBottom: 10, gap: 10}}>
          {/* Creator Info */}
          <View style={{flexDirection: 'row', alignItems: 'center', padding: 10, paddingRight: 15, gap: 10, backgroundColor: 'white', borderRadius: 150, height: 56}}>
            <Image
              source={
                task.creator_profile_image
                  ? { uri: task.creator_profile_image }
                  : require('../assets/images/avatar.jpg')
              }
              style={styles.creatorAvatar}
            />
            <Text medium style={{fontSize: 16, color: '#2A2A2A'}}>
              {task.creator_first_name} {task.creator_last_name}
            </Text>
          </View>

          <View style={{alignItems: 'center', justifyContent: 'center', padding: 10, paddingRight: 15, backgroundColor: 'white', borderRadius: 150, height: 56}}>
            <Text semiBold style={styles.reward}>🏆 {task.reward_points}</Text>
          </View>

          <View style={{flex: 1, alignItems: 'flex-end'}}>
            {isCreator && task.status !== 'completed' && (
              <TouchableOpacity 
                style={[{height: 56, width: 56, backgroundColor: 'gray', borderRadius: 30, alignItems: 'center', justifyContent: 'center'}, {backgroundColor: '#2A2A2A'}]}
                onPress={deleteTask}
              >
                <Image
                  source={require('../assets/icons/trash.png')}
                  style={{ width: 24, height: 24, tintColor: '#FFFFFF' }}
                />
              </TouchableOpacity>
            )}
          </View>

        </View>
        {/* Task Info */}
        <View style={styles.taskInfoBlock}>
          <View style={styles.taskHeader}>
            <Text semiBold style={styles.taskTitle}>{task.task_title}</Text>
          </View>
          
          <Text style={styles.description}>{task.task_description}</Text>
          
          {/* Images */}
          {task.images && task.images.length > 0 && (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
              >
                {task.images.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setSelectedImageIndex(index);
                      setImageViewerVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.taskImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ImageViewerModal
                images={task.images}
                visible={imageViewerVisible}
                initialIndex={selectedImageIndex}
                onClose={() => setImageViewerVisible(false)}
              />
            </>
          )}

          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center'}}>
            <View style={{borderWidth: 1, borderRadius: 25, height: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15}}>
              <Text style={{}}>
                {formatDate(task.start_date)} - {formatDate(task.finish_date)}
              </Text>
            </View>

            <View style={{
              backgroundColor: task.status === 'completed' ? '#E8F5E9' : '#F5F5F5',
              borderRadius: 25,
              height: 34, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15
            }}>
              <Text medium style={{
                color: task.status === 'completed' ? '#4CAF50' : '#2A2A2A'
              }}>
                {getStatusText(task.status)}
              </Text>
            </View>
          </View>

        </View>

        {/* Performers Section */}
        <View style={styles.performersBlock}>
          <Text semiBold style={{fontSize: 14, opacity: 0.8, marginBottom: 10}}>Исполнители:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {task.performers
              .filter(performer => performer.user_id !== task.task_creater_id) // Exclude the creator
              .map((performer, index) => (
                <View key={index} style={styles.performerItemHorizontal}>
                  <Image
                    source={
                      performer.profile_image
                        ? { uri: performer.profile_image }
                        : require('../assets/images/avatar.png')
                    }
                    style={styles.performerAvatar}
                  />
                  <Text medium style={styles.performerNameHorizontal}>
                    {performer.first_name} {performer.last_name}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>

        {/* Subtasks Section */}
        {getSortedSubtasks().map((subtask, index) => (
          <View
            key={subtask.subtask_id}
            style={[
              styles.subtaskItem,
              subtask.status === 'completed' && styles.subtaskCompleted,
              index === currentSubtaskIndex && task.status === 'in_progress' && styles.subtaskCurrent,
            ]}
          >
            <View style={styles.subtaskHeader}>
              <Text semiBold style={styles.subtaskTitle}>
                {index + 1}. {subtask.title}
              </Text>
              {task.status === 'in_progress' && (
                <Switch
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={subtask.status === 'completed' ? '#4CAF50' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={() =>
                    toggleSubtask(
                      subtask.subtask_id,
                      subtask.status === 'completed' ? 'pending' : 'completed'
                    )
                  }
                  value={subtask.status === 'completed'}
                />
              )}
            </View>
            <Text style={styles.subtaskDescription}>{subtask.description}</Text>
          </View>
        ))}


        {/* Action Buttons */}
        {canStart && task.status === 'open' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={startTask}
          >
            <Text semiBold style={styles.actionButtonText}>Начать выполнение</Text>
          </TouchableOpacity>
        )}

        {task.status === 'in_progress' && (
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.completeTaskButton,
              !allSubtasksCompleted && styles.actionButtonDisabled
            ]}
            onPress={completeTask}
            disabled={!allSubtasksCompleted}
          >
            <Text semiBold style={styles.actionButtonText}>
              {allSubtasksCompleted 
                ? 'Завершить задание' 
                : 'Завершите все подзадачи'}
            </Text>
          </TouchableOpacity>
        )}

      
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    height: 78,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    marginTop: StatusBar.currentHeight,
  },
  backButton: {
    width: 54,
    height: 54,
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
    padding: 10,
    backgroundColor: '#EDEDED'
  },
  taskInfoBlock: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20, // Changed from 20 to 10
    marginBottom: 10, // Changed from 20 to 10
    gap: 10,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  taskImage: {
    width: 200,
    height: 150,
    borderRadius: 14,
    marginRight: 10,
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
  subtasksBlock: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20, // Changed from 20 to 10
    marginBottom: 10, // Changed from 20 to 10
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
    flex: 1,
    marginRight: 10,
  },
  subtaskDescription: {
    color: '#666666',
  },
  actionButton: {
    height: 64,
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40, // Changed from 20 to 10
  },
  completeTaskButton: {
    backgroundColor: '#2A2A2A',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#999',
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
  performersBlock: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 10,
  },
  performerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performerItemHorizontal: {
    alignItems: 'center',
    marginRight: 15,
  },
  performerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  performerName: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  performerNameHorizontal: {
    fontSize: 14,
    color: '#2A2A2A',
    marginTop: 5,
  },
});

export default TaskScreen;