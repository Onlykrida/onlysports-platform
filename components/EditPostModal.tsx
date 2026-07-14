import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { X, Save } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void | Promise<void>;
}

export default function EditPostModal({ visible, onClose, initialContent, onSave }: Props) {
  const [content, setContent] = useState<string>(initialContent);

  // Sync local state when a different post is opened for editing
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Post</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn} testID="edit-close">
            <X size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="Update your post…"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity
          style={[styles.saveBtn, !content.trim() && styles.saveBtnDisabled]}
          disabled={!content.trim()}
          onPress={async () => {
            await onSave(content.trim());
          }}
          testID="edit-save"
        >
          <Save size={20} color={theme.colors.white} />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  iconBtn: {
    padding: theme.spacing.xs,
  },
  input: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minHeight: 160,
    textAlignVertical: 'top',
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  saveBtn: {
    marginHorizontal: theme.spacing.md,
    marginTop: 'auto',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
  },
});
