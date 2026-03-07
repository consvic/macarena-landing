# Seed Flavors Script

This project includes a flavor seeding script that upserts flavor records into MongoDB.

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
- `intensity`
- `tags` (string array)
- `price.halfLiter` (number)
- `price.liter` (number)
- `notes` (string array)
- `allergens`
- `gradient`

Example:

```json
[
  {
    "name": "Pistacho de Bronte",
    "description": "Pistacho siciliano tostado, crema ligera y un final salino elegante.",
    "category": "Firmas",
    "base": "Crema",
    "intensity": "Alta",
    "tags": ["Nutty", "Heritage"],
    "price": {
      "halfLiter": 95,
      "liter": 190
    },
    "notes": ["Pistacho DOP", "Sal de mar"],
    "allergens": "Lacteos, frutos secos",
    "gradient": "from-ochre/20 via-light-beige/70 to-cream-white"
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

## Behavior

- Uses **upsert by `name`**.
- Existing matching names are updated.
- New names are inserted.
- `--replace` additionally deletes flavors not present in the seed file.
