import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Text } from './CustomText';
import { Calendar } from 'react-native-calendars';

import TaskCont from './TaskCont';

type DatePickerProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (dates: { start?: string; end?: string }) => void;
  mode: 'single' | 'period';
};

const DatePicker = ({ isVisible, onClose, onSelect, mode }: DatePickerProps) => {
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const handleDayPress = (day: { dateString: string }) => {
    if (mode === 'single') {
      onSelect({ start: day.dateString });
      onClose();
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(day.dateString);
        setEndDate(undefined);
      } else {
        setEndDate(day.dateString);
        onSelect({ start: startDate, end: day.dateString });
        onClose();
      }
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (startDate && endDate) {
      // Convert dates to timestamps
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      for (let time = start; time <= end; time += 24 * 60 * 60 * 1000) {
        const dateString = new Date(time).toISOString().split('T')[0];
        
        if (dateString === startDate) {
          marked[dateString] = {
            startingDay: true,
            color: '#2A2A2A',
            textColor: '#FFFFFF'
          };
        } else if (dateString === endDate) {
          marked[dateString] = {
            endingDay: true,
            color: '#2A2A2A',
            textColor: '#FFFFFF'
          };
        } else {
          marked[dateString] = {
            color: '#2A2A2A',
            textColor: '#FFFFFF'
          };
        }
      }
    } else if (startDate) {
      marked[startDate] = {
        selected: true,
        selectedColor: '#2A2A2A',
        textColor: '#FFFFFF'
      };
    }
    
    return marked;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={getMarkedDates()}
            markingType={startDate && endDate ? "period" : "dot"}
            theme={{
              selectedDayBackgroundColor: '#2A2A2A',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#2A2A2A',
              textDayFontFamily: 'Montserrat-Regular',
              textMonthFontFamily: 'Montserrat-SemiBold',
              textDayHeaderFontFamily: 'Montserrat-SemiBold',
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text semiBold style={styles.closeButtonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3F6FB',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#2A2A2A',
    fontSize: 16,
  },
});

export default DatePicker;
