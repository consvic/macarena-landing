# Flavor Scripts

This project includes scripts to seed flavors into MongoDB and update the `exists` flag on current flavor records.

## Prerequisites

Set these environment variables in `.env`:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

## JSON format

The seed file must be a JSON array.

Each flavor must include:

- `name`
- `description`
- `category`
- `base`
- `tags` (string array)
- `price.halfLiter` (number)
- `price.liter` (number)
- `allergens`
- `gradient`
- `coverImage` (string path, for example `/flavor-images/mango-maracuya.PNG`)

Example:

```json
[
  {
    "name": "Mango Maracuya",
    "description": "Sorbet tropical de mango maduro y maracuya, con acidez vibrante y final jugoso.",
    "category": "Temporada Primavera",
    "base": "Agua",
    "tags": ["Tropical", "Frutal", "Primavera"],
    "price": {
      "halfLiter": 150,
      "liter": 280
    },
    "allergens": "Sin lacteos. Puede contener trazas.",
    "gradient": "from-ochre/45 via-terracotta/30 to-light-beige/80",
    "coverImage": "/flavor-images/mango-maracuya.PNG"
  }
]
```

## Commands

Seed from a project-relative path:

```bash
npm run seed:flavors -- src/lib/flavors.json
```

Seed from another JSON file:

```bash
npm run seed:flavors -- examples/flavors.mock.json
```

Seed and remove DB flavors that are not present in the file:

```bash
npm run seed:flavors -- src/lib/flavors.json --replace
```

Set `exists` on all current flavor records:

```bash
npm run backfill:flavor-existence -- true
```

Set all current flavor records to `exists: false`:

```bash
npm run backfill:flavor-existence -- false
```

## Behavior

- Uses **upsert by `name`**.
- Existing matching names are updated.
- New names are inserted.
- `--replace` additionally deletes flavors not present in the seed file.
- `backfill:flavor-existence -- <true|false>` updates every existing flavor document to the provided `exists` value.
