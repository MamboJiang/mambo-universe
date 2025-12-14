# MamboJiang's Universe (成分宇宙)

A personal interactive knowledge graph visualized as a 2D force-directed universe. Built with Next.js and `react-force-graph`.

![Universe Preview](https://github.com/mambojiang/personal-component/assets/placeholder.png)

## 🌌 Features

- **Interactive 2D Graph**: Physics-based visualization using `react-force-graph-2d`.
- **Literary Aesthetics**: Designed with a Zen Old Mincho serif font and a curated Japanese Traditional Colors palette (20 colors).
- **Bilingual Support**: Toggle between **English** and **Chinese** instantly.
- **Deep Zoom & LOD**: 
  - Dynamic Level of Detail (LOD) renders distant nodes as dots and close nodes as text.
  - Supports deep zoom (up to 5x) for exploring nested sub-universes.
- **Recursive Data Architecture**: 
  - Data is split into multiple JSON files (e.g., `Guitar.json` is loaded on-demand).
  - Scalable for large datasets.
- **Rich Interactions**:
  - Click to focus and open details sidebar.
  - "Drill-down" into sub-universes (underlined nodes).
  - Breadcrumb navigation.

## 🛠 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Graph Engine**: [react-force-graph-2d](https://github.com/vasturiano/react-force-graph)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Zen Old Mincho (via `next/font`)

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mambojiang/personal-component.git
    cd personal-component
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Visit [http://localhost:3000](http://localhost:3000).

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

## 📄 License

MIT
