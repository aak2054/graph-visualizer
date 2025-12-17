# Interactive Graph Algorithm Visualizer

This Graph Algorithms Visualizer is an interactive web application designed to visualize complex pathfinding algorithms in real-time. It bridges the gap between theoretical computer science and visual learning by allowing users to build their own graphs, run algorithms like **Dijkstra** and **A star Search**, and watch the decision-making process step-by-step.

<img width="1478" height="775" alt="algoview" src="https://github.com/user-attachments/assets/da24d5c0-488f-4d64-8b44-198bc5ad8de6" />

## Key Features

* **Interactive Graph Building:** Users can add nodes, create weighted edges, and drag nodes to rearrange the graph dynamically.
* **Multi-Algorithm Support:**
    * **Dijkstra's Algorithm:** The classic approach for finding the shortest path in weighted graphs.
    * **A* Search (A-Star):** An optimized search using Euclidean Distance heuristics for faster pathfinding.
* **Real-Time Visualization:**
    * **Orange:** Edges currently being "Checked" or "Relaxed."
    * **Blue:** The confirmed history/path taken so far.
    * **Green:** The final shortest path found.
* **Step History Log:** A detailed side-panel log that explains every decision the algorithm makes (Visiting, Checking, Updating).
* **Performance Metrics:** Displays the actual backend execution time (High-Precision in milliseconds) vs. the visualization time.

## Software & Tools

### Frontend
* **React.js (Vite):** For a fast, reactive user interface.
* **SVG (Scalable Vector Graphics):** Used for rendering nodes and edges dynamically.
* **CSS3:** Flexbox layout for the dashboard and logging panel.

### Backend
* **Python (Flask):** Handles the API requests and algorithmic logic.
* **Heapq:** Implements a priority queue for efficient O(E + V log V) performance.
* **Math Module:** Used for calculating Euclidean heuristics in A*.

## ⚙️ Installation & Run Guide

Follow these steps to run the project locally on your machine.

cd graph-visualizer

