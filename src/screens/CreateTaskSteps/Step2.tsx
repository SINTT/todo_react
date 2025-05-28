import React, { useState, useEffect } from 'react';
import { View, Image, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/CustomText';
import { Calendar } from 'react-native-calendars';
import { api } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash/debounce';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  post_name: string | null;
}

interface Step2Props {
  styles: any;
  onEditReward: () => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  selectedUsers: User[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const Step2: React.FC<Step2Props> = ({ 
  styles, 
  onEditReward,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedUsers,
  setSelectedUsers
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    loadOrgId();
  }, []);

  const loadOrgId = async () => {
    const userDataStr = await AsyncStorage.getItem('userToken');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      setOrgId(userData.organization_id);
    }
  };

  const searchUsers = debounce(async (query: string) => {
    if (!query.trim() || !orgId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/organizations/${orgId}/members/search?query=${query}`);
      
      if (response.data.success) {
        // Фильтруем уже выбранных пользователей
        const filteredResults = response.data.users.filter(
          (user: User) => !selectedUsers.some(selected => selected.user_id === user.user_id)
        );
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearch = (text: string) => {
    setSearchText(text);
    searchUsers(text);
  };

  const addUser = (user: User) => {
    setSelectedUsers((prev: User[]) => [...prev, user]);
    setSearchResults((prev: User[]) => prev.filter(u => u.user_id !== user.user_id));
    setSearchText('');
  };

  const removeUser = (userId: number) => {
    setSelectedUsers((prev: User[]) => prev.filter(user => user.user_id !== userId));
  };

  const handleDayPress = (day: { dateString: string }) => {
    const selectedDate = new Date(day.dateString);
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else {
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        setEndDate(startDate);
        setStartDate(selectedDate);
      }
    }
  };

  const getMarkedDates = () => {
    if (!startDate) return {};

    const marked: any = {};
    const start = startDate.toISOString().split('T')[0];
    marked[start] = {
      startingDay: true,
      color: '#00D87F',
      textColor: '#FFFFFF'
    };

    if (endDate) {
      const end = endDate.toISOString().split('T')[0];
      marked[end] = {
        endingDay: true,
        color: '#00D87F',
        textColor: '#FFFFFF'
      };

      // Mark days between start and end
      let current = new Date(startDate);
      while (current < endDate) {
        current.setDate(current.getDate() + 1);
        const dateString = current.toISOString().split('T')[0];
        if (dateString !== end) {
          marked[dateString] = {
            color: '#00D87F',
            textColor: '#FFFFFF'
          };
        }
      }
    }
    
    return marked;
  };

  return (
    <ScrollView 
      style={{flex: 1}} 
      contentContainerStyle={{gap: 20, paddingBottom: 20}}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inputBlock}>
        <View style={styles.inputRow}>
          <View style={styles.inputIconRow}>
            <Image
              source={require('../../assets/icons/user_search.png')}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Имя пользователя"
              placeholderTextColor="#B7B7B7"
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
        </View>
        <View style={[styles.inputRow, {borderBottomWidth: 0, alignItems: 'flex-start', padding: 10}]}>
          {searchText ? (
            <ScrollView style={{width: '100%'}} contentContainerStyle={{gap: 10}}>
              {searchResults.map(user => (
                <View 
                  key={user.user_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: 'white',
                    padding: 10,
                    borderRadius: 16,
                    width: '100%'
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image
                      source={
                        user.profile_image 
                          ? { uri: user.profile_image }
                          : require('../../assets/images/avatar.png')
                      }
                      style={{width: 54, height: 54, borderRadius: 27}}
                    />
                    <View>
                      <Text semiBold style={{fontSize: 16}}>{user.first_name} {user.last_name}</Text>
                      <Text style={{fontSize: 14, color: '#9C9C9C'}}>{user.post_name || 'Нет должности'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => addUser(user)}
                    style={{
                      padding: 10,
                      backgroundColor: '#f0f0f0',
                      borderRadius: 12,
                    }}
                  >
                    <Image
                      source={require('../../assets/icons/plus.png')}
                      style={{ width: 24, height: 24, tintColor: '#2A2A2A' }}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : selectedUsers.length > 0 ? (
            <ScrollView style={{width: '100%'}} contentContainerStyle={{gap: 10}}>
              {selectedUsers.map(user => (
                <View 
                  key={user.user_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: 'white',
                    padding: 10,
                    borderRadius: 16,
                    width: '100%'
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image
                      source={
                        user.profile_image 
                          ? { uri: user.profile_image }
                          : require('../../assets/images/avatar.png')
                      }
                      style={{width: 54, height: 54, borderRadius: 27}}
                    />
                    <View>
                      <Text semiBold style={{fontSize: 16}}>{user.first_name} {user.last_name}</Text>
                      <Text style={{fontSize: 14, color: '#9C9C9C'}}>{user.post_name || 'Нет должности'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeUser(user.user_id)}
                    style={{
                      padding: 10,
                      backgroundColor: '#ffeaea',
                      borderRadius: 12,
                    }}
                  >
                    <Image
                      source={require('../../assets/icons/trash.png')}
                      style={{ width: 24, height: 24, tintColor: '#ff3b30' }}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{fontSize: 16, margin: 10}}>Пользователи еще не выбраны</Text>
          )}
        </View>
      </View>

      <View style={[styles.inputBlock, {borderRadius: 25, overflow: 'hidden'}]}>
        <View style={[styles.inputRow, {borderRadius: 0}]}>
          <View style={styles.inputIconRow}>
            <Image
              source={require('../../assets/icons/calendar-today.png')}
              style={styles.inputIcon}
            />
            <Text semiBold style={{fontSize: 16}}>Период выполнения</Text>
          </View>
        </View>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={getMarkedDates()}
          markingType={startDate && endDate ? "period" : "dot"}
          theme={{
            selectedDayBackgroundColor: '#00D87F',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#2A2A2A',
            textDayFontFamily: 'Montserrat-Regular',
            textMonthFontFamily: 'Montserrat-SemiBold',
            textDayHeaderFontFamily: 'Montserrat-SemiBold',
            calendarBackground: '#F4F4F4',
          }}
        />
      </View>



      <View style={styles.inputBlock}>
        <View style={styles.inputRow}>
          <View style={styles.inputIconRow}>
            <Image
              source={require('../../assets/icons/medal.png')}
              style={styles.inputIcon}
            />
            <Text semiBold style={{fontSize: 16}}>Награда за выполнение</Text>
          </View>
        </View>
  
        <View style={[styles.inputRow, {borderBottomWidth: 0, alignItems: 'flex-start'}]}>
          <TouchableOpacity
            onPress={onEditReward}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderWidth: 1,
              borderRadius: 7.5,
              paddingHorizontal: 20,
              height: 54,
              alignSelf: 'flex-end',
              marginRight: 20,
            }}
          >
            <Text medium style={{ fontSize: 16, color: '#2A2A2A' }}>Редактировать</Text>
          </TouchableOpacity>

          <View style={{flex: 1, height: 54, alignItems: 'center', justifyContent: 'center'}}>
            <Text semiBold style={{ fontSize: 24, color: '#2A2A2A'}}>250 🏆</Text>
          </View>
        </View>
      </View>
      
    </ScrollView>
  );
};
