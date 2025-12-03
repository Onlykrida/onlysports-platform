import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { generateAllMockData, generateMockUsers, generateMockPosts, generateMockOpportunities, generateMockInteractions } from './generate-mock-data';
import { cleanupMockData } from './cleanup-mock-data';

export default function TestWithMockData() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleGenerateAll = async () => {
    try {
      setLoading(true);
      setStatus('Generating all mock data...');
      await generateAllMockData();
      setStatus('✅ All mock data generated successfully!');
      Alert.alert('Success', 'Mock data generated successfully! Refresh the app to see the data.');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUsers = async () => {
    try {
      setLoading(true);
      setStatus('Generating mock users...');
      await generateMockUsers(100);
      setStatus('✅ Mock users generated!');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePosts = async () => {
    try {
      setLoading(true);
      setStatus('Generating mock posts...');
      await generateMockPosts(150);
      setStatus('✅ Mock posts generated!');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOpportunities = async () => {
    try {
      setLoading(true);
      setStatus('Generating mock opportunities...');
      await generateMockOpportunities(100);
      setStatus('✅ Mock opportunities generated!');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInteractions = async () => {
    try {
      setLoading(true);
      setStatus('Generating mock interactions...');
      await generateMockInteractions();
      setStatus('✅ Mock interactions generated!');
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAll = async () => {
    Alert.alert(
      'Confirm Cleanup',
      'This will delete all mock data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setStatus('Cleaning up all mock data...');
              await cleanupMockData();
              setStatus('✅ All mock data cleaned up!');
            } catch (error: any) {
              setStatus(`❌ Error: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mock Data Testing</Text>
      <Text style={styles.subtitle}>Generate and manage test data</Text>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Generate Mock Data</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleGenerateAll}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🚀 Generate All (100 users, 150 posts, 100 opportunities)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateUsers}
          disabled={loading}
        >
          <Text style={styles.buttonText}>👥 Generate Users Only</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGeneratePosts}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📝 Generate Posts Only</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateOpportunities}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🎯 Generate Opportunities Only</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateInteractions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>❤️ Generate Interactions (Follows, Likes, Comments)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cleanup Mock Data</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleCleanupAll}
          disabled={loading}
        >
          <Text style={[styles.buttonText, styles.dangerButtonText]}>🗑️ Delete All Mock Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>• Mock data is tagged with is_mock flag</Text>
        <Text style={styles.infoText}>• All mock users have @mockdata.test emails</Text>
        <Text style={styles.infoText}>• Cleanup removes all related data (posts, likes, follows, etc.)</Text>
        <Text style={styles.infoText}>• Refresh the app after generating data to see changes</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#000',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center' as const,
  },
  primaryButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dangerButtonText: {
    color: '#FFF',
  },
  statusBox: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: '#000',
  },
  loadingBox: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 4,
  },
});
