/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');

    if (!inputBlockContent || !outputPre || !startButton) {
        console.error('Не найдены нужные элементы страницы для task_1.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('adjacencyListInput').value;
            const graph = parseAndValidateAdjacencyList(rawText);
            const dfsResult = runFullDFS(graph);

            outputPre.textContent = formatDFSResult(graph, dfsResult);
            renderTask1Graph(graph, dfsResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task1-input-wrapper">
            <label for="adjacencyListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите граф списками смежности
            </label>

            <textarea
                id="adjacencyListInput"
                rows="14"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1: 2 3
2: 1 4
3: 1
4: 2
5: 6
6: 5"
            >1: 2 3
2: 1 4
3: 1
4: 2
5: 6
6: 5</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка задаёт одну вершину:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">номер_вершины: сосед1 сосед2 сосед3</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1: 2 3
2: 1 4
3: 1
4: 2
5: 6
6: 5</pre>
            </div>
        </div>
    `;
}


function runFullDFS(graph) {
    const n = graph.length - 1;
    const used = Array(n + 1).fill(false);
    const components = [];
    const visitOrder = [];
    let componentNumber = 1;

    for (let v = 1; v <= n; v++) {
        if (!used[v]) {
            const currentComponent = [];
            dfs(graph, used, v, currentComponent, visitOrder, componentNumber);
            components.push({
                index: componentNumber,
                vertices: currentComponent
            });
            componentNumber++;
        }
    }

    const orderMap = {};
    for (let i = 0; i < visitOrder.length; i++) {
        orderMap[visitOrder[i]] = i + 1;
    }

    return {
        components,
        visitOrder,
        orderMap
    };
}

function dfs(graph, used, current, currentComponent, visitOrder, componentNumber) {
    used[current] = true;
    currentComponent.push(current);
    visitOrder.push(current);

    for (const neighbour of graph[current]) {
        if (!used[neighbour]) {
            dfs(graph, used, neighbour, currentComponent, visitOrder, componentNumber);
        }
    }
}

function formatDFSResult(graph, dfsResult) {
    const lines = [];

    lines.push('Обход графа в глубину:');
    lines.push('');

    for (const component of dfsResult.components) {
        lines.push(`Компонента связности №${component.index}`);
        lines.push(component.vertices.join(' '));
        lines.push('');
    }

    lines.push(`Общее число компонент связности: ${dfsResult.components.length}`);
    lines.push(`Общий порядок посещения вершин: ${dfsResult.visitOrder.join(' ')}`);

    lines.push('');
    return lines.join('\n');
}

function buildCytoscapeElements(graph, dfsResult) {
    const elements = [];
    const n = graph.length - 1;
    const addedEdges = new Set();

    for (let v = 1; v <= n; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v),
                order: dfsResult.orderMap[v] || 0
            }
        });
    }

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

function getTask1Style() {
    const style = getDefaultCytoscapeStyle().slice();

    style.push({
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-wrap': 'none'
        }
    });

    return style;
}

function renderTask1Graph(graph, dfsResult) {
    const elements = buildCytoscapeElements(graph, dfsResult);

    const cy = renderGraphInContainer('cy', elements, {
        style: getTask1Style()
    });

    if (!cy) {
        return;
    }

    highlightDFSOrder(cy, dfsResult.visitOrder);
}

function highlightDFSOrder(cy, visitOrder) {
    cy.nodes().forEach(node => {
        node.style({
            'background-color': '#E36D6D',
            'border-color': '#c45a5a',
            'border-width': 3
        });
    });

    cy.edges().forEach(edge => {
        edge.style({
            'line-color': '#E36D6D',
            'width': 3
        });
    });

    for (let i = 0; i < visitOrder.length; i++) {
        const vertex = String(visitOrder[i]);
        const node = cy.getElementById(vertex);

        if (node) {
            node.style({
                'background-color': getStepColor(i, visitOrder.length),
                'border-color': '#8f3d3d',
                'border-width': 4
            });
        }
    }
}

function getStepColor(index, total) {
    if (total <= 1) {
        return '#E36D6D';
    }

    const start = {r: 227, g: 109, b: 109};
    const end = {r: 255, g: 196, b: 196};
    const t = index / (total - 1);

    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
}