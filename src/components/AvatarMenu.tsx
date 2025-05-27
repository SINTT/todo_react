import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Text } from './CustomText';

interface AvatarMenuProps {
  visible: boolean;
  onClose: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onLogoutPress: () => void;
  avatarPosition: { x: number; y: number };
}

const AvatarMenu = ({ visible, onClose, onProfilePress, onSettingsPress, onLogoutPress, avatarPosition }: AvatarMenuProps) => {
  const handleLogout = () => {
    Alert.alert(
      'Выход из профиля',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive',
          onPress: onLogoutPress
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[
          styles.menu,
          {
            position: 'absolute',
            top: avatarPosition.y + 55, // 55 - это высота аватарки + отступ
            right: 24,
          }
        ]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={onProfilePress}
          >
            <Text style={styles.menuText}>Мой профиль</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={onSettingsPress}
          >
            <Text style={styles.menuText}>Настройки</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Text style={[styles.menuText, styles.logoutText]}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  logoutText: {
    color: '#FF3B30',
  },
});

export default AvatarMenu;
