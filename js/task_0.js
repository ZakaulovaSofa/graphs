/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');
    const graphContainer = document.querySelector('.graph-container');

    if (!inputBlockContent || !outputPre || !startButton || !graphContainer) {
        console.error('Не найдены нужные элементы страницы для task_0.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('adjacencyListInput').value;
            const graph = parseAndValidateAdjacencyList(rawText);
            const analysis = analyzeGraph(graph);

            outputPre.textContent = formatAnalysisResult(graph, analysis);
            renderGraph(graph);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError(error.message);
        }
    });
});

function buildCytoscapeElements(graph) {
    const elements = [];
    const n = graph.length - 1;

    for (let v = 1; v <= n; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    const addedEdges = new Set();

    for (let v = 1; v <= n; v++) {
        for (const u of graph[v]) {
            const a = Math.min(v, u);
            const b = Math.max(v, u);
            const edgeId = `${a}-${b}`;

            if (!addedEdges.has(edgeId)) {
                addedEdges.add(edgeId);
                elements.push({
                    data: {
                        id: edgeId,
                        source: String(a),
                        target: String(b)
                    }
                });
            }
        }
    }

    return elements;
}

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task0-input-wrapper">
            <label for="adjacencyListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите граф списками смежности
            </label>

            <textarea
                id="adjacencyListInput"
                rows="14"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1: 2 3
2: 1 3
3: 1 2 4
4: 3"
            >1: 2 3
2: 1 3
3: 1 2 4
4: 3</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка задаёт одну вершину:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">номер_вершины: сосед1 сосед2 сосед3</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1: 2 3
2: 1 3
3: 1 2
4:</pre>
            </div>
        </div>
    `;
}

function buildGraphPlaceholder(container) {
    container.innerHTML = `
        <div id="graphViewArea" style="width:100%; min-height:420px; display:flex; align-items:center; justify-content:center; text-align:center; padding:20px; box-sizing:border-box;">
            <div>
                <p class="placeholder-text">Визуализация пока не подключена</p>
                <p class="placeholder-hint">После нажатия «Начать» здесь можно будет отрисовать граф через Cytoscape</p>
            </div>
        </div>
    `;
}

let cy = null;

function renderGraph(graph) {
    const elements = buildCytoscapeElements(graph);
    renderGraphInContainer('cy', elements);
}

function renderGraphError(message) {
    renderGraphError('cy', message);
}



function parseAndValidateAdjacencyList(rawText) {
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
                `Неверный формат строки ${i + 1}: "${line}". Ожидается формат "вершина: список соседей".`
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

        let neighbors = [];
        if (rightPart.length > 0) {
            const tokens = rightPart.split(/\s+/);

            for (const token of tokens) {
                if (!/^\d+$/.test(token)) {
                    throw new Error(
                        `В строке ${i + 1} найден некорректный сосед "${token}". Соседи должны быть целыми положительными числами.`
                    );
                }
                neighbors.push(Number(token));
            }
        }

        const uniqueNeighbors = new Set();
        for (const neighbor of neighbors) {
            if (neighbor <= 0) {
                throw new Error(`Сосед вершины ${vertex} должен быть положительным числом.`);
            }
            if (neighbor === vertex) {
                throw new Error(`Обнаружена петля: вершина ${vertex} смежна сама с собой.`);
            }
            if (uniqueNeighbors.has(neighbor)) {
                throw new Error(`У вершины ${vertex} сосед ${neighbor} указан более одного раза.`);
            }
            uniqueNeighbors.add(neighbor);
        }

        parsed.set(vertex, Array.from(uniqueNeighbors));
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

        for (const u of neighbors) {
            if (u < 1 || u > n) {
                throw new Error(
                    `Вершина ${v} ссылается на несуществующую вершину ${u}. Допустимые номера: от 1 до ${n}.`
                );
            }
        }

        graph[v] = [...neighbors].sort((a, b) => a - b);
    }

    for (let v = 1; v <= n; v++) {
        for (const u of graph[v]) {
            if (!graph[u].includes(v)) {
                throw new Error(
                    `Граф должен быть неориентированным: вершина ${v} содержит ${u}, но у вершины ${u} нет ${v}.`
                );
            }
        }
    }

    return graph;
}

function analyzeGraph(graph) {
    const n = graph.length - 1;

    const degrees = Array(n + 1).fill(0);
    let oddCount = 0;

    for (let v = 1; v <= n; v++) {
        degrees[v] = graph[v].length;
        if (degrees[v] % 2 !== 0) {
            oddCount++;
        }
    }

    const components = findNumberOfComponents(graph);
    const eulerStatus = getEulerStatus(components, oddCount);
    const bipartiteResult = isBipartite(graph);

    let completeBipartite = false;
    if (bipartiteResult.isBipartite) {
        completeBipartite = isCompleteBipartite(graph, bipartiteResult.color);
    }

    return {
        degrees,
        components,
        oddCount,
        eulerStatus,
        isBipartite: bipartiteResult.isBipartite,
        color: bipartiteResult.color,
        completeBipartite
    };
}

function findNumberOfComponents(graph) {
    const n = graph.length - 1;
    const used = Array(n + 1).fill(false);
    let componentCount = 0;

    for (let v = 1; v <= n; v++) {
        if (!used[v]) {
            componentCount++;
            dfs(graph, v, used);
        }
    }

    return componentCount;
}

function dfs(graph, start, used) {
    const stack = [start];
    used[start] = true;

    while (stack.length > 0) {
        const v = stack.pop();

        for (const u of graph[v]) {
            if (!used[u]) {
                used[u] = true;
                stack.push(u);
            }
        }
    }
}

function getEulerStatus(components, oddCount) {
    if (components !== 1) {
        return 'Граф не является ни эйлеровым, ни полуэйлеровым, так как число компонент связности больше 1.';
    }

    if (oddCount === 0) {
        return 'Граф является эйлеровым.';
    }

    if (oddCount === 2) {
        return 'Граф является полуэйлеровым.';
    }

    return 'Граф не является ни эйлеровым, ни полуэйлеровым.';
}

function isBipartite(graph) {
    const n = graph.length - 1;
    const color = Array(n + 1).fill(-1);

    for (let start = 1; start <= n; start++) {
        if (color[start] !== -1) continue;

        const stack = [start];
        color[start] = 0;

        while (stack.length > 0) {
            const v = stack.pop();

            for (const u of graph[v]) {
                if (color[u] === -1) {
                    color[u] = 1 - color[v];
                    stack.push(u);
                } else if (color[u] === color[v]) {
                    return {
                        isBipartite: false,
                        color: []
                    };
                }
            }
        }
    }

    return {
        isBipartite: true,
        color
    };
}

function isCompleteBipartite(graph, color) {
    const n = graph.length - 1;
    const part1 = [];
    const part2 = [];

    for (let v = 1; v <= n; v++) {
        if (color[v] === 0) {
            part1.push(v);
        } else {
            part2.push(v);
        }
    }

    const a = part1.length;
    const b = part2.length;

    for (const v of part1) {
        if (graph[v].length !== b) {
            return false;
        }
    }

    for (const v of part2) {
        if (graph[v].length !== a) {
            return false;
        }
    }

    return true;
}

function formatAnalysisResult(graph, analysis) {
    const n = graph.length - 1;
    const lines = [];

    lines.push('Степени вершин:');
    for (let v = 1; v <= n; v++) {
        lines.push(`${v}: ${analysis.degrees[v]}`);
    }

    lines.push('');
    lines.push(`Число компонент связности: ${analysis.components}`);
    lines.push(analysis.eulerStatus);

    if (analysis.isBipartite) {
        lines.push('Граф является двудольным.');

        const part1 = [];
        const part2 = [];

        for (let v = 1; v <= n; v++) {
            if (analysis.color[v] === 0) {
                part1.push(v);
            } else {
                part2.push(v);
            }
        }

        lines.push(`Доли: {${part1.join(', ')}} и {${part2.join(', ')}}`);

        if (analysis.completeBipartite) {
            lines.push('Граф является полным двудольным.');
        } else {
            lines.push('Граф не является полным двудольным.');
        }
    } else {
        lines.push('Граф не является двудольным.');
    }

    lines.push('');

    return lines.join('\n');
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}