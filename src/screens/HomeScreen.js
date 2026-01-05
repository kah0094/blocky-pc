import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const FEATURED_GAME = { id: '0', title: 'Neon RPG', dev: 'CyberDev', img: 'https://via.placeholder.com/600x300/6200ee/fff?text=NEON' };
const GAMES = [
  { id: '1', title: 'Block Jump', dev: 'Indie', img: 'https://via.placeholder.com/300/ff0055/fff?text=JUMP' },
  { id: '2', title: 'Space', dev: 'Star', img: 'https://via.placeholder.com/300/00aaff/fff?text=SPACE' },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Open<Text style={{color:'#00ff9d'}}>Builder</Text></Text>
        <View style={{flexDirection:'row', gap: 15}}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatList')}>
                <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Em Destaque</Text>
      <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard}>
        <Image source={{ uri: FEATURED_GAME.img }} style={styles.featuredImg} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient}>
            <Text style={styles.featTitle}>{FEATURED_GAME.title}</Text>
            <Text style={styles.featDev}>por {FEATURED_GAME.dev}</Text>
            <View style={styles.playBtn}><Text style={styles.playText}>JOGAR</Text></View>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Populares</Text>
      <FlatList horizontal data={GAMES} showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingLeft: 20}}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.gameCard}>
            <Image source={{ uri: item.img }} style={styles.gameImg} />
            <Text style={styles.gameTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.gameDev}>{item.dev}</Text>
          </TouchableOpacity>
        )}
      />
      <View style={{height: 50}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  logo: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15, marginTop: 10 },
  featuredCard: { marginHorizontal: 20, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  featuredImg: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 15 },
  featTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  featDev: { color: '#ccc', marginBottom: 10 },
  playBtn: { position: 'absolute', right: 15, bottom: 15, backgroundColor: '#00ff9d', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  playText: { fontWeight: 'bold', color: '#000' },
  gameCard: { width: 140, marginRight: 15 },
  gameImg: { width: 140, height: 140, borderRadius: 12, marginBottom: 8, backgroundColor: '#222' },
  gameTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  gameDev: { color: '#666', fontSize: 12 }
});
