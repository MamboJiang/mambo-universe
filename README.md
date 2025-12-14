# Mambo Universe

A personal interactive knowledge graph visualized as a 2D force-directed universe. Built with Next.js and `react-force-graph`.

## 🛠 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Graph Engine**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Zen Old Mincho (via `next/font`)


## 📂 Data Structure

The universe data is located in `public/data/`.

- `public/data/en/`: English JSON files.
- `public/data/zh/`: Chinese JSON files.

### Adding New Nodes
To add a new node, edit `universe.json` or create a new JSON file (e.g., `Code.json`) and link it in the parent:

```json
{
  "id": "My Node",
  "group": 3,
  "description": "Description here...",
  "relations": [
        {
            "targetId": "Target",
            "type": "dashed",
            "label": "Label in the line"
        }
    ]
  "children": [
      {
         "id": "SubFile.json", 
         "group": 4 
      } 
  ]
}
```
