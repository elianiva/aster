# Replace sidebar navigation with full-screen workspace view

The sidebar felt empty at the top level (Dashboard + Workspaces) and cluttered inside workspaces (Missions, Lessons, Sessions, Records). We're removing it entirely in favor of a Google Classroom-style navigation: home is a workspace grid, clicking a workspace opens a full-screen view with a tab bar (Threads | Lessons | Records). Settings becomes a modal accessible via icon. This eliminates the sidebar-layout component and simplifies routing by removing the `_sidebar` layout route.

Considered options: collapsible sidebar (Linear-style), keeping the sidebar with dynamic content. Rejected because a single-user learning app doesn't need persistent global navigation — the workspace IS the context.
