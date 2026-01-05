import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

// Agora recebe 'navigation' e 'currentRoute' vindos do App.js
export default function Sidebar({ navigation, currentRoute }) {
  
  const MenuItem = ({ icon, label, routeName }) => {
    // Comparação simples de texto
    const isActive = currentRoute === routeName;
    
    return (
      <TouchableOpacity 
        style={[styles.item, isActive && styles.activeItem]} 
        onPress={() => navigation && navigation.navigate(routeName)}
      >
        {isActive && <View style={styles.activeBar} />}
        <Ionicons name={icon} size={26} color={isActive ? '#00ff9d' : '#666'} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Ionicons name="cube" size={32} color="#00ff9d" />
      </View>

      <ScrollView contentContainerStyle={styles.menu}>
        <MenuItem icon="game-controller" label="Jogos" routeName="Início" />
        <MenuItem icon="images" label="Feed" routeName="Posts" />
        <MenuItem icon="add-circle" label="Criar" routeName="CreateSelection" />
        <MenuItem icon="search" label="Busca" routeName="Busca" />
        <MenuItem icon="person" label="Perfil" routeName="MeuPerfil" />
      </ScrollView>

      <View style={styles.footer}>
        <MenuItem icon="settings-sharp" label="Config" routeName="Settings" />
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={async () => await supabase.auth.signOut()}
        >
          <Ionicons name="log-out-outline" size={26} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 70, height: '100%', backgroundColor: '#18181b',
    borderRightWidth: 1, borderRightColor: '#27272a',
    alignItems: 'center', paddingVertical: 20,
    justifyContent: 'space-between', zIndex: 100
  },
  logoArea: { marginBottom: 30 },
  menu: { gap: 15, alignItems: 'center', width: '100%' },
  item: {
    width: 50, height: 50, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, position: 'relative', marginBottom: 5
  },
  activeItem: { backgroundColor: 'rgba(0, 255, 157, 0.05)' },
  activeBar: {
    position: 'absolute', left: -10, height: 20, width: 3,
    backgroundColor: '#00ff9d', borderRadius: 2
  },
  footer: { gap: 10, width: '100%', alignItems: 'center', marginTop: 'auto' },
  logoutBtn: {
    width: 50, height: 50, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, marginTop: 10
  }
});
