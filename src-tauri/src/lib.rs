
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Database migrations
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_cratefire_tables",
            sql: include_str!("../migrations/create_mix.sql"),
            kind: MigrationKind::Up,
        },
    ];

    // Initialize the Tauri application
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:cratefire.db",
                    migrations,
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running CrateFire");
}
