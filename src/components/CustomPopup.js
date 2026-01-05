import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CustomPopup({ visible, title, message, type = 'info', onClose, onConfirm }) {
  const isError = type === 'error';
  const color = isError ? '#ff4444' : '#00ff9d';
  const icon = isError ? 'alert-circle' : 'checkmark-circle';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.box, { borderLeftColor: color }]}>
          <View style={styles.header}>
            <Ionicons name={icon} size={24} color={color} />
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.footer}>
            {onConfirm && (
              <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                <Text style={styles.textCancel}>Cancelar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={onConfirm || onClose} 
              style={[styles.btnOk, { backgroundColor: color }]}
            >
              <Text style={[styles.textOk, { color: isError ? 'white' : 'black' }]}>
                {onConfirm ? 'Confirmar' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  box: { width: Math.min(400, width - 40), backgroundColor: '#18181b', padding: 25, borderRadius: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  message: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 25 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { padding: 10, marginRight: 5 },
  textCancel: { color: '#888', fontWeight:'bold' },
  btnOk: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  textOk: { fontWeight: 'bold' }
});
