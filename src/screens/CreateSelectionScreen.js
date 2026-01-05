import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreateSelectionScreen({ navigation }) {
  
  const handleDownload = () => {
      // Link do arquivo .exe ou .zip hospedado (Ex: GitHub Releases)
      const link = "https://github.com/SeuUsuario/OpenBuilder/releases/download/v1/engine.exe";
      
      if(Platform.OS === 'web') {
          window.open(link, '_blank');
      } else {
          Linking.openURL(link);
      }
  };

  return (
    <View style={styles.container}>
      {/* Botão de Fechar discreto */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
         <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>CRIATIVO</Text>

      <View style={styles.grid}>
          {/* CARTÃO DE POST */}
          <TouchableOpacity 
             style={styles.card} 
             activeOpacity={0.9} 
             onPress={() => navigation.replace('CreatePost')} // Replace evita pilha dupla
          >
             <LinearGradient colors={['#1a1a1a', '#000']} style={styles.cardBg} />
             <View style={[styles.iconBox, {backgroundColor: '#00ff9d'}]}>
                <Ionicons name="newspaper" size={32} color="#000" />
             </View>
             <Text style={styles.cardTitle}>Novo Post</Text>
             <Text style={styles.cardDesc}>Imagens, atualizações e devlogs.</Text>
          </TouchableOpacity>

          {/* CARTÃO DA ENGINE */}
          <TouchableOpacity 
             style={styles.card} 
             activeOpacity={0.9} 
             onPress={handleDownload}
          >
             <LinearGradient colors={['#2a0040', '#000']} style={styles.cardBg} />
             <View style={[styles.iconBox, {backgroundColor: '#9e75ff'}]}>
                <Ionicons name="cube" size={32} color="#fff" />
             </View>
             <Text style={styles.cardTitle}>OpenBuild Engine</Text>
             <Text style={styles.cardDesc}>Software PC para criar jogos avançados.</Text>
             <View style={styles.badge}><Text style={styles.badgeText}>PC Only</Text></View>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 40, right: 40, padding: 10, borderRadius: 20, backgroundColor: '#222' },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 50, letterSpacing: 2 },
  grid: { flexDirection: 'row', gap: 30, flexWrap: 'wrap', justifyContent: 'center' },
  
  card: { 
    width: 250, height: 300, borderRadius: 24, padding: 25, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333', overflow: 'hidden'
  },
  cardBg: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  
  iconBox: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  cardTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  cardDesc: { color: '#888', textAlign: 'center', marginTop: 10 },
  badge: { marginTop: 15, backgroundColor: '#333', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});
