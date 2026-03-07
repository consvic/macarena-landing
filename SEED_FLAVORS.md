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

## Behavior

- Uses **upsert by `name`**.
- Existing matching names are updated.
- New names are inserted.
- `--replace` additionally deletes flavors not present in the seed file.
