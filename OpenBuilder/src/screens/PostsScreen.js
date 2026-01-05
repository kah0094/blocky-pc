import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, Dimensions, StatusBar } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RoleBadge from '../components/RoleBadge'; // <--- Importou

const { width } = Dimensions.get('window');
const SPACING = 12;
const ITEM_WIDTH = (width - (SPACING * 3)) / 2;

export default function PostsScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url, role)') // <--- Pegar Role
      .order('created_at', { ascending: false });
    if (!error) setPosts(data);
    setRefreshing(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const renderItem = ({ item, index }) => {
    const height = index % 3 === 0 ? 250 : 200; 

    return (
      <TouchableOpacity 
        style={[styles.card, { height }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetail', { post: item })}
      >
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/300' }} 
          style={styles.image} 
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <Text style={styles.title} numberOfLines={2}>{item.title || 'Sem Título'}</Text>
          <View style={styles.statsRow}>
             <Ionicons name="heart" size={12} color="#ff4444" />
             <Text style={styles.likes}>{item.likes_count || 0}</Text>
          </View>
        </LinearGradient>

        <View style={styles.authorPill}>
           <Image source={{ uri: item.profiles?.avatar_url }} style={styles.avatar} />
           <Text style={styles.username} numberOfLines={1}>{item.profiles?.username}</Text>
           {/* ÍCONE DE CARGO AQUI */}
           <RoleBadge role={item.profiles?.role} size={12} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar</Text>
        <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchPosts()}} tintColor="#00ff9d" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  iconBtn: { backgroundColor: '#1a1a1a', padding: 10, borderRadius: 12 },
  
  listContent: { paddingHorizontal: SPACING, paddingBottom: 100 },
  
  card: { 
    width: ITEM_WIDTH, 
    borderRadius: 24,
    backgroundColor: '#1a1a1a', 
    marginBottom: SPACING,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#222'
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  gradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 12
  },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likes: { color: '#ddd', fontSize: 12, fontWeight: 'bold' },

  authorPill: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  avatar: { width: 16, height: 16, borderRadius: 8, marginRight: 6 },
  username: { color: '#fff', fontSize: 10, fontWeight: 'bold', maxWidth: 80 }
});
