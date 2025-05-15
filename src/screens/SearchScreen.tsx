import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, StatusBar, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '../components/CustomText';
import { api } from '../config/api';

type SearchFilter = 'all' | 'users' | 'organizations';

const SearchScreen = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string, currentFilter: SearchFilter = filter) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/api/search`, {
        params: {
          query,
          filter: currentFilter
        }
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: SearchFilter) => {
    setFilter(newFilter);
    // Передаем новый фильтр напрямую в handleSearch
    if (searchQuery.length >= 2) {
      handleSearch(searchQuery, newFilter);
    }
  };

  const renderUserItem = (user: any) => (
    <TouchableOpacity 
      key={user.user_id}
      style={styles.resultItem}
      onPress={() => navigation.navigate(user.is_self ? 'Profile' : 'OtherProfile', { 
        userId: user.user_id 
      })}
    >
      <Image
        source={user.profile_image ? { uri: user.profile_image } : require('../assets/images/avatar.png')}
        style={styles.avatarImage}
      />
      <View style={styles.userInfo}>
        <Text semiBold style={styles.userName}>
          {`${user.first_name} ${user.last_name}`}
        </Text>
        <Text style={styles.userRole}>
          {user.post_name || 'Нет специальности'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrganizationItem = (org: any) => (
    <TouchableOpacity 
      key={org.organization_id}
      style={styles.resultItem}
      onPress={() => navigation.navigate('OrganizationProfile', { 
        orgId: org.organization_id 
      })}
    >
      <Image
        source={org.organization_image ? { uri: org.organization_image } : require('../assets/images/avatar.png')}
        style={styles.avatarImage}
      />
      <View style={styles.userInfo}>
        <Text semiBold style={styles.userName}>{org.organization_name}</Text>
        <Text style={styles.userRole}>{org.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="gray" />
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Image
            source={require('../assets/tab_icons/search_ico.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'users', 'organizations'] as SearchFilter[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
            onPress={() => handleFilterChange(filterType)}
          >
            <Text 
              semiBold 
              style={[styles.filterText, filter === filterType && styles.filterTextActive]}
            >
              {filterType === 'all' ? 'Все' : 
               filterType === 'users' ? 'Пользователи' : 'Организации'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#2A2A2A" />
      ) : (
        <ScrollView style={styles.resultsList}>
          {results.map((item) => (
            item.user_id ? renderUserItem(item) : renderOrganizationItem(item)
          ))}
          {searchQuery.length >= 2 && results.length === 0 && (
            <Text style={styles.noResults}>Ничего не найдено</Text>
          )}
        </ScrollView>
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
    backgroundColor: '#F3F6FB',
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: StatusBar.currentHeight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  searchIcon: {
    width: 24,
    height: 24,
    tintColor: '#666666',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2A2A2A',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F6FB',
  },
  filterButtonActive: {
    backgroundColor: '#2A2A2A',
  },
  filterText: {
    color: '#2A2A2A',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  resultsList: {
    flex: 1,
    padding: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F6FB',
    borderRadius: 16,
    marginBottom: 8,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    color: '#2A2A2A',
  },
  userRole: {
    fontSize: 14,
    color: '#666666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    textAlign: 'center',
    color: '#666666',
    marginTop: 24,
  },
});

export default SearchScreen;
