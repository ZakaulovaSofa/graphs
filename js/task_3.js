/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');

    if (!inputBlockContent || !outputPre || !startButton) {
        console.error('Не найдены нужные элементы страницы для task_3.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('adjacencyListInput').value;
            const graph = parseAndValidateAdjacencyList(rawText);
            const bfsResult = runFullBFS(graph);

            outputPre.textContent = formatBFSResult(graph, bfsResult);
            renderTask3Graph(graph, bfsResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task3-input-wrapper">
            <label for="adjacencyListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите граф списками смежности
            </label>

            <textarea
                id="adjacencyListInput"
                rows="14"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1: 2 3
2: 1 4 5
3: 1 6
4: 2
5: 2
6: 3"
            >1: 2 3
2: 1 4 5
3: 1 6
4: 2
5: 2
6: 3</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка задаёт одну вершину:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">номер_вершины: сосед1 сосед2 сосед3</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1: 2 3
2: 1 4 5
3: 1 6
4: 2
5: 2
6: 3</pre>
            </div>
        </div>
    `;
}

function runFullBFS(graph) {
    const n = graph.length - 1;
    const used = Array(n + 1).fill(false);
    const components = [];
    const visitOrder = [];
    let componentNumber = 1;

    for (let v = 1; v <= n; v++) {
        if (!used[v]) {
            const currentComponent = [];
            bfs(graph, used, v, currentComponent, visitOrder);
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

function bfs(graph, used, start, currentComponent, visitOrder) {
    const queue = [];
    queue.push(start);
    used[start] = true;

    while (queue.length > 0) {
        const top = queue.shift();
        currentComponent.push(top);
        visitOrder.push(top);

        for (const to of graph[top]) {
            if (!used[to]) {
                queue.push(to);
                used[to] = true;
            }
        }
    }
}

function formatBFSResult(graph, bfsResult) {
    const lines = [];

    lines.push('Обход графа в ширину:');
    lines.push('');

    for (const component of bfsResult.components) {
        lines.push(`Компонента связности №${component.index}`);
        lines.push(component.vertices.join(' '));
        lines.push('');
    }

    lines.push(`Общее число компонент связности: ${bfsResult.components.length}`);
    lines.push(`Общий порядок посещения вершин: ${bfsResult.visitOrder.join(' ')}`);
    return lines.join('\n');
}

function buildCytoscapeElements(graph, bfsResult) {
    const elements = [];
    const n = graph.length - 1;
    const addedEdges = new Set();

    for (let v = 1; v <= n; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v),
                order: bfsResult.orderMap[v] || 0
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

function getTask3Style() {
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

function renderTask3Graph(graph, bfsResult) {
    const elements = buildCytoscapeElements(graph, bfsResult);

    const cy = renderGraphInContainer('cy', elements, {
        style: getTask3Style()
    });

    if (!cy) {
        return;
    }

    animateBFSOrder(cy, bfsResult.visitOrder);
}

function animateBFSOrder(cy, visitOrder) {
    const delay = 700;

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

        setTimeout(() => {
            const node = cy.getElementById(vertex);

            if (node) {
                node.style({
                    'background-color': '#ffd166',
                    'border-width': 5,
                    'border-color': '#ff9f1c'
                });
            }
        }, i * delay);
    }
}