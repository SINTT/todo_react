import React from 'react';
import { Modal, TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

interface ImageViewerModalProps {
  images: string[];
  visible: boolean;
  initialIndex: number;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  visible,
  initialIndex,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent={true}>
      <ImageViewer
        imageUrls={images.map(url => ({ url }))}
        index={initialIndex}
        enableSwipeDown
        onSwipeDown={onClose}
        enablePreload
        saveToLocalByLongPress={false}
        renderHeader={() => (
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Image
              source={require('../assets/icons/close.png')}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        )}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 999,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
});
