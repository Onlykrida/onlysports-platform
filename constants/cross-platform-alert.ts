import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Alert.alert is a silent no-op on react-native-web: no dialog renders and
 * button onPress callbacks (often carrying router.back() or follow-up state)
 * never fire. That made whole flows appear broken in the browser — see the
 * F-002 design-review finding on beep-test-manual.
 *
 * On native this delegates to Alert.alert unchanged. On web it maps to
 * window.alert / window.confirm so the message is seen AND the right
 * callback runs. confirm() only supports two choices: the first
 * `style: 'cancel'` button is the negative path, the first other button is
 * the positive one (extra buttons are ignored on web — prefer ≤2 buttons,
 * or build inline UI for richer flows).
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }

  if (buttons.length === 1) {
    window.alert(text);
    buttons[0].onPress?.();
    return;
  }

  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const confirmButton = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
  if (window.confirm(text)) {
    confirmButton.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
