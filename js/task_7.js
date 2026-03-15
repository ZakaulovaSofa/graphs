/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');

    if (!inputBlockContent || !outputPre || !startButton) {
        console.error('Не найдены нужные элементы страницы для task_7.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('adjacencyListInput').value;
            const graph = parseAndValidateWeightedAdjacencyList(rawText);
            const mstResult = prim(graph, 1);

            outputPre.textContent = formatMSTResult(graph, mstResult);
            renderTask7Graph(graph, mstResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task7-input-wrapper">
            <label for="adjacencyListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите взвешенный граф списками смежности
            </label>

            <textarea
                id="adjacencyListInput"
                rows="14"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1: 2(4) 3(2)
2: 1(4) 3(1) 4(5)
3: 1(2) 2(1) 4(8)
4: 2(5) 3(8)"
            >1: 2(4) 3(2)
2: 1(4) 3(1) 4(5)
3: 1(2) 2(1) 4(8)
4: 2(5) 3(8)</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка задаёт одну вершину:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">номер_вершины: сосед1(вес1) сосед2(вес2)</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1: 2(4) 3(2)
2: 1(4) 3(1) 4(5)
3: 1(2) 2(1) 4(8)
4: 2(5) 3(8)</pre>
            </div>
        </div>
    `;
}

function parseAndValidateWeightedAdjacencyList(rawText) {
    if (!rawText || !rawText.trim()) {
        throw new Error('Поле ввода пустое.');
    }

    const lines = rawText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (lines.length === 0) {
        throw new Error('Не удалось прочитать ни одной строки с описанием графа.');
    }

    const parsed = new Map();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\d+)\s*:\s*(.*)$/);

        if (!match) {
            throw new Error(
                `Неверный формат строки ${i + 1}: "${line}". Ожидается формат "вершина: сосед(вес) сосед(вес)".`
            );
        }

        const vertex = Number(match[1]);
        const rightPart = match[2].trim();

        if (vertex <= 0) {
            throw new Error(`Номер вершины должен быть положительным числом. Ошибка в строке ${i + 1}.`);
        }

        if (parsed.has(vertex)) {
            throw new Error(`Вершина ${vertex} описана более одного раза.`);
        }

        const neighbors = [];

        if (rightPart.length > 0) {
            const tokens = rightPart.split(/\s+/);

            for (const token of tokens) {
                const pairMatch = token.match(/^(\d+)\((-?\d+(?:\.\d+)?)\)$/);

                if (!pairMatch) {
                    throw new Error(
                        `Некорректная запись "${token}" в строке ${i + 1}. Используйте формат сосед(вес), например 2(5).`
                    );
                }

                const neighbour = Number(pairMatch[1]);
                const weight = Number(pairMatch[2]);

                if (!Number.isFinite(weight)) {
                    throw new Error(`Некорректный вес у ребра ${vertex} - ${neighbour}.`);
                }

                neighbors.push({ to: neighbour, weight: weight });
            }
        }

        const uniqueNeighbors = new Map();

        for (const item of neighbors) {
            if (item.to <= 0) {
                throw new Error(`Сосед вершины ${vertex} должен быть положительным числом.`);
            }

            if (item.to === vertex) {
                throw new Error(`Обнаружена петля: вершина ${vertex} соединена сама с собой.`);
            }

            if (uniqueNeighbors.has(item.to)) {
                throw new Error(`У вершины ${vertex} сосед ${item.to} указан более одного раза.`);
            }

            uniqueNeighbors.set(item.to, item.weight);
        }

        parsed.set(vertex, Array.from(uniqueNeighbors.entries()).map(([to, weight]) => ({ to, weight })));
    }

    const vertices = Array.from(parsed.keys()).sort((a, b) => a - b);
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
        const expected = i + 1;
        if (vertices[i] !== expected) {
            throw new Error(
                `Вершины должны быть пронумерованы подряд от 1 до n без пропусков. Ожидалась вершина ${expected}, но найдена ${vertices[i]}.`
            );
        }
    }

    const graph = Array.from({ length: n + 1 }, () => []);

    for (let v = 1; v <= n; v++) {
        const neighbors = parsed.get(v);

        for (const item of neighbors) {
            if (item.to < 1 || item.to > n) {
                throw new Error(
                    `Вершина ${v} ссылается на несуществующую вершину ${item.to}. Допустимые номера: от 1 до ${n}.`
                );
            }
        }

        graph[v] = neighbors
            .map(item => ({ to: item.to, weight: item.weight }))
            .sort((a, b) => a.to - b.to);
    }

    for (let v = 1; v <= n; v++) {
        for (const item of graph[v]) {
            const reverse = graph[item.to].find(edge => edge.to === v);

            if (!reverse) {
                throw new Error(
                    `Граф должен быть неориентированным: вершина ${v} содержит ${item.to}, но у вершины ${item.to} нет ${v}.`
                );
            }

            if (reverse.weight !== item.weight) {
                throw new Error(
                    `Для ребра ${v} - ${item.to} указаны разные веса в списках смежности.`
                );
            }
        }
    }

    return graph;
}

function prim(graph, start) {
    const n = graph.length - 1;
    const visited = Array(n + 1).fill(false);
    const minHeap = [{ weight: 0, vertex: start, parent: -1 }];
    let totalWeight = 0;
    const mstEdges = [];

    while (minHeap.length > 0) {
        minHeap.sort((a, b) => {
            if (a.weight !== b.weight) {
                return a.weight - b.weight;
            }
            if (a.vertex !== b.vertex) {
                return a.vertex - b.vertex;
            }
            return a.parent - b.parent;
        });

        const current = minHeap.shift();
        const weight = current.weight;
        const u = current.vertex;
        const parent = current.parent;

        if (visited[u]) {
            continue;
        }

        visited[u] = true;
        totalWeight += weight;

        if (parent !== -1) {
            mstEdges.push({
                from: parent,
                to: u,
                weight: weight
            });
        }

        for (const edge of graph[u]) {
            if (!visited[edge.to]) {
                minHeap.push({
                    weight: edge.weight,
                    vertex: edge.to,
                    parent: u
                });
            }
        }
    }

    const isConnected = visited.slice(1).every(Boolean);

    if (!isConnected) {
        return {
            exists: false,
            totalWeight: null,
            edges: []
        };
    }

    return {
        exists: true,
        totalWeight: totalWeight,
        edges: mstEdges
    };
}

function formatMSTResult(graph, mstResult) {
    const lines = [];

    if (!mstResult.exists) {
        lines.push('Минимальное остовное дерево не существует, так как граф несвязный.');
        return lines.join('\n');
    }

    lines.push(`Суммарный вес MST: ${mstResult.totalWeight}`);
    lines.push('Рёбра MST:');

    if (mstResult.edges.length === 0) {
        lines.push('Граф состоит из одной вершины, рёбер в остове нет.');
        return lines.join('\n');
    }

    for (const edge of mstResult.edges) {
        lines.push(`${edge.from} - ${edge.to} (вес: ${edge.weight})`);
    }

    return lines.join('\n');
}

function buildCytoscapeElements(graph) {
    const elements = [];
    const n = graph.length - 1;
    const addedEdges = new Set();

    for (let v = 1; v <= n; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    for (let v = 1; v <= n; v++) {
        for (const item of graph[v]) {
            const a = Math.min(v, item.to);
            const b = Math.max(v, item.to);
            const edgeId = `${a}-${b}`;

            if (!addedEdges.has(edgeId)) {
                addedEdges.add(edgeId);
                elements.push({
                    data: {
                        id: edgeId,
                        source: String(a),
                        target: String(b),
                        weight: String(item.weight)
                    }
                });
            }
        }
    }

    return elements;
}

function getTask7Style() {
    const style = getDefaultCytoscapeStyle().slice();

    style.push({
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-wrap': 'none'
        }
    });

    style.push({
        selector: 'edge',
        style: {
            'label': 'data(weight)',
            'font-size': '14px',
            'color': '#7a3e3e',
            'text-background-color': '#FFEEEE',
            'text-background-opacity': 1,
            'text-background-padding': 3,
            'text-border-opacity': 0,
            'text-rotation': 'autorotate'
        }
    });

    return style;
}

function renderTask7Graph(graph, mstResult) {
    const elements = buildCytoscapeElements(graph);

    const cy = renderGraphInContainer('cy', elements, {
        style: getTask7Style()
    });

    if (!cy) {
        return;
    }

    if (mstResult.exists) {
        highlightMSTEdges(cy, mstResult.edges);
    }
}

function highlightMSTEdges(cy, mstEdges) {
    const mstEdgeIds = new Set();

    for (const edge of mstEdges) {
        const a = Math.min(edge.from, edge.to);
        const b = Math.max(edge.from, edge.to);
        mstEdgeIds.add(`${a}-${b}`);
    }

    cy.edges().forEach(edge => {
        if (mstEdgeIds.has(edge.id())) {
            edge.style({
                'line-color': '#ffd166',
                'width': 6,
                'target-arrow-color': '#ffd166',
                'z-index': 999
            });
        } else {
            edge.style({
                'line-color': '#E36D6D',
                'width': 3
            });
        }
    });
}