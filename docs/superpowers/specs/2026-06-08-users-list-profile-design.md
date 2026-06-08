# Users List And Profile Design

## Goal

Add a final `Users` bottom tab that supports paginated user browsing, automatic search-field detection, and navigation to a detailed user profile.

## Navigation

- Replace the final `Profile` bottom tab with `Users`.
- The Users tab route is `/(tabs)/users`.
- Selecting a user opens `/user/[id]`.
- The Users tab popup contains:
  - Adjust Balance
  - Transfer Funds
  - Change Email
  - Reset Password
  - Change Tier
- Popup actions are visible navigation placeholders in this scope; their editing workflows are not implemented yet.

## User List

The list calls `GET /api/users` through the existing authenticated `apiRequest` client.

Request params:

- `page`: current page, starting at `1`
- `itemsPerPage`: fixed page size
- One optional search param: `id`, `phoneNumber`, or `email`

Search detection after trimming whitespace:

- A value containing `@` uses `email`.
- A numeric value starting with `0` uses `phoneNumber`.
- A numeric value starting with `84` uses `phoneNumber`.
- Any other numeric value containing 9 or 10 digits uses `phoneNumber`.
- Any other numeric value uses `id`.
- A non-empty value that is neither an email-like value nor numeric uses `email`, allowing partial email searches.
- An empty value sends no search filter.

The list uses TanStack Query `useInfiniteQuery`. It reads records from `hydra:member`, total count from `hydra:totalItems`, and determines the next page from `hydra:view.hydra:next`. Reaching the end of the list loads the next page. Pull-to-refresh refetches the list.

Each user row shows the best available display name, ID, email, phone, balance, account status, and user level. Missing values use restrained fallback labels.

## User Profile

The profile route calls:

`GET api/controller/user/profile?userId=<selected-user-id>`

The profile screen shows:

- Identity: name, ID, username, email, phone, address, created date
- Account state: enabled, email activation, phone verification, citizen verification
- Wallet balance
- User level
- Preferences: auto charge and automatic promotion-code application
- Balance history with action, amount, resulting wallet balance, reason, and timestamp

Profile loading, empty, and error states follow the existing native operational UI patterns.

## Architecture

- `src/features/users/types.ts`: list/profile response types
- `src/features/users/user-search.ts`: deterministic search-param detection
- `src/features/users/user-service.ts`: list and profile requests
- `src/features/users/hooks.ts`: infinite list query and profile query
- `src/features/users/components/user-card.tsx`: reusable list row
- `src/app/(tabs)/users.tsx`: Users list screen
- `src/app/user/[id].tsx`: profile screen
- Existing tab and popup components are updated for Users.

## Error Handling

- API errors flow through the existing `ApiError` normalization.
- Initial list/profile failures render a retry action.
- Load-more failures keep already loaded users visible and expose a retry footer.
- Duplicate load-more requests are prevented while a next-page request is pending.

## Testing

- Unit tests cover search-field detection, Hydra page parsing, and next-page selection.
- Run service tests, TypeScript typecheck, lint, and React Doctor.
- Smoke-test Users list search, load more, user selection, profile rendering, and tab popup.

## Out Of Scope

- Implementing the five user mutation workflows.
- Editing profile fields directly from the profile screen.
- Server-side changes or API contract changes.
