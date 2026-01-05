import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';
import { RealtimeProvider } from './src/context/RealtimeContext'; // <--- IMPORTADO

// Telas
import HomeScreen from './src/screens/HomeScreen';
import PostsScreen from './src/screens/PostsScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CreateSelectionScreen from './src/screens/CreateSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';

import Sidebar from './src/components/Sidebar';
import DebugFab from './src/components/DebugFab';

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState('Início');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (loading) return <View style={{flex:1, backgroundColor:'#000', justifyContent:'center'}}><ActivityIndicator size="large" color="#00ff9d"/></View>;

  return (
    <SafeAreaProvider>
      <RealtimeProvider>  {/* <--- CONECTANDO O REALTIME AQUI */}
        <NavigationContainer ref={navigationRef} onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}>
            <StatusBar barStyle="light-content" backgroundColor="#18181b" />
            
            {!session ? (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Auth" component={AuthScreen} />
              </Stack.Navigator>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#09090b' }}>
                <Sidebar navigation={navigationRef} currentRoute={currentRoute} />
                <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                  <View style={{ flex: 1, maxWidth: 1400, width: '100%', alignSelf: 'center', backgroundColor: '#000' }}>
                      <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.DefaultTransition }}>
                        <Stack.Screen name="Início" component={HomeScreen} />
                        <Stack.Screen name="Posts" component={PostsScreen} />
                        <Stack.Screen name="Busca" component={SearchScreen} />
                        <Stack.Screen name="MeuPerfil" component={ProfileScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                        <Stack.Screen name="CreateSelection" component={CreateSelectionScreen} options={{presentation: 'transparentModal'}} />
                        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="ChatList" component={ChatListScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                      </Stack.Navigator>
                      
                      <DebugFab />
                  </View>
                </View>
              </View>
            )}
        </NavigationContainer>
      </RealtimeProvider>
    </SafeAreaProvider>
  );
}
