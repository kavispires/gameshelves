# Game Shelves

A personal board-game inventory that answers: **"Where did I put that game?"**

Game Shelves connects your BoardGameGeek (BGG) collection to your actual boxes and shelves.
A base game, its expansions, and its promos can live together in one box, with one recorded location.

## What you can do

Sign in with an existing Firebase email/password account. All signed-in accounts share one
global library; signing in does not create a separate collection.

| Page           | What it does                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Find Game**  | Search every imported game, including expansions, promos and games not assigned to a box. Open a result to see its box and shelf location. |
| **Game Night** | Placeholder for planning a game night and choosing games.                                                                                  |
| **Shelves**    | Switch between shelf illustrations and a full box table. Open a shelf to browse its boxes, add boxes or change their locations.            |
| **Friends**    | Placeholder for friends and their game ratings.                                                                                            |
| **Settings**   | Upload a complete BGG collection CSV, review changes and confirm the import. Reload saved data to pick up changes from another device.     |

## Your catalog and your boxes

The **catalog** keeps selected BGG facts: ID, name, release year, ownership/preorder status,
game/expansion classification, player counts and recommendations, playtime, complexity, ratings,
rank, recommended age and language dependence. Known cover and thumbnail links also live here.
Prices, private comments, play counts, edition details and other unused export fields are discarded.

**Boxes** describe your physical collection: a box-size category, optional external dimensions
in millimeters, shelf location and the games inside. An original box's ID matches its main game's BGG ID.
Standalone containers, such as the **Promos shoe box**, have their own ID and name without a main
BGG game. They remain even when empty.
Each game can live in at most one box; boxes cannot contain other boxes.

New games start **not assigned to a box**. From a game's details you can create its original box
or assign it to an existing box. Removing a box assignment does not delete the game.
You can change a game's classification, for example to promo, independently of BGG's category.
Game details use a compact layout and show only the shelf containing that game, with its
compartment highlighted. Boxes without a shelf assignment show the unshelved pile instead.

Games and expansions have their own `/games/:gameId` pages; physical boxes live at
`/boxes/:boxId`, including standalone containers. Links from the old detail URLs redirect
to the corresponding game or box.

Dimensions are optional for now. Enter all three positive measurements of the closed box:
width, height and depth. Shelving does not yet require dimensions or calculate whether a box fits.
A box marked `unshelved` exists but has no assigned shelf.

The shelf illustrations adapt to your screen: separate East, West, TV and unshelved sections
sit side by side on wide screens, use two columns on tablets and stack on phones.
Select a compartment in **Shelves**, or use its location picker on smaller screens, to open
that location's `/shelves/:shelfId` page. **Add boxes** moves existing boxes into that shelf.
Switch the overview to **Table** to browse every physical box, including unshelved containers.
Both tables let you search box/game names, filter by shelf or size, paginate and sort every
data column: box, shelf, size, width, height, depth, game count and contents.
Location dropdowns save moves immediately. **Remove from shelf** asks for confirmation and
moves the box to unshelved; it never deletes the box or its contents.
The TV cabinet has four game compartments; its two open equipment cubbies are not game locations.
The unshelved pile counts physical boxes, not every expansion or promo inside them.

## Importing from BGG

Import is **manual and one-way**. It does not update BGG or run automatically.

1. Export your **complete collection** as CSV from BGG. Filtered/partial exports are not supported.
2. Choose the CSV in **Settings**. It is parsed locally; choosing a file does not save it.
   No JSON conversion or XML file is needed.
3. Review the additions, updates and removals. Only owned/preordered games are included.
4. Confirm that the file is your complete collection. If games are being removed, explicitly
   approve the removal list too.
5. Review the final confirmation and save.

Imports refresh BGG facts but preserve existing classification, box contents, measurements,
shelf locations and cover links. They do not require you to organize new purchases immediately.
Equivalent duplicate BGG rows collapse into one game; conflicting duplicates and invalid files
block import. An export with no eligible games cannot erase the library.

A game missing from the imported collection is removed from the **active library** after confirmation.
If its original box held games you still own, those games remain in the catalog but become unassigned;
the preview warns you. Removing an expansion does not remove its containing box.

CSV exports contain an image identifier, **not cover URLs**. Existing covers are preserved; games
without known URLs show a placeholder. Automatic image fetching and XML enrichment are not included.
To add or replace a cover, open the game's details, use **View on BoardGameGeek**, open an image
and copy its image address into **Image URL**. Save the box, or choose **Save game details** if the
game has no box of its own. The saved URL is used for both the cover and thumbnail.

Changing the local `collection.csv` file alone does not change the app.

## Where your data lives

Firestore is the live database. After migration, the app reads two shared documents:

| Firestore document | Contents                                                            |
| ------------------ | ------------------------------------------------------------------- |
| `general/catalog`  | The game catalog, including known covers and manual classification. |
| `general/boxes`    | Physical boxes, their contents, dimensions and shelf locations.     |

The app loads them once per signed-in app session and reuses the data across pages. Search does not
read Firestore as you type. Successful saves update the browser cache directly; other-device changes
appear after **Reload saved library** in Settings or a reload. This button only reads saved data;
it never applies a CSV and clears any unsaved import preview. Saves may reread the documents to check
for conflicts. If the library changed since your preview, refresh and rebuild it instead of overwriting.

Catalog and box changes save together atomically. Each document has a conservative 800 KiB budget,
below Firestore's 1 MiB limit. Oversized imports are blocked before writing; partitioning into
additional documents is future work.

### First import and existing libraries

Before migration, the existing library remains readable but organization editing is disabled.
Migration happens only through the first confirmed CSV import in Settings, never simply by signing in.
The first preview also reads legacy game records once to recover cover URLs and classification
that might never have reached the old shared documents.
It preserves known covers and physical organization, including the standalone promos container.
Ambiguous main-game IDs in original game boxes, duplicate assignments
or invalid measurements block migration with an explanation; resolve those legacy entries before retrying.

The old `general/shelved-games`, `general/images` and `games/{game-id}` records remain untouched
as backups. The app stops reading them after migration; cleanup requires a separate decision.
Removed games can remain in these backups until then.

### Database setup

Before using the new import, manually publish the supplied [Firestore rules](./firestore.rules)
in Firebase Console, merging any rules needed by other apps. They allow authenticated access to
the new documents and read-only access to the legacy records; publishing them prevents older app
versions from continuing to write the legacy stores.

Also add **single-field index exemptions** for the `games` and `boxes` map fields in collection
`general`, disabling ascending, descending and array indexes (including inherited map-subfield
indexes). [firestore.indexes.json](./firestore.indexes.json) records the configuration.
These maps are loaded whole, not searched with Firestore queries; indexing every nested game field
can exceed Firestore's index limits. Neither file takes effect until you apply it.

## Not included yet

Independent tracking of multiple copies/editions, a new shelf model, automatic organization,
friend ratings and game-night recommendations are future work.
