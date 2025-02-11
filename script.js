// script.js

let maze = [];
let start = { x: 0, y: 0 };
let end = { x: 0, y: 0 };
let playerPos = { x: 0, y: 0 };
let aiPos = { x: 0, y: 0 };
let mode = '';

function generateMaze() {
    const size = document.getElementById('size').value;
    maze = Array.from({ length: size }, () => Array(size).fill(0));
    start = { x: 0, y: 0 };
    end = { x: size - 1, y: size - 1 };
    playerPos = { ...start };
    aiPos = { ...start };

    // 使用随机生成算法创建迷宫
    createMaze(size);

    renderMaze();
}

function createMaze(size) {
    // 简单的随机墙生成算法
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (Math.random() > 0.7 && !(i === start.x && j === start.y) && !(i === end.x && j === end.y)) {
                maze[i][j] = 1; // 墙
            } else {
                maze[i][j] = 0; // 路
            }
        }
    }

    // 确保有通路（使用DFS检查）
    ensurePathExists(start, end);
}

function ensurePathExists(start, end) {
    const visited = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(false));
    const stack = [start];

    while (stack.length > 0) {
        const current = stack.pop();
        if (current.x === end.x && current.y === end.y) return true;

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!visited[neighbor.x][neighbor.y] && maze[neighbor.x][neighbor.y] !== 1) {
                visited[neighbor.x][neighbor.y] = true;
                stack.push(neighbor);
            }
        }
    }

    // 如果没有通路，重新生成
    if (!visited[end.x][end.y]) {
        createMaze(maze.length);
    }
}

function getNeighbors(pos) {
    const dirs = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
    ];
    const neighbors = [];
    for (const dir of dirs) {
        const newX = pos.x + dir.dx;
        const newY = pos.y + dir.dy;
        if (newX >= 0 && newX < maze.length && newY >= 0 && newY < maze[0].length) {
            neighbors.push({ x: newX, y: newY });
        }
    }
    return neighbors;
}

function renderMaze() {
    const container = document.getElementById('maze-container');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${maze.length}, 1fr)`;

    maze.forEach((row, i) => {
        row.forEach((cell, j) => {
            const div = document.createElement('div');
            div.classList.add('cell');
            if (maze[i][j] === 1) div.classList.add('wall');
            if (i === start.x && j === start.y) div.classList.add('start');
            if (i === end.x && j === end.y) div.classList.add('end');
            if (i === playerPos.x && j === playerPos.y) div.classList.add('player');
            if (i === aiPos.x && j === aiPos.y) div.classList.add('ai');
            container.appendChild(div);
        });
    });
}

function startGame(selectedMode) {
    mode = selectedMode;
    if (mode === 'single') {
        document.getElementById('status').textContent = '单人模式开始！';
        document.addEventListener('keydown', handlePlayerMove);
    } else if (mode === 'ai') {
        document.getElementById('status').textContent = 'AI表演开始！';
        performAISearch('bfs'); // 默认使用BFS，可选其他算法
    } else if (mode === 'vs') {
        document.getElementById('status').textContent = '对战AI开始！';
        document.addEventListener('keydown', handlePlayerMove);
        setTimeout(() => performAISearch('a*'), 100); // AI延迟启动
    }
}

function handlePlayerMove(event) {
    const directions = {
        ArrowUp: { dx: -1, dy: 0 },
        ArrowDown: { dx: 1, dy: 0 },
        ArrowLeft: { dx: 0, dy: -1 },
        ArrowRight: { dx: 0, dy: 1 }
    };

    const dir = directions[event.key];
    if (!dir) return;

    const newX = playerPos.x + dir.dx;
    const newY = playerPos.y + dir.dy;

    if (newX >= 0 && newX < maze.length && newY >= 0 && newY < maze[0].length && maze[newX][newY] !== 1) {
        playerPos = { x: newX, y: newY };
        if (playerPos.x === end.x && playerPos.y === end.y) {
            document.getElementById('status').textContent = '玩家胜利！';
            document.removeEventListener('keydown', handlePlayerMove);
        }
        renderMaze();
    }
}

function performAISearch(algorithm) {
    let path = [];
    if (algorithm === 'bfs') {
        path = bfs(start, end);
    } else if (algorithm === 'a*') {
        path = aStar(start, end);
    }

    const interval = setInterval(() => {
        if (path.length === 0) {
            clearInterval(interval);
            document.getElementById('status').textContent = 'AI到达终点！';
            return;
        }
        const nextStep = path.shift();
        aiPos = { x: nextStep.x, y: nextStep.y };
        renderMaze();
    }, 100);
}

function bfs(start, end) {
    const queue = [{ node: start, path: [] }];
    const visited = Array.from({ length: maze.length }, () => Array(maze[0].length).fill(false));

    while (queue.length > 0) {
        const { node, path } = queue.shift();
        if (node.x === end.x && node.y === end.y) return path.concat([node]);

        const neighbors = getNeighbors(node);
        for (const neighbor of neighbors) {
            if (!visited[neighbor.x][neighbor.y] && maze[neighbor.x][neighbor.y] !== 1) {
                visited[neighbor.x][neighbor.y] = true;
                queue.push({ node: neighbor, path: path.concat([node]) });
            }
        }
    }
    return [];
}

function aStar(start, end) {
    const openSet = [start];
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    gScore[start.x + ',' + start.y] = 0;
    fScore[start.x + ',' + start.y] = heuristic(start, end);

    while (openSet.length > 0) {
        const current = getLowestFScore(openSet, fScore);
        if (current.x === end.x && current.y === end.y) {
            return reconstructPath(cameFrom, current);
        }

        openSet.splice(openSet.indexOf(current), 1);
        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (maze[neighbor.x][neighbor.y] === 1) continue;
            const tentativeGScore = gScore[current.x + ',' + current.y] + 1;
            if (!(neighbor.x + ',' + neighbor.y in gScore) || tentativeGScore < gScore[neighbor.x + ',' + neighbor.y]) {
                cameFrom[neighbor.x + ',' + neighbor.y] = current;
                gScore[neighbor.x + ',' + neighbor.y] = tentativeGScore;
                fScore[neighbor.x + ',' + neighbor.y] = tentativeGScore + heuristic(neighbor, end);
                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return [];
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getLowestFScore(nodes, fScore) {
    return nodes.reduce((lowest, node) => {
        const fs = fScore[node.x + ',' + node.y];
        return fs < fScore[lowest.x + ',' + lowest.y] ? node : lowest;
    });
}

function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    let key = current.x + ',' + current.y;
    while (key in cameFrom) {
        current = cameFrom[key];
        totalPath.unshift(current);
        key = current.x + ',' + current.y;
    }
    return totalPath;
}