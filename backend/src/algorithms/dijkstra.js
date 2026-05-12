function dijkstra(graph, startNode, endNode) {
  const distances = {};
  const prev = {};
  const nodes = new Set();

  for (let node in graph) {
    distances[node] = Infinity;
    prev[node] = null;
    nodes.add(node);
  }
  distances[startNode] = 0;

  while (nodes.size > 0) {
    let closestNode = null;
    for (let node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    }

    if (!closestNode || distances[closestNode] === Infinity || closestNode === endNode) {
      break;
    }

    nodes.delete(closestNode);

    for (let neighbor in graph[closestNode]) {
      let alt = distances[closestNode] + graph[closestNode][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = closestNode;
      }
    }
  }

  const path = [];
  let curr = endNode;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  return {
    distance: distances[endNode],
    path: path.length > 1 || path[0] === startNode ? path : []
  };
}
module.exports = dijkstra;