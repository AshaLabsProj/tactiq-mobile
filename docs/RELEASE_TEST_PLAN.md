# Skilltracker Release Test Plan

## Core offline workflow

1. Enable airplane mode before launching Skilltracker.
2. Open Capture, set up a match, and start it without a connection.
3. Record one zone-required event in two taps: zone, then action.
4. Confirm haptic feedback and an undo toast, then undo the event.
5. Record a goal for and a goal against, then confirm the derived score.
6. Pause, resume, end the match, and confirm that the summary opens with heatmap and tactical metrics.

## Development workflow

1. Create a practice session with one or two focus skills.
2. Run batch assessment for at least two players.
3. Set an individual focus goal from a player profile.
4. Confirm the player and team transfer views communicate data sufficiency instead of overstating conclusions.

## Account and cloud backup

1. Sign in from Settings and select **Back up this device**.
2. Confirm the backup succeeds and the Settings state reports a sync time.
3. Create an assessment while offline, restore connectivity, and select **Sync now**.
4. Confirm the pending-change indicator clears only after a successful sync.
5. Confirm sign-out leaves local data available.
6. Confirm **Erase cloud backup** requires confirmation and does not erase device data.

## Layout and accessibility

1. Verify Home, Squad, Capture, and Insights on a small iPhone and a large iPhone.
2. Verify portrait Android layout with system font scaling enabled.
3. Confirm primary controls remain at least 44pt tall and have accessibility labels.
4. Confirm light canvas, emerald action, amber attention, and coral destructive states have readable contrast.
