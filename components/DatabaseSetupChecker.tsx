import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/constants/supabase';
import { theme } from '@/constants/theme';
import { AlertCircle, CheckCircle, Database } from 'lucide-react-native';

interface DatabaseStatus {
  connected: boolean;
  tablesExist: boolean;
  policiesWork: boolean;
  error?: string;
}

export function DatabaseSetupChecker() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const checkDatabase = async () => {
    setChecking(true);
    const newStatus: DatabaseStatus = {
      connected: false,
      tablesExist: false,
      policiesWork: false,
    };

    try {
      // Test connection
      const { error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        if (error.code === '42P01') {
          newStatus.error = 'Tables not found. Please run the setup SQL script.';
        } else if (error.code === '42501') {
          newStatus.error = 'Permission denied. Check RLS policies.';
        } else {
          newStatus.error = error.message;
        }
      } else {
        newStatus.connected = true;
        newStatus.tablesExist = true;
        newStatus.policiesWork = true;
      }
    } catch (error) {
      newStatus.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setStatus(newStatus);
    setChecking(false);
  };

  const showSetupInstructions = () => {
    Alert.alert(
      'Database Setup Required',
      'To fix this issue:\n\n' +
      '1. Go to your Supabase dashboard\n' +
      '2. Open the SQL Editor\n' +
      '3. Copy and paste the SQL from supabase-setup.sql\n' +
      '4. Run the script\n' +
      '5. Try signing up again',
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  if (!status) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Database size={20} color={theme.colors.primary} />
        <Text style={styles.title}>Database Status</Text>
      </View>
      
      <View style={styles.statusList}>
        <View style={styles.statusItem}>
          {status.connected ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.statusText, { color: status.connected ? '#10b981' : '#ef4444' }]}>
            Connection: {status.connected ? 'OK' : 'Failed'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          {status.tablesExist ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.statusText, { color: status.tablesExist ? '#10b981' : '#ef4444' }]}>
            Tables: {status.tablesExist ? 'Found' : 'Missing'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          {status.policiesWork ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#ef4444" />
          )}
          <Text style={[styles.statusText, { color: status.policiesWork ? '#10b981' : '#ef4444' }]}>
            Policies: {status.policiesWork ? 'OK' : 'Failed'}
          </Text>
        </View>
      </View>
      
      {status.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{status.error}</Text>
        </View>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={checkDatabase} disabled={checking}>
          <Text style={styles.buttonText}>
            {checking ? 'Checking...' : 'Recheck'}
          </Text>
        </TouchableOpacity>
        
        {!status.tablesExist && (
          <TouchableOpacity style={[styles.button, styles.setupButton]} onPress={showSetupInstructions}>
            <Text style={[styles.buttonText, styles.setupButtonText]}>Setup Instructions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  statusList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#dc2626',
    fontSize: theme.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  setupButton: {
    backgroundColor: '#f59e0b',
  },
  setupButtonText: {
    color: 'white',
  },
});