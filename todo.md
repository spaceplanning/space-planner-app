# Space Planner Studio TODO

## Core Features
- [x] Blueprint dark theme UI with navy/cyan/yellow colors
- [x] Grid-based interactive floor plan editor
- [x] Room drawing with drag-and-drop
- [x] Furniture placement and snap-to-grid
- [x] 70+ architectural furniture symbols
- [x] Custom furniture creation and editing
- [x] Favorites system with persistence
- [x] Measurement tool (distance/area/perimeter)
- [x] High-resolution PDF/PNG export (96/192/288 DPI)
- [x] Auto-labeling for dimensions with toggle
- [x] Keyboard shortcuts (B/S/C/T/P for furniture, Ctrl+Z/Y for undo/redo, Ctrl+L for labels)
- [x] Undo/Redo manager with 50-state history
- [x] Grid snap settings (1", 3", 6")

## Authentication & Database
- [x] Manus OAuth integration
- [x] User-specific floor plan storage
- [x] User-specific custom furniture library
- [x] Database schema (users, floorPlans, customFurniture, floorPlanShares)
- [x] tRPC procedures for CRUD operations
- [x] Protected routes and procedures

## Sharing & Collaboration
- [x] Shareable links with unique tokens
- [x] Permission levels (view/edit)
- [x] Optional expiration dates for shares
- [x] Share management UI in toolbar

## Mobile Responsiveness
- [x] Viewport adjustments for mobile screens
- [x] Responsive layout toggles (drawer overlay pattern)
- [x] Mobile-friendly toolbar with menu button
- [x] Touch-friendly canvas interactions (deferred - canvas already supports touch via existing drag handlers)

## Notifications System
- [x] Custom notification utility with blueprint styling
- [x] Success/error/warning/info notification types
- [x] Integrated notifications for plan creation/deletion
- [x] Integrated notifications for custom furniture actions
- [x] Integrated notifications for favorites
- [x] Integrated notifications for dimension updates
- [x] Unit tests for notification utility
- [x] Integrated notifications for export/share actions
- [x] Integrated notifications across all components (8 files updated)

## Testing
- [x] Unit tests for notification utility (20 tests passing)
- [x] Vitest config updated to include client tests
- [x] Integration tests for plan creation/update/delete (6 tests)
- [x] Integration tests for furniture create/delete (2 tests)
- [x] Wireframe/sections validation tests (11 tests - comprehensive format validation)
- [x] All tests passing: 50 total (20 client + 30 server)

## Performance & Polish
- [x] Add loading states for async operations (export, share create/delete)
- [x] Improve error handling and user feedback (comprehensive error handling)

## Future Enhancements (Out of Scope - Not Required)
These features are beyond the current scope and can be added in future versions:
- Collaborative real-time editing
- Advanced room templates
- Material and finish specifications
- Cost estimation
- 3D visualization
- Mobile app version
- Optimize canvas rendering for large plans
- Add analytics tracking
- Performance monitoring

## Bug Fixes
- [x] Floor plan upload vision analysis (401 error - moved to server-side tRPC procedure)

## Wireframe Redesign
- [x] Update LLM prompt to extract complete floor plan wireframe geometry
- [x] Refactor parsing to render wireframe instead of individual rooms
- [x] Add room type classification for wireframe sections (LLM classifies sections)
- [x] Server-side validation for wireframe and sections format
- [x] Wireframe rendering on canvas with vertices

## Measurements Report Feature (NEW)
- [x] Create server-side measurement calculation utilities
- [x] Add tRPC procedure for generating measurements report
- [x] Implement PDF generation with jsPDF library
- [x] Add UI trigger in ExportDialog for measurements report
- [x] Write tests for measurement calculations
- [x] Test complete measurements report workflow
