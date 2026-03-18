# Questions for Starlive Developer

These questions need answers before we can finalize the camera integration. Gathered during design phase (2026-03-19).

## API Delivery

1. **How is data delivered?** Push (webhook after each match) or pull (we call your API)? Or both?
2. **API authentication** — API key, OAuth, or something else?
3. **Rate limits** — any throttling on API calls?
4. **Base URL** — what's the API endpoint structure?

## Data Mapping

5. **Do these 3 JSON samples correspond to 3 separate API endpoints?** Or is it one endpoint with different query params?
   - `index.json` = player profile + per-match stats
   - `index-2.json` = heatmap coordinates for a player in a match
   - `index-3.json` = full match report (team stats + widgets)

6. **Player IDs** — are player IDs stable across matches? How do we map your player IDs to ours? Can we register our own player IDs with you?

7. **Match/Activity IDs** — how do we discover new matches? Is there a "list recent matches" endpoint, or do you notify us?

8. **Team IDs** — how do team IDs in your system map to our clubs? Is it by team name, or can we register a mapping?

## Video

9. **Video files** — the match data has `video_start`/`video_end` timestamps but no video URLs. How do we get the actual video? Separate endpoint? Streaming URL? Direct file download?

10. **Highlight clips** — can we get pre-cut clips for specific events (goals, assists, key passes)? Or do we need to cut them ourselves from the full match video using the timestamps?

11. **Video hosting** — do you host the video (we get a streaming URL) or do we need to store it ourselves?

## Data Freshness

12. **How soon after a match** is the data available via API?

13. **Does data get updated/corrected** after initial processing? If so, how do we know when to re-fetch?

14. **Historical data** — can we pull data for matches that happened before we integrated?

## Scope

15. **Which clubs/teams** are currently covered by your cameras in Georgia?

16. **Training sessions** — the data has a `training_part_id` field. Do you also provide training session data, or only matches?

17. **Are all stat types always present**, or do some matches have fewer stats depending on camera setup/quality?

## Heatmap Data

18. **How is the heatmap data linked to a specific match?** The heatmap JSON sample has no match ID, date, or activity reference — just a player key and coordinates. How do we know which match a heatmap belongs to? Is it a query parameter (e.g. `GET /heatmap?player_id=12&match_id=56`)? Or is it embedded in a larger response?

19. **What does the player key in the heatmap represent?** In the sample, the root key is `"12"` — is this the Starlive player_id, jersey number, or something else?
