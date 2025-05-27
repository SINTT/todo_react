import React, { useState } from 'react';
import { View, Image, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/CustomText';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import RNFS from 'react-native-fs';

const MAX_SUBTASKS = 10;

interface Step1Props {
  title: string;
  setTitle: (text: string) => void;
  description: string;
  setDescription: (text: string) => void;
  subtasks: Array<{ title: string; description: string }>;
  onSubtaskChange: (idx: number, field: 'title' | 'description', value: string) => void;
  onAddSubtask: () => void;
  onRemoveSubtask: (idx: number) => void;
  styles: any; // можно типизировать более точно если нужно
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export const Step1: React.FC<Step1Props> = ({
  title,
  setTitle,
  description,
  setDescription,
  subtasks,
  onSubtaskChange,
  onAddSubtask,
  onRemoveSubtask,
  styles,
  images,
  setImages
}) => {
  const handleImagePick = async () => {
    launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0, // 0 means unlimited selection
      quality: 0.8,
    }, async (response: ImagePickerResponse) => {
      if (response.assets && response.assets.length > 0) {
        const newImages = await Promise.all(
          response.assets.map(async (asset) => {
            if (asset.uri) {
              const base64 = await RNFS.readFile(asset.uri, 'base64');
              return `data:image/jpeg;base64,${base64}`;
            }
            return null;
          })
        );
        setImages(prev => [...prev, ...newImages.filter(Boolean) as string[]]);
      }
    });
  };

  const removePhoto = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Основная задача */}
      <View style={styles.inputBlock}>
        <View style={styles.inputRow}>
          <View style={styles.inputIconRow}>
            <Image
              source={require('../../assets/icons/writing.png')}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Название задания"
              placeholderTextColor="#B7B7B7"
              maxLength={100}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <Text>{title.length}/100</Text>
        </View>

        <View style={[styles.inputRow, {borderBottomWidth: 0, alignItems: 'flex-start'}]}>
          <TextInput
            style={[styles.textInput, { maxHeight: 120 }]}
            placeholder="Описание задания"
            placeholderTextColor="#B7B7B7"
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <View>
        
        <View style={{width: '100%', alignItems: 'flex-end', padding: 20, paddingTop: 0, flexDirection: 'row', justifyContent: 'space-between'}}>
            
            <View style={{gap: 10, flexDirection: 'row', flex: 1}}>
                {images.map((image, index) => (
                  <View 
                    key={index} 
                    style={{
                      borderRadius: 8,
                      borderWidth: 1,
                      backgroundColor: '#f4f4f4',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 78,
                      width: 78,
                      overflow: 'hidden'
                    }}
                  >
                    <Image
                      source={{ uri: image }}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 12,
                        padding: 4
                      }}
                    >
                      <Image
                        source={require('../../assets/icons/close.png')}
                        style={{height: 16, width: 16, tintColor: 'white'}}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
            
            <TouchableOpacity onPress={handleImagePick}>
                <Image
                    source={require('../../assets/icons/paperclip.png')}
                    style={{height: 34, width: 34}}
                />
            </TouchableOpacity>
        </View>
        
        </View>
      </View>

      {/* Список подзадач */}
      {subtasks.map((sub, idx: number) => (
        <View key={idx} style={styles.inputBlock}>
          <View style={styles.inputRow}>
            <View style={styles.inputIconRow}>
              <Image
                source={require('../../assets/icons/Project_Management.png')}
                style={styles.inputIcon}
              />
              <Text style={{ fontWeight: 'bold', marginRight: 8 }}>{idx + 1}.</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Название подзадачи"
                placeholderTextColor="#B7B7B7"
                maxLength={100}
                value={sub.title}
                onChangeText={text => onSubtaskChange(idx, 'title', text)}
              />
            </View>
            <Text>{sub.title.length}/100</Text>
            {subtasks.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemoveSubtask(idx)}
                style={{
                  marginLeft: 10,
                  padding: 5,
                  borderRadius: 8,
                  backgroundColor: '#ffeaea',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={require('../../assets/icons/trash.png')}
                  style={{ width: 24, height: 24, tintColor: '#ff3b30' }}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.inputRow, { borderBottomWidth: 0, alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.textInput, { maxHeight: 120 }]}
              placeholder="Описание"
              placeholderTextColor="#B7B7B7"
              multiline
              value={sub.description}
              onChangeText={text => onSubtaskChange(idx, 'description', text)}
              textAlignVertical="top"
            />
          </View>
          {idx === subtasks.length - 1 && subtasks.length < MAX_SUBTASKS && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderRadius: 7.5,
                paddingHorizontal: 20,
                paddingVertical: 10,
                alignSelf: 'flex-end',
                marginRight: 20,
                marginBottom: 20,
              }}
              onPress={onAddSubtask}
            >
              <Text medium style={{ fontSize: 16, color: '#2A2A2A' }}>новая подазача</Text>
              <Image
                source={require('../../assets/icons/plus2.png')}
                style={[styles.inputIcon, { height: 18, width: 18 }]}
              />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
};
