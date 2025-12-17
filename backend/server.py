from flask import Flask, request, jsonify
from flask_cors import CORS
import heapq
import time
import math

app = Flask(__name__)
CORS(app)

# FOR A* (Euclidean Distance)
def heuristic(node_id, end_id, node_coords):
    # Get (x, y) for both nodes
    x1, y1 = node_coords[node_id]
    x2, y2 = node_coords[end_id]
    
    return math.sqrt((x1 - x2)**2 + (y1 - y2)**2)

def run_astar(graph, start_node, end_node, node_coords):
    history_log = []
    # Priority Queue stores, (f_score, node) where f = g + h
    pq = [(0, start_node)]
    
    g_score = {node: float('inf') for node in graph} 
    g_score[start_node] = 0
    
    f_score = {node: float('inf') for node in graph} 
    f_score[start_node] = heuristic(start_node, end_node, node_coords)
    
    previous_nodes = {node: None for node in graph}
    visited = set()

    while pq:
        # Pop node with lowest F score
        current_f, current_node = heapq.heappop(pq)
        
        # Log the visit
        history_log.append({
            "type": "VISIT",
            "node": current_node,
            "came_from": previous_nodes[current_node]
        })

        if current_node == end_node:
            history_log.append({"type": "FOUND", "node": current_node})
            break

        if current_node in visited:
            continue
        visited.add(current_node)

        # Check Neighbors
        for neighbor, weight in graph.get(current_node, {}).items():
            tentative_g = g_score[current_node] + weight
            
            history_log.append({
                "type": "CHECK",
                "from": current_node,
                "to": neighbor,
                "weight": weight
            })

            if tentative_g < g_score.get(neighbor, float('inf')):
                previous_nodes[neighbor] = current_node
                g_score[neighbor] = tentative_g
                f = tentative_g + heuristic(neighbor, end_node, node_coords)
                f_score[neighbor] = f
                heapq.heappush(pq, (f, neighbor))

    return history_log, previous_nodes

def run_dijkstra(graph, start_node, end_node):
    history_log = []
    pq = [(0, start_node)]
    distances = {node: float('inf') for node in graph}
    distances[start_node] = 0
    previous_nodes = {node: None for node in graph}
    visited = set()

    while pq:
        current_dist, current_node = heapq.heappop(pq)
        
        history_log.append({
            "type": "VISIT",
            "node": current_node,
            "came_from": previous_nodes[current_node]
        })

        if current_node == end_node:
            history_log.append({"type": "FOUND", "node": current_node})
            break

        if current_node in visited:
            continue
        visited.add(current_node)

        for neighbor, weight in graph.get(current_node, {}).items():
            new_dist = current_dist + weight
            
            history_log.append({
                "type": "CHECK",
                "from": current_node,
                "to": neighbor,
                "weight": weight
            })

            if new_dist < distances.get(neighbor, float('inf')):
                distances[neighbor] = new_dist
                previous_nodes[neighbor] = current_node
                heapq.heappush(pq, (new_dist, neighbor))

    return history_log, previous_nodes

@app.route('/visualize', methods=['POST'])
def solve():
    data = request.json
    nodes = data['nodes']
    edges = data['edges']
    start = str(data['start'])
    end = str(data['end'])
    algo_type = data.get('algorithm', 'dijkstra') 
    
    # Build Graph
    adj_list = {str(n['id']): {} for n in nodes}
    node_coords = {str(n['id']): (n['x'], n['y']) for n in nodes} 

    for edge in edges:
        u, v, w = str(edge['from']), str(edge['to']), int(edge['weight'])
        if u in adj_list and v in adj_list:
             adj_list[u][v] = w
             adj_list[v][u] = w


    start_time = time.time()
    
    if algo_type == 'astar':
        steps, prev_nodes = run_astar(adj_list, start, end, node_coords)
    else:
        steps, prev_nodes = run_dijkstra(adj_list, start, end)
        
    end_time = time.time()
    
    
    execution_time_ms = round((end_time - start_time) * 1000, 4) # Convert to ms

    # Create the Path
    path = []
    curr = end
    if prev_nodes[curr] is not None or curr == start:
        while curr is not None:
            path.append(curr)
            curr = prev_nodes[curr]
    path.reverse()

    if path and path[0] == start and path[-1] == end:
         steps.append({"type": "PATH", "path": path})

    return jsonify({"steps": steps, "time": execution_time_ms})

if __name__ == '__main__':
    app.run(debug=True, port=5000)