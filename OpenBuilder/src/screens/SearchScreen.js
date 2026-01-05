import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import RoleBadge from '../components/RoleBadge';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('USERS'); 

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);

    try {
      if (tab === 'USERS') {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${query}%`); // Case insensitive search
        setResults(data || []);
      } else {
        const { data } = await supabase
            .from('posts')
            .select('*, profiles(*)')
            .ilike('title', `%${query}%`);
        setResults(data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput 
            style={styles.input} 
            placeholder={tab === 'USERS' ? "Buscar pessoas..." : "Buscar posts..."} 
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
        />
        {query.length > 0 && (
            <TouchableOpacity onPress={() => {setQuery(''); setResults([])}}>
                <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'USERS' && styles.activeTab]} onPress={() => {setTab('USERS'); setResults([]);}}>
            <Text style={[styles.tabText, tab === 'USERS' && {color:'#fff'}]}>Pessoas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'POSTS' && styles.activeTab]} onPress={() => {setTab('POSTS'); setResults([]);}}>
            <Text style={[styles.tabText, tab === 'POSTS' && {color:'#fff'}]}>Posts</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop:20}} color="#6200ee" />
      ) : (
        <FlatList
            data={results}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{padding: 10}}
            ListEmptyComponent={query.length > 0 && !loading && <Text style={styles.empty}>Nenhum resultado.</Text>}
            renderItem={({ item }) => {
                if (tab === 'USERS') {
                    return (
                        <TouchableOpacity style={styles.userCard} onPress={() => navigation.navigate('Profile', { userId: item.id })}>
                            <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                            <View>
                                <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <Text style={styles.username}>{item.username}</Text>
                                    <RoleBadge role={item.role} />
                                </View>
                                <Text style={styles.subtext}>Ver perfil</Text>
                            </View>
                        </TouchableOpacity>
                    );
                } else {
                    return (
                        <TouchableOpacity style={styles.postCard} onPress={() => navigation.navigate('PostDetail', { post: item })}>
                           <Image source={{ uri: item.image_url }} style={styles.postThumb} />
                           <View style={{flex:1, padding:10, justifyContent:'center'}}>
                             <Text style={styles.postTitle}>{item.title || 'Sem Título'}</Text>
                             <Text style={styles.subtext}>por {item.profiles?.username}</Text>
                           </View>
                        </TouchableOpacity>
                    );
                }
            }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', margin: 15, padding: 10, borderRadius: 8 },
  input: { flex: 1, color: '#fff', marginLeft: 10 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#6200ee' },
  tabText: { color: '#666', fontWeight: 'bold' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#111' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#333' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subtext: { color: '#666', fontSize: 12 },
  postCard: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden' },
  postThumb: { width: 80, height: 80 },
  postTitle: { color: '#fff', fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 20 }
});
