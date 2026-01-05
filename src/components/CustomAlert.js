import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomAlert({ visible, title, message, onClose, type='info' }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, type === 'error' && styles.boxError]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btn}>
            <Text style={styles.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center' },
  box: { width: width*0.8, backgroundColor:'#1e1e1e', borderRadius:12, padding:20, borderLeftWidth:4, borderLeftColor:'#6200ee' },
  boxError: { borderLeftColor:'#ff4444' },
  title: { color:'#fff', fontSize:18, fontWeight:'bold', marginBottom:10 },
  msg: { color:'#ccc', marginBottom:20 },
  btn: { alignSelf:'flex-end', padding:10 },
  btnText: { color:'#fff', fontWeight:'bold' }
});
