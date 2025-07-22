// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use backtrace::Backtrace;
use std::fs::File;
use std::io::Write;
use std::panic;
use std::time::SystemTime;

fn main() {
    panic::set_hook(Box::new(|info| {
        let now = SystemTime::now();
        let timestamp = now
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        if let Some(mut file) = File::create(format!("monster_helper_crash_{}.txt", timestamp)).ok()
        {
            let msg = format!("Panic occurred: {:?}\n", info);
            let _ = file.write_all(msg.as_bytes());
            let bt = Backtrace::new();
            let _ = file.write_all(format!("{:?}", bt).as_bytes());
        }
    }));

    monster_helper_lib::run()
}
