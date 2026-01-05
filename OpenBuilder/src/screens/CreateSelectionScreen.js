import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CreateSelectionScreen({ navigation }) {
  
  const handleCreateGame = () => {
    Alert.alert("Versão PC", "Use a versão Desktop para criar jogos complexos.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Criar</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#2a2a2a' }]} activeOpacity={0.8} onPress={handleCreateGame}>
          <View style={[styles.iconCircle, {backgroundColor: '#444'}]}><Ionicons name="desktop-outline" size={32} color="#ccc" /></View>
          <View style={styles.textContainer}>
            <Text style={[styles.cardTitle, {color:'#ccc'}]}>Criar Jogo (PC)</Text>
            <Text style={styles.cardDesc}>Engine completa no Desktop.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#6200ee' }]} 
          activeOpacity={0.8}
          onPress={() => {
            navigation.goBack();
            navigation.navigate('CreatePost');
          }}
        >
          <View style={styles.iconCircle}><Ionicons name="newspaper" size={32} color="#6200ee" /></View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Novo Post</Text>
            <Text style={styles.cardDesc}>Compartilhe novidades.</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  header: { position: 'absolute', top: 50, left: 20, right: 20 },
  closeBtn: { alignSelf: 'flex-end', padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  content: { paddingHorizontal: 20, gap: 20 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, height: 110, elevation: 5 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cardDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12 }
});
