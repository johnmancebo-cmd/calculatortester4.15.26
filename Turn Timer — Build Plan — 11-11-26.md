# Turn Timer: Build Plan

## 1. Requirements Restated

The app is a single-page chess-clock timer. Only one person's clock runs at a time. A tap stops the running clock and starts the next person's. The app keeps a record of elapsed time for each person, for each person on each day, and as a total for each week.

**Assumptions for unfilled placeholders:**

| Placeholder | Assumption |
|---|---|
| Number of people | A configurable list of names, from 2 to 8 people. It starts with two people named "Person A" and "Person B". |
| Use case | General shared turn time, such as games, speaking time, or shared tasks. The plan uses no wording or features specific to one use case. |
| Week starts on | Monday by default, with a setting to change it to Sunday. |
| Primary device | Both phone and desktop. Phone portrait is the first layout designed and the first one tested. |

**Other assumptions, stated once here and used throughout:**
- One device and one browser. The plan includes no sharing or syncing between devices (see 2f).
- The day and week boundaries follow the device's current local time zone.
- "Reset" clears the on-screen session counters. It does not delete the recorded history (see 2b).

---

## 2a. Scope

| Feature | Label |
|---|---|
| Configurable list of people (add, rename, remove, reorder) | Core |
| Start, switch to next, pause, resume, reset | Core |
| Only one clock running at any time | Core |
| Timekeeping based on timestamps | Core |
| Totals per person per day, per person per week, and weekly total | Core |
| Splitting time at midnight, plus the week-start setting | Core |
| Saving in the browser, with recovery of a clock that was left running | Core |
| Correcting entries (edit, delete, or add a timed segment) | Core |
| Clock screen, daily view, weekly summary | Core |
| Undo the last switch (within 10 seconds) | Optional |
| Ignore a second tap within 0.4 seconds (protects against accidental double taps) | Optional |
| Export and import of data (JSON or CSV) as a backup | Optional |
| Keep the screen awake while a clock runs (Screen Wake Lock) | Optional. Browser support varies, so it would need testing on target devices. |
| Tap any person directly to make them active (when there are 3 or more people) | Optional |
| Syncing between devices or sharing between people | Optional. Depends on artifact platform features (see 2f). |
| Sound or vibration on switch | Optional |

## 2b. Clock Behavior

**States:**

| State | Meaning | What runs |
|---|---|---|
| **Idle** | No session has started, or the session was just reset. | Nothing |
| **Running** | One person's clock is running. | Exactly one person |
| **Paused** | No clock runs. The app remembers whose turn it is. | Nothing |

**Actions:**

| Action | Allowed from | Result |
|---|---|---|
| **Start** | Idle | Starts the first person in the list. Tapping a specific person's tile starts that person instead. |
| **Switch (tap)** | Running | Stops the current person and starts the next person in list order, wrapping from last to first. One timestamp is used for both the stop and the start, so the record has no gap and no overlap. |
| **Pause** | Running | Stops the current person's clock and remembers that it is their turn. |
| **Resume** | Paused | Starts the remembered person again. |
| **Reset** | Running or Paused | Asks for confirmation. Then it stops any running clock, sets the on-screen *session* counters to zero, and returns to Idle. **Recorded history is kept.** |
| **Clear all history** | Settings | Asks twice for confirmation. Then it deletes every timed segment. This is separate from Reset. |

**How "only one runs at a time" is guaranteed:**
- The record can hold at most one open segment, meaning one with no end time.
- Every action that starts a clock first closes any open segment, using the same timestamp.
- On load, if the saved data contains more than one open segment (for example, after a crash), the app keeps the newest one open and closes the others at the newer segment's start time.

**Paused state, defined:** No segment is open. `status = paused` is saved together with the ID of the person whose turn it is. In this state the session counters do not change. Reload and reopen both return to Paused.

## 2c. Timekeeping Method

- On each start, switch, or pause, the app records the **real-world timestamp**: milliseconds since 1970, in UTC, from `Date.now()`. It does not add 1 to a counter every second.
- A segment's duration is `end − start`. For a segment that is still running, the duration is `now − start`.
- The on-screen ticker only *redraws* the derived values, about 4 times per second. It does not track time. If the browser slows or stops the ticker while the tab is hidden, the next redraw still shows the correct value.
- Because time is stored as UTC timestamps, daylight saving changes do not affect durations. Local time is used only to work out where each day starts and ends.
- Every action is saved to storage **at the moment it happens**, not on a timer. Closing the tab right after a tap loses nothing.
- **Limitation:** if someone changes the device clock while a clock is running, that segment's duration will be wrong. The app cannot detect every such change. It treats any negative duration as zero and flags the segment in the daily view so it can be corrected.

## 2d. Data Model

**Person**

| Field | Type | Notes |
|---|---|---|
| `id` | text (random, unique) | Never changes. Segments refer to this, not to the name. |
| `name` | text | Can be edited. 1 to 40 characters. |
| `order` | number | Position in the switching order. |
| `archived` | true/false | True when the person has been removed. It hides them from the clock and keeps their history. |
| `createdAt` | timestamp (ms, UTC) | |

**Timed Segment**

| Field | Type | Notes |
|---|---|---|
| `id` | text (random, unique) | |
| `personId` | text | Links to Person.id. |
| `start` | timestamp (ms, UTC) | |
| `end` | timestamp (ms, UTC) or empty | Empty means the segment is running. At most one segment can be empty. |
| `source` | `clock` / `manual` / `edited` | Shows whether the segment was recorded by the clock, added by hand, or changed after recording. |

**App State and Settings** (one record)

| Field | Type | Notes |
|---|---|---|
| `status` | `idle` / `running` / `paused` | |
| `currentPersonId` | text or empty | Whose turn it is (in Running or Paused). |
| `sessionStartedAt` | timestamp or empty | Time of the last Start after an Idle state. Used to calculate session counters. |
| `lastSeenAt` | timestamp | Updated every 15 seconds while the page is visible. Used for recovery (2f). |
| `weekStart` | `monday` / `sunday` | Default `monday`. |
| `schemaVersion` | number | Allows the saved data format to change safely later. |

**Example record (one segment)**

```json
{
  "id": "seg_7f3a9c",
  "personId": "per_a1b2c3",
  "start": 1794448500000,
  "end": 1794449100000,
  "source": "clock"
}
```
*(This is a 10-minute segment. `end − start` = 600,000 ms. The timestamps are illustrative.)*

## 2e. Aggregation Rules

All totals are **calculated from the segments** each time they are displayed. No running total is stored, so totals cannot drift from the record.

1. **Day boundaries.** A local day runs from local midnight to the next local midnight. The app works out each day's start from the calendar date in the device time zone. It does **not** add 24 hours to the previous midnight. As a result, a daylight saving day is correctly 23 or 25 hours long.
2. **Per person per day.** For each of that person's segments: time counted = `max(0, min(segmentEnd, dayEnd) − max(segmentStart, dayStart))`. A running segment uses "now" as its end. These amounts are added together.
3. **Segments crossing midnight.** Rule 2 splits them automatically. A segment from 23:55 to 00:05 counts 5 minutes on each day. The stored segment is never cut in two. The split happens only when totals are calculated.
4. **Per person per week.** The week begins at local midnight on the chosen week-start day (Monday or Sunday). It covers 7 local calendar days. The week total is the sum of that person's 7 daily totals, computed in milliseconds.
5. **Weekly total.** The sum of every person's weekly total, including archived people who have time in that week.
6. **Changing the week-start setting** changes only how weeks are grouped on screen. The stored data does not change.
7. **Rounding.** All sums are calculated in exact milliseconds. Each displayed figure is rounded **down** to the whole second. Because of this, a column of displayed daily figures can differ from the displayed weekly figure by less than one second per row. The weekly figure is the accurate one.
8. **Display format.** `hh:mm:ss`, where hours can go above 24 (for example `31:04:09`) and are never wrapped to a new day.

## 2f. Persistence

**Where data is stored:** in the browser's `localStorage`, under one key, as a single JSON document holding people, segments, state, and settings.

**What is confirmed about artifact storage:** the artifact platform documentation states the following about `localStorage` in a published artifact:
- It works, and each artifact has its own storage area.
- What is stored stays **only in that viewer's browser**. It is not shared with other viewers or other devices, and Claude cannot read it.
- It survives page reloads and republishing to the same artifact URL.
- It can come back **empty, or be unavailable**, in a private or incognito window, when site data has been cleared or blocked, in previews, or while a thumbnail is being generated.

**What this means for the user:**
- The data survives reloads, closing the tab, and app updates published to the same link.
- The data does **not** carry over to another browser, another device, or a private window.
- Clearing browser data, or the browser deciding to clear storage on its own, deletes the history. The Optional Export feature is the backup against this.
- **Size limit:** browsers commonly allow about 5 MB per site, but this is browser-dependent and **not confirmed** for the artifact host. To verify, check the browser's storage documentation, or test by writing data until a quota error appears. At about 120 bytes per segment, 5 MB would hold more than 40,000 segments.

**Handling failures:**
- Every read and write is wrapped so that a storage failure does not crash the app.
- If storage cannot be written, a visible banner says: "Not saving: history will be lost when this page closes." The clock keeps working for the current visit.

**Recovering a clock left running:**
1. On open, the app loads the saved data. If one segment is open, the clock **continues**, and its time includes the period the page was closed. This follows the timestamp method.
2. If more than **10 minutes** passed between `lastSeenAt` and now (this threshold is an assumption and can be adjusted), the app shows a prompt: "Person A's clock has been running since 9:14 PM yesterday." The prompt offers three choices:
   - **Keep running** (count all of the time)
   - **Stop at last seen** (end the segment at `lastSeenAt`)
   - **Stop at a time I choose** (pick a time between start and now)
3. The prompt never discards time silently. Until the user chooses, the clock keeps running.

**Optional, needs verification:** the artifact platform offers optional runtime capabilities, such as state shared between viewers or a database. Whether these are available depends on the account. Before using one for syncing between devices, the builder must load the platform's `artifact-capabilities` guidance to confirm it is available and what its limits are. This plan does not rely on these capabilities.

## 2g. Interface

**General**
- Every tap target is at least 44 × 44 px. The main switch target is far larger.
- Times are shown as `hh:mm:ss` in a font with equal-width digits, so the numbers do not shift as they change.
- The active person is shown by color **and** by a "RUNNING" label and a border, so the state does not depend on color alone.
- A navigation bar at the bottom has three tabs: **Clock · Day · Week**. Settings are behind a gear icon.
- The layout works at phone width (from 360 px) with 16 px side margins and no sideways scrolling. It supports light and dark mode.

**Clock screen**
- **2 people:** the screen is split into two large halves, like a chess clock. Tapping anywhere on the active half switches to the other person. On a phone, the upper half can be rotated 180° so that two people facing each other can both read it (Optional).
- **3 or more people:** a stack of large tiles in switching order, plus a full-width **NEXT** button at least 25% of the screen height.
- Each tile shows the name, the **session** time (large), and **today's** total (small).
- Pause/Resume and Reset are smaller buttons, placed away from the switch area so they are not tapped by accident. Reset asks for confirmation.
- Banners appear here when needed: "Not saving" and the recovery prompt.

**Daily view**
- A date selector with previous and next arrows. It opens on today.
- One row per person: name and the day's total. The total for the day is shown at the bottom.
- A list of that day's segments: person, start, end, duration. A segment that crosses midnight is marked "continues from / into another day." Tapping a segment opens Edit or Delete. An "Add entry" button adds a manual segment.

**Weekly summary**
- A selector with previous and next week arrows. Its label shows the week's dates (for example "Mon 9 Nov – Sun 15 Nov").
- A table with one row per person and one column per day (7 columns), plus a **Week** column for each person and a **Total** row at the bottom. The bottom-right cell is the weekly total.
- On phones, the table scrolls sideways *inside its own box*, and the name column stays fixed on the left.
- Archived people appear with "(removed)" when they have time in that week.

## 2h. Edge Cases

| Case | Handling |
|---|---|
| **Renaming a person** | Only `name` changes. Segments refer to the person's `id`, so all past days and weeks show the new name. |
| **Removing a person with history** | The person is archived. They are hidden from the clock and the switching order, and their history stays in the reports. A separate "Delete permanently" option deletes the person and their segments after a confirmation that shows the time to be deleted. |
| **Removing the person whose clock is running** | Their segment is closed first. The clock then pauses, so it does not jump to someone else without the user acting. |
| **Removing people until fewer than 2 remain** | Blocked, with a message. A chess clock needs at least 2 people. |
| **Reordering during a session** | Allowed. "Next" follows the new order from the current person. |
| **Wrong tap (switched by mistake)** | Core: edit or delete the segment in the daily view. Optional: an Undo button for 10 seconds. It deletes the new segment and reopens the previous one, as if the tap never happened. |
| **Correcting an entry** | The user can edit start or end, change the person, or delete the segment. The edit is checked: the end must be after the start, the segment must not be in the future, and it **must not overlap any other segment, for any person**, since only one clock runs at a time. A running segment can have its start edited but not its end. Edited segments are marked `source: edited`. |
| **Adding a missed entry** | "Add entry" with person, start, and end. It goes through the same checks. |
| **Clock running across days** | Stored as one segment and split when totals are calculated (2e). The daily view shows it on both days. |
| **Clock running across week boundary** | Split the same way between the two weeks. |
| **Daylight saving: spring forward** | Durations come from UTC timestamps, so a run from 01:30 to 03:30 on the clock is correctly **1:00:00**. That day is 23 hours long. |
| **Daylight saving: fall back** | A run from 01:30 EDT to 01:30 EST is correctly **1:00:00**. That day is 25 hours long. In the segment list, times during the repeated hour show the time-zone abbreviation (EDT/EST) so they are not confused. |
| **Device time zone changes (travel)** | Days are grouped by the device's **current** zone each time totals are shown, so past days may regroup after travel. This is stated in Settings. Storing a zone per segment is out of scope. |
| **Same app open in two tabs** | The app listens for storage changes from other tabs and reloads its state, so both tabs show the same clock. Whichever tap is recorded last wins. Both tabs still follow the one-open-segment rule. |
| **Storage unavailable or full** | A "Not saving" banner appears and the clock keeps working for the current visit (2f). |
| **Segments of zero length** (two taps in the same millisecond) | Discarded. |

## 2i. Build Sequence

| # | Milestone | Testable checkpoint |
|---|---|---|
| 1 | **Data core:** people and segments in memory, start/switch/pause/resume/reset with the one-open-segment rule | Run a scripted sequence of actions and check that the segment list has the expected start and end times, with no gaps, no overlaps, and never two open segments. |
| 2 | **Aggregation:** daily, weekly, and grand total; midnight split; week-start setting; local-day boundaries | Check the totals for test scenarios T4–T6 and T10–T12 against fixed timestamps, with the time zone set to America/New_York. |
| 3 | **Persistence:** save on every action, load on open, handle failures | Reload during Running and during Paused; the state and totals are the same. Block storage and the banner appears. |
| 4 | **Clock screen:** 2-person split layout and the tile layout for 3 or more people | On a 360 px phone width, a tap switches correctly, targets are at least 44 px, and the time shows in hh:mm:ss. |
| 5 | **Recovery prompt:** `lastSeenAt` heartbeat, threshold, three choices | Scenarios T8 and T9 pass. |
| 6 | **Daily view and corrections:** segment list, edit, delete, add, overlap check | Scenarios T13–T15 pass. |
| 7 | **Weekly summary:** table, week navigation, archived people | The bottom-right total equals the sum of the people's week totals. Scenario T6 passes for both week-start settings. |
| 8 | **People management:** add, rename, archive, reorder, delete permanently | Scenarios T16–T18 pass. |
| 9 | **Hardening:** two-tab sync, dark mode, accessibility pass | Scenarios T19 and T20 pass. Keyboard and screen reader can operate Switch and Pause. |
| 10 | **Optional features** (Undo, double-tap guard, Export/Import, Wake Lock), if approved | Each is checked one at a time and none breaks scenarios T1–T20. |

## 2j. Test Plan

Tests that depend on time use a simulated clock and a fixed time zone (**America/New_York**). Browser test tools can do both (for example, Playwright's time zone setting and its clock control).

| # | Scenario | Steps | Expected result |
|---|---|---|---|
| T1 | Basic run | Start A at 10:00:00, pause at 10:12:30 | A today = 00:12:30. One segment, closed. |
| T2 | Switch with no gap | A starts 10:00:00. Tap at 10:05:00 (B starts). Pause at 10:08:00. | A = 00:05:00, B = 00:03:00, day total = 00:08:00. A's end equals B's start exactly. |
| T3 | Only one clock runs | While B runs for 60 s, watch A's display | A's value does not change. The record never holds 2 open segments. |
| T4 | Crossing midnight | A runs from 23:55 on 11 Nov to 00:05 on 12 Nov | 11 Nov: A = 00:05:00. 12 Nov: A = 00:05:00. One stored segment. |
| T5 | Long run across midnight | A runs from 22:00 to 02:00 the next day | First day 02:00:00, second day 02:00:00, week 04:00:00. |
| T6 | Week boundary, both settings | A runs Sun 15 Nov 23:50 → Mon 16 Nov 00:10 | **Monday start:** 10 min in the week of 9 Nov, 10 min in the week of 16 Nov. **Sunday start:** all 20 min in the week starting Sun 15 Nov. |
| T7 | Tab hidden or throttled | A runs. The tab is hidden for 30 simulated minutes, then shown again. | A's display has gone up by 30:00 (±1 s). |
| T8 | Reopen within threshold | A runs. Close the page. Reopen 5 min later. | A is still running. 5 min included. No prompt. |
| T9 | Reopen after threshold | A runs (last seen 21:00). Close. Reopen at 08:00. Choose "Stop at last seen." | Prompt shown. A's segment ends at 21:00. Clock is Paused. No time after 21:00 is counted. |
| T10 | DST spring forward | 8 Mar 2026: A runs 01:30 → 03:30 (clock time) | A = 01:00:00. The day's possible length is 23 h. |
| T11 | DST fall back | 1 Nov 2026: A runs 01:30 EDT → 01:30 EST | A = 01:00:00. The segment list shows EDT/EST. |
| T12 | Full DST day | 1 Nov 2026: A runs from 00:00 to 00:00 the next day | 1 Nov: A = 25:00:00. |
| T13 | Overlap rejected | Edit B's segment so it overlaps A's | Save is blocked with a clear message. Data unchanged. |
| T14 | Invalid edit rejected | Set end before start, or end in the future | Save is blocked. Data unchanged. |
| T15 | Delete a mistaken segment | Delete B's 3-minute segment from T2 | B = 00:00:00. Day total = 00:05:00. |
| T16 | Rename | Rename B to "Carla" | Past daily and weekly views show "Carla". Totals unchanged. |
| T17 | Archive with history | Remove A | A is not on the clock screen. The week view shows "A (removed)" with A's totals. Weekly total unchanged. |
| T18 | Remove the running person | Remove A while A runs | A's segment closes at that moment. Clock Paused. |
| T19 | Reset keeps history | Run A and B, then Reset and confirm | Session counters show 00:00:00. Status Idle. Day and week totals unchanged. |
| T20 | Storage unavailable | Open in a private window, or with storage blocked | "Not saving" banner appears. The clock works for the visit. No crash. |
| T21 | Reload while paused | Pause with B's turn remembered, then reload | Paused, B's turn, same totals. Resume starts B. |
| T22 | Two tabs | Switch in tab 1 | Within a second, tab 2 shows the same active person. Never 2 open segments. |
| T23 | Round-robin with 3 people | A → tap → tap → tap | Order is A → B → C → A. |

---

## Acceptance Criteria

- [ ] At most one clock runs at any moment. The record never holds more than one open segment.
- [ ] A single tap stops the current person and starts the next. Stop and start share one timestamp (no gap, no overlap).
- [ ] Start, Switch, Pause, Resume, and Reset behave as defined in 2b. Reset keeps history.
- [ ] Durations come only from stored start and end timestamps. Nothing is counted tick by tick.
- [ ] Displayed time stays correct after the tab is hidden, throttled, or closed and reopened (T7–T9).
- [ ] Per person per day, per person per week, and weekly totals are correct for T1–T6 and T10–T12.
- [ ] Segments crossing midnight are split across both days. Week boundaries follow the week-start setting.
- [ ] Day boundaries use local time. DST days measure 23 and 25 hours correctly.
- [ ] All times display as `hh:mm:ss`. Hours above 24 are not wrapped.
- [ ] Data survives a reload. Every action is saved immediately.
- [ ] A clock left running is recovered on reopen, and a prompt appears when the gap exceeds the threshold. No time is discarded without the user choosing.
- [ ] Storage failure shows a visible warning and does not crash the app.
- [ ] People can be added, renamed, reordered, and removed (archived) without losing history.
- [ ] Mistaken entries can be edited, deleted, or added. Invalid or overlapping edits are rejected.
- [ ] Clock screen, daily view, and weekly summary all work at 360 px phone width and on desktop, with no sideways page scroll.
- [ ] All tap targets are at least 44 × 44 px. The active person is shown by more than color alone.
- [ ] Every Optional feature that is built is labeled as such and passes T1–T23 without regressions.
