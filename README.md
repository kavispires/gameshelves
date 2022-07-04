# Game Shelves

Private project with mapping of my own board game shelves. This repository is public because I'm poor.

## Shelf ID Construction

`<wall>-<container>-<part_id>`

wall values:

- ew: east wall, the one with no windows
- ww: west wall, the one with the big window

container values:

- sl: shelf left
- sc: shelf center
- sr: shelf right
- cl: cabinet left
- cr: cabinet right
- dc: drawer center

part_id are numbers always starting coming from 0

## Collections:

- games/<game-id> -  each board game geek entry
- general/shelves - object with all games in shelves by <game-id> but only boxed games
- ~~general/unshelved - object with all games that are not in shelves~~
- ~~general/all-games - object with snippet information about each game (name, image, type) [I think I don't need this, if I expand the .contains field in shelves to have these 3 information]~~

## Routes

### /

- Search bar that autocompletes game names (search-query field) in /general/shelves
- On search, goes to page results

### /search

- Displays shelf and position of searched game, search bar is still available at the top
- If the game is unshelved, show button to shelve it (UI display image and click on the shelf part)

### /shelves

- Display shelves and option to select and see what games are stored there

### /sync

When wanting to update the game collection, a sync is necessary. It uses the CSV data and the XML data from BGG.
After both are parsed, it verifies what entries are new by checking against all-games (auto-generated from .contains)

- If the user selects `Add New Only`:
  -- Prompt every entry to select it's type and if it's boxed nor not [check if there's any other required information to do here]
  -- Adds entries in `games/`
  -- Adds entries in shelves as `shelfId: unshelved`
- If the users selects `Resync All`:
- Saves every entry in `games` (it costs firebase writes)
- For new games it does the new game only process

## /update

Allows update information about a game, more particularly in /shelves
Rules: A non-boxed game can never contain another

- Add fields to /shelves
  -- soundtrack?: string - link to spotify suggested soundtrack
  -- metalCints?: boolean
