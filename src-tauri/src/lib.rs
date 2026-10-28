use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // SQLite database migrations
    let migrations = vec![
        // Version 1: Original CrateFire database tables
        Migration {
            version: 1,
            description: "create_cratefire_tables",
            sql: include_str!("../migrations/create_mix.sql"),
            kind: MigrationKind::Up,
        },

        // Version 2: Add overall DJ mix ratings
        Migration {
            version: 2,
            description: "add_mix_rating",
            sql: include_str!("../migrations/add_mix_rating.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:cratefire.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running CrateFire");
}
