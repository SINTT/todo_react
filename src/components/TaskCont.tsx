import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from './CustomText';

interface TaskProps {
  task: {
    task_id: number;
    task_title: string;
    task_description: string;
    status: string;
    start_date: string;
    finish_date: string;
    reward_points: number;
    performers: Array<{
      user_id: number;
      first_name: string;
      last_name: string;
      profile_image: string | null;
    }>;
    creator_first_name: string;
    creator_last_name: string;
    creator_profile_image: string | null;
    subtasks: Array<{ status: string }>;
  };
  onPress: () => void;
}

const TaskCont: React.FC<TaskProps> = ({ task, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const completedSubtasks = task.subtasks.filter(st => st.status === 'completed').length;
  const totalSubtasks = task.subtasks.length;
  const isCompleted = task.status === 'completed';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted && styles.completedContainer
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.creatorInfo}>
          <Image
            source={
              task.creator_profile_image
                ? { uri: task.creator_profile_image }
                : require('../assets/images/avatar.jpg')
            }
            style={styles.creatorAvatar}
          />
          <Text semiBold style={styles.creatorName}>
            {`${task.creator_first_name} ${task.creator_last_name}`}
          </Text>
        </View>
        <Text style={[styles.reward, isCompleted && styles.completedText]}>
          🏆 {task.reward_points}
        </Text>
      </View>

      <Text semiBold style={[styles.title, isCompleted && styles.completedText]}>{task.task_title}</Text>
      <Text style={styles.description}>{task.task_description}</Text>

      <View style={styles.progressContainer}>
        <Text 
          style={[
            styles.progressText,
            isCompleted && styles.completedText
          ]}
        >
          {isCompleted 
            ? 'Завершено' 
            : `Выполнено ${completedSubtasks} из ${totalSubtasks}`
          }
        </Text>
        {!isCompleted && (
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(completedSubtasks / totalSubtasks) * 100}%` }
              ]} 
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.dates}>
          {formatDate(task.start_date)} - {formatDate(task.finish_date)}
        </Text>
        <View style={styles.performers}>
          {task.performers.slice(0, 3).map((performer, index) => (
            <Image
              key={performer.user_id}
              source={
                performer.profile_image
                  ? { uri: performer.profile_image }
                  : require('../assets/images/avatar.jpg')
              }
              style={[
                styles.performerAvatar,
                { marginLeft: index > 0 ? -10 : 0 }
              ]}
            />
          ))}
          {task.performers.length > 3 && (
            <View style={[styles.performerAvatar, styles.performerCounter]}>
              <Text style={styles.counterText}>+{task.performers.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    gap: 10,
  },
  completedContainer: {
    backgroundColor: '#E8F5E9',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  creatorName: {
    fontSize: 14,
    color: '#666666',
  },
  reward: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    color: '#2A2A2A',
  },
  completedText: {
    color: '#4CAF50',
  },
  description: {
    fontSize: 14,
    color: '#666666',
  },
  progressContainer: {
    gap: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F3F6FB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  dates: {
    fontSize: 12,
    color: '#666666',
  },
  performers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  performerCounter: {
    backgroundColor: '#F3F6FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 12,
    color: '#666666',
  },
});

export default TaskCont;