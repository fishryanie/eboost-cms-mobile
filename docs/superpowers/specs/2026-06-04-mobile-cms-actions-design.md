# Mobile CMS Actions Design

## Goal

Build the CMS mobile app as a native React Native operations app, not as a web CMS clone. The app will clone admin functionality from `new-cms` module by module, starting with Locations and Chargers because those contain the most important field operations and charger control workflows.

The first usable milestone must let an admin sign in, browse operations data, open a location, inspect its stations and chargers, and run the core location and charger actions from a mobile-first interface.

## Non-Goals

- No WebView fallback for CMS pages.
- No desktop-style tables, drawers, dropdown trees, or web modal layouts.
- No attempt to clone every CMS module in the first implementation phase.
- No new station move/archive/restore actions in phase 1 because the web implementation currently keeps station actions empty and documents those features as removed.

## References

- Expo SDK 56 docs: `https://docs.expo.dev/versions/v56.0.0/`
- Web CMS source: `/Users/mac/Documents/Company/Eboost/new-cms`
- Mobile app source: `/Users/mac/Documents/Company/Eboost/eboost-cms-mobile`
- Bottom sheet package: `@gorhom/bottom-sheet`
- Reacticx docs: `https://www.reacticx.com/`

## Product Direction

The mobile app should feel like a field operations tool:

- Fast location-to-station-to-charger navigation.
- Native list/card layouts instead of tables.
- Bottom tabs and stack navigation for primary flow.
- Action sheets for quick actions.
- Full-screen native flows or tall bottom sheets for complex workflows.
- Clear status chips, icons, haptics, loading states, and confirmation states.
- Minimal explanatory copy. Screens should be scannable and action-oriented.

The web CMS remains the source of truth for feature behavior. The mobile app reuses the same workflows and API semantics, but it does not reuse the web UI model.

## Technology Choices

Use Expo SDK 56 and keep dependencies installed through Expo-compatible commands where possible.

Use `fetch`-based API helpers rather than adding Axios to the mobile app. The API client must support the same service split used by the web CMS:

- Core CMS API.
- Building/partner API.
- Hub/MQTT API.
- Optional future employer/partner auth context if required by later modules.

Use TanStack Query for server state, cache invalidation, loading states, and mutation orchestration.

Use `@gorhom/bottom-sheet` for:

- Action menus.
- Confirmation sheets.
- Modal sheets.
- Stacked sheets for nested actions when the flow is short.

Use Reacticx by adding components into the local codebase through its CLI or by copying component source into `src/shared/ui`. Reacticx components are project-owned after installation, so they can be restyled to fit the operations app. Candidate components for phase 1 are button, input, badge, search bar, empty state, tabs/segmented control, switch, toast, loader, and bottom-sheet-friendly controls.

## App Structure

Use feature folders:

```text
src/
  app/
  features/
    auth/
    locations/
    chargers/
  shared/
    api/
    query/
    session/
    ui/
    utils/
```

`src/app` owns Expo Router routes only. Business logic belongs in feature or shared modules.

`src/shared/api` owns:

- Base URL resolution by service.
- Auth header injection.
- JSON/FormData request helpers.
- Error normalization.
- API response parsing helpers.

`src/shared/session` owns secure token persistence and current admin session state.

`src/features/locations` owns location list/detail data, recursive visibility, restore, sync partnership location, and station/charger entry points.

`src/features/chargers` owns charger lists, charger detail/log views, MQTT actions, configuration, replace box, replace meter, and install/uninstall workflows.

## Navigation

Phase 1 uses a small native navigation model:

- `Login`
- `Operations`
- `Locations`
- `Location Detail`
- `Station Detail`
- `Charger Detail`
- Full-screen action flows for complex charger workflows when a bottom sheet would become too dense.

The default path after login is Operations > Locations.

Primary tabs should be reserved for top-level app areas. Phase 1 may expose only Operations and Account/Settings while the other CMS modules are still pending.

## Mobile UI Patterns

Locations:

- Searchable list with pull-to-refresh.
- Location cards show name, operation status, visibility, station count if available, charger summary if available, and sync/partner state if available.
- Swipe or trailing icon opens a bottom action sheet.
- Tapping a location opens detail.

Location Detail:

- Header with status, visibility, partner sync state, and quick actions.
- Native segmented tabs for Overview, Stations, Chargers, Logs/Metadata when data exists.
- Actions sheet contains sync partnership location, hide/show recursively, and restore when deleted.

Stations:

- Station list cards inside location detail.
- Station actions remain empty in phase 1 unless the web source changes.
- Tapping a station opens chargers filtered by station.

Chargers:

- Charger cards show identifier, vehicle type, enabled/visible state, station, partner box/read meter state, and connector/outlet status summary.
- Action sheet groups MQTT actions and maintenance actions visually, without web-style nested menus.
- Dangerous actions require confirmation.

Complex flows:

- Replace box, replace meter, diagnostics, and configuration use full-screen native screens or tall bottom sheets depending on density.
- Multi-step actions show step progress and partial failure messaging.
- Forms must use mobile input patterns, date pickers, segmented choices, and clear submit state.

## Phase 1 Functional Scope

### Auth and Session

- Admin login.
- Token persistence.
- Logout.
- Authenticated API calls.
- Expired/invalid session handling.

### Location Actions

Clone behavior from the web CMS:

- Sync partnership location.
- Hide/show location recursively.
- Restore deleted location.

Recursive visibility must update:

- Location.
- Related stations.
- Related car boxes and bike boxes.
- Related car connectors and bike outlets.

Visibility constraints must match web behavior:

- Hide is allowed only when operation status is `Temporarily Stop`, `Temp Uninstalled`, `Uninstalled`, or `Terminated`.
- Show is allowed only when operation status is `Operating`.

### Charger Actions

Clone behavior from the web CMS:

- View charger detail.
- View charger logs.
- Edit basic charger/box fields needed by the action workflows.
- Reset charger.
- Trigger charger.
- Unlock charger.
- Diagnostics request.
- Diagnostics history.
- Diagnostics file download when feasible on device.
- Charger configuration read/update.
- Replace box.
- Replace meter.
- Uninstall box.
- Reinstall box.

MQTT action endpoints:

- `api/v1/device/{chargePointId}/reset`
- `api/v1/device/{chargePointId}/trigger`
- `api/v1/device/{chargePointId}/unlock`
- `api/v1/device/{chargePointId}/diagnostics`
- `api/v1/device/{chargePointId}/diagnostics/history`
- `api/v1/device/{chargePointId}/configuration`

Workflow actions must preserve the web semantics for partner logs, meter reports, partner boxes, box visibility, port visibility, and query invalidation.

## Workflow Rules

Replace box:

- Support brand-new box and transfer box replacement.
- Uninstall old box.
- Optionally delete old partner box.
- Assign replacement box to the station.
- Preserve vendor ID behavior for car chargers.
- Carry read meter data when partner location and partner box data exist.
- Create partner charger logs for uninstall/install.

Replace meter:

- Require partnership location and partner box.
- Create two meter reports.
- Update closing and install readings.
- Create partner logs with `remove_meter` and `install_meter`.
- Support optional connector ID for car chargers.

Uninstall box:

- Create uninstall partner log when possible.
- Delete partner box when possible.
- Patch charger to disabled, hidden, name `Uninstalled`, and vendor ID suffix `_Uninstalled`.
- Patch related ports hidden.

Reinstall box:

- Restore visibility and enabled state.
- Remove `_Uninstalled` suffix.
- Create partner box when partnership location exists.
- Create install partner log.
- Patch related ports visible.

## Error Handling

API errors must be normalized into a mobile-friendly shape:

- Title.
- Message.
- HTTP status if available.
- Service name.
- Raw payload retained for debug logging.

Workflow errors must avoid pretending that a multi-step action fully succeeded. Complex workflows should surface:

- Current step.
- Failed step.
- Whether refresh is needed.
- Suggested retry action.

Dangerous actions require explicit confirmation. Destructive flows should use haptics and clear red action styling.

## Testing Strategy

Service/workflow tests are required before wiring dangerous UI:

- API client service routing and auth header behavior.
- Location recursive visibility guard conditions.
- Location recursive visibility request sequence.
- Restore location name normalization.
- Replace meter payload construction and failure handling.
- Replace box payload construction and failure handling.
- Uninstall/reinstall vendor ID and visibility behavior.

UI verification:

- Expo lint/typecheck.
- Manual run on iOS or Android simulator.
- Verify bottom sheets do not overlap safe areas or keyboard.
- Verify action sheets and complex flows are usable on small devices.

## Implementation Phases

### Phase 1A: Foundation

- Install required dependencies.
- Initialize Reacticx output directory.
- Add API client, session storage, query provider, and base app shell.
- Replace template screens with login and operations shell.

### Phase 1B: Locations

- Add location list and detail screens.
- Add location service and queries.
- Add sync, recursive hide/show, and restore actions.
- Add native action sheet and confirmations.

### Phase 1C: Chargers

- Add charger list/detail/log UI.
- Add charger service and shared workflow helpers.
- Add MQTT actions.
- Add configuration view/update.
- Add replace box, replace meter, uninstall, and reinstall workflows.

### Phase 1D: Hardening

- Add focused tests for workflows.
- Add empty/error/loading states.
- Polish mobile interaction, safe areas, keyboard handling, and haptics.
- Run lint/typecheck and simulator smoke test.

## Future Modules

After Locations and Chargers establish the pattern, clone remaining web CMS modules one at a time. Each module should follow the same rule: clone behavior and API workflow, redesign the UI as native mobile.

Candidate next modules:

- Users/accounts and quick actions.
- Transactions.
- RFID cards.
- Payments.
- Promotions and notifications.
- Technical charger status logs.
- Dashboard/overview.

## Open Assumptions

- The mobile app can use the same admin credentials and API base URLs as the web CMS.
- Environment variable names for service base URLs can be chosen during implementation if the mobile repo has no existing convention.
- Diagnostics file download may need Expo FileSystem/Sharing behavior rather than browser blob download.
- Reacticx components will be installed/copied locally and restyled rather than treated as an external black-box design system.
