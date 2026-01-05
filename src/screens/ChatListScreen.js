import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import RoleBadge from '../components/RoleBadge';

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const fetchChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca salas onde sou A ou B
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id, 
        user_a, 
        user_b
      `)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

    if (error) { setLoading(false); return; }

    // Formata para pegar os dados do "outro" usuário
    const formattedChats = await Promise.all(data.map(async (room) => {
        const otherUserId = room.user_a === user.id ? room.user_b : room.user_a;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
        return { ...room, otherUser: profile };
    }));

    setChats(formattedChats);
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Chat', { roomId: item.id, user: item.otherUser })}
    >
      <Image source={{ uri: item.otherUser?.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={styles.info}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={styles.username}>{item.otherUser?.username}</Text>
            <RoleBadge role={item.otherUser?.role} />
        </View>
        <Text style={styles.subtext}>Toque para conversar</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Mensagens</Text>
        <View style={{width:24}}/>
      </View>

      {loading ? <ActivityIndicator color="#6200ee" style={{marginTop:20}} /> : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma conversa iniciada.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { flexDirection: 'row', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#111' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  info: { flex: 1 },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subtext: { color: '#666', fontSize: 13 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 }
});
