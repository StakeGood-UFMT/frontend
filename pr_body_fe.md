# PR: Optimize Market UI and Voting Statistics (Front-End)

## Technical Changes
- **StakeFormComponent Reorganization**:
  - Implemented a more compact design for liquidity pools (YES/NO/Total) in a single row.
  - Replaced NGO list with a 3-column grid (`minmax(0, 1fr)`) to prevent overflow.
  - Added "External Link" icon to NGO cards to allow viewing details in a new tab.
  - Made Fee details collapsible to reduce visual clutter.
  - Improved responsive layout (breakpoint at 1150px) to switch to single column.
- **MarketDetailComponent Enhancements**:
  - Added a new "Voting" tab to display real-time NGO support distribution.
  - Implemented logic to fetch and display voting volume/count per NGO.
  - Added dynamic progress bars to visualize percentage of total volume per NGO.
- **Service Integration**:
  - Added `getMarketVoting` method to `MarketService`.

## Motivation
The market details page was feeling cluttered, especially the stake form. Users also needed more transparency on which NGOs were receiving support in a given market.

## Tests Performed
- Verified responsive behavior at different screen widths.
- Tested NGO link `stopPropagation` to ensure it doesn't trigger selection.
- Validated "Voting" tab data display and manual refresh.
