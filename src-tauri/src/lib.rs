use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton},
    Manager, Emitter,
};
use tauri_plugin_http::reqwest;
use tauri_plugin_http::reqwest::Response;

static CLOSE_TO_TRAY: AtomicBool = AtomicBool::new(true);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicTrack {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: Option<u64>,
    pub file_path: Option<String>,
    pub url: Option<String>,
    pub is_local: bool,
    pub cover_art: Option<String>,
}

#[tauri::command]
fn get_music_metadata(file_path: String) -> Result<MusicTrack, String> {
    let path = PathBuf::from(&file_path);
    let file_name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("未知曲目")
        .to_string();

    Ok(MusicTrack {
        id: uuid::Uuid::new_v4().to_string(),
        title: file_name,
        artist: "未知艺术家".to_string(),
        album: None,
        duration: None,
        file_path: Some(file_path),
        url: None,
        is_local: true,
        cover_art: None,
    })
}

#[tauri::command]
fn parse_source_file(_file_path: String) -> Result<Vec<MusicTrack>, String> {
    Ok(vec![])
}

#[tauri::command]
async fn fetch_online_tracks(source_url: String) -> Result<Vec<MusicTrack>, String> {
    let client = reqwest::Client::new();
    let resp: Response = client.get(&source_url).send().await.map_err(|e| e.to_string())?;
    let js_content = resp.text().await.map_err(|e| e.to_string())?;
    
    println!("成功获取音源文件：{}", source_url);
    println!("JS 内容长度：{}", js_content.len());
    
    Ok(vec![])
}

#[tauri::command]
async fn search_music(source_url: String, query: String) -> Result<Vec<MusicTrack>, String> {
    let client = reqwest::Client::new();
    let resp: Response = client.get(&source_url).send().await.map_err(|e| e.to_string())?;
    let _js_content = resp.text().await.map_err(|e| e.to_string())?;
    
    println!("搜索音乐：{} from {}", query, source_url);
    
    Ok(vec![])
}

#[tauri::command]
fn show_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn hide_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
fn set_close_to_tray(value: bool) {
    CLOSE_TO_TRAY.store(value, Ordering::SeqCst);
}

#[tauri::command]
fn get_close_to_tray() -> bool {
    CLOSE_TO_TRAY.load(Ordering::SeqCst)
}

#[tauri::command]
fn emit_play_pause(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle
        .emit("tray-play-pause", ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn emit_tray_next(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle.emit("tray-next", ()).map_err(|e| e.to_string())
}

#[tauri::command]
fn emit_tray_previous(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle
        .emit("tray-previous", ())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_music_metadata,
            parse_source_file,
            fetch_online_tracks,
            search_music,
            show_main_window,
            hide_main_window,
            quit_app,
            set_close_to_tray,
            get_close_to_tray,
            emit_play_pause,
            emit_tray_next,
            emit_tray_previous
        ]);

    // 只在桌面端启用系统托盘
    #[cfg(not(target_os = "android"))]
    {
        builder = builder.setup(|app| {
            let play_pause_i = MenuItem::with_id(app, "play_pause", "播放/暂停", true, None::<&str>)?;
            let previous_i = MenuItem::with_id(app, "previous", "上一首", true, None::<&str>)?;
            let next_i = MenuItem::with_id(app, "next", "下一首", true, None::<&str>)?;
            let separator_i = PredefinedMenuItem::separator(app)?;
            let show_i = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&play_pause_i, &previous_i, &next_i, &separator_i, &show_i, &quit_i])?;
            
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("蝉声音乐")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "play_pause" => {
                        let _ = emit_play_pause(app.clone());
                    }
                    "previous" => {
                        let _ = emit_tray_previous(app.clone());
                    }
                    "next" => {
                        let _ = emit_tray_next(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // 设置窗口关闭事件处理
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let close_to_tray = CLOSE_TO_TRAY.load(Ordering::SeqCst);
                        if close_to_tray {
                            let _ = window_clone.hide();
                        } else {
                            let app_handle = window_clone.app_handle();
                            app_handle.exit(0);
                        }
                    }
                });
            }

            Ok(())
        });
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
