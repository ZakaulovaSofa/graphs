/* jshint esversion: 8 */

const LIBRARY_GRAPHS_JSON_PATH = '../json/graphs.json';

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('libraryGraphsGrid');

    if (!grid) {
        console.error('Не найден контейнер libraryGraphsGrid');
        return;
    }

    try {
        const graphs = await loadGraphs(LIBRARY_GRAPHS_JSON_PATH);

        if (!Array.isArray(graphs) || graphs.length === 0) {
            grid.innerHTML = '<p>Графы не найдены.</p>';
            return;
        }

        renderGraphCards(grid, graphs);
        renderAllGraphVisualizations(graphs);
    } catch (error) {
        console.error(error);
        grid.innerHTML = `<p>Ошибка загрузки библиотеки графов: ${escapeHtml(error.message)}</p>`;
    }
});

async function loadGraphs(path) {
    const response = await fetch(path, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Не удалось загрузить файл ${path}`);
    }

    return await response.json();
}

function renderGraphCards(container, graphs) {
    container.innerHTML = '';

    graphs.forEach((graph, index) => {
        const card = document.createElement('div');
        card.className = 'task-item';

        const number = graph.id || index + 1;
        const title = graph.name || `Граф ${index + 1}`;

        card.innerHTML = `
            <div class="task-number">${number}</div>
            <h3 class="task-title">${escapeHtml(title)}</h3>
            <div class="graph-preview">
                <div
                    id="library-graph-${index}"
                    class="library-graph-canvas"
                    style="width: 100%; height: 260px; border-radius: 16px; background: linear-gradient(180deg, #fff7fb 0%, #fff0f6 100%); border: 1px solid #f3c6da;"
                ></div>
            </div>
        `;

        container.appendChild(card);
    });
}

function renderAllGraphVisualizations(graphs) {
    graphs.forEach((graph, index) => {
        const normalizedGraph = normalizeGraphFromJson(graph);
        const elements = buildCytoscapeElements(normalizedGraph);

        cytoscape({
            container: document.getElementById(`library-graph-${index}`),
            elements: elements,
            style: getLibraryGraphStyle(),
            layout: getLibraryGraphLayout(),
            userZoomingEnabled: true,
            userPanningEnabled: true,
            boxSelectionEnabled: false,
            autoungrabify: false,
            wheelSensitivity: 0.2
        }).nodes().grabify();
    });
}

function normalizeGraphFromJson(graphEntry) {
    if (!graphEntry || typeof graphEntry !== 'object' || !graphEntry.adjacency) {
        throw new Error('Некорректная запись графа в JSON.');
    }

    const adjacency = graphEntry.adjacency;
    const vertexKeys = Object.keys(adjacency)
        .map(Number)
        .sort((a, b) => a - b);

    const n = vertexKeys.length;
    const graph = Array.from({ length: n + 1 }, () => []);

    for (let i = 0; i < n; i++) {
        const expected = i + 1;
        if (vertexKeys[i] !== expected) {
            throw new Error('Вершины в JSON должны быть пронумерованы подряд от 1 до n.');
        }
    }

    for (let v = 1; v <= n; v++) {
        const neighbors = adjacency[String(v)];

        if (!Array.isArray(neighbors)) {
            throw new Error(`У вершины ${v} список смежности должен быть массивом.`);
        }

        graph[v] = [...neighbors].sort((a, b) => a - b);
    }

    return graph;
}

function buildCytoscapeElements(graph) {
    const elements = [];
    const addedEdges = new Set();

    for (let v = 1; v < graph.length; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    for (let v = 1; v < graph.length; v++) {
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

function getLibraryGraphStyle() {
    return [
        {
            selector: 'node',
            style: {
                'background-color': '#E36D6D',
                'label': 'data(label)',
                'color': '#ffffff',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '16px',
                'font-weight': '700',
                'width': 40,
                'height': 40,
                'border-width': 3,
                'border-color': '#c45a5a'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#E36D6D',
                'curve-style': 'bezier'
            }
        },
        {
            selector: ':selected',
            style: {
                'overlay-opacity': 0.15,
                'overlay-color': '#ff5fa2'
            }
        }
    ];
}

function getLibraryGraphLayout() {
    return {
        name: 'cose',
        animate: false,
        fit: true,
        padding: 20,
        nodeRepulsion: 300000,
        idealEdgeLength: 70,
        edgeElasticity: 100,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 800,
        initialTemp: 150
    };
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}