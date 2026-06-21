CREATE TABLE lessons (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id),
	title TEXT NOT NULL,
	r2_key TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE TABLE records (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id),
	r2_key TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
