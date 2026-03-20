import { invoke } from '@tauri-apps/api/core';

/**
 * 显示主窗口
 */
export async function showMainWindow(): Promise<void> {
  try {
    await invoke('show_main_window');
  } catch (error) {
    console.error('Failed to show main window:', error);
  }
}

/**
 * 隐藏主窗口
 */
export async function hideMainWindow(): Promise<void> {
  try {
    await invoke('hide_main_window');
  } catch (error) {
    console.error('Failed to hide main window:', error);
  }
}

/**
 * 退出应用
 */
export async function quitApp(): Promise<void> {
  try {
    await invoke('quit_app');
  } catch (error) {
    console.error('Failed to quit app:', error);
  }
}

/**
 * 最小化到托盘
 */
export async function minimizeToTray(): Promise<void> {
  await hideMainWindow();
}
