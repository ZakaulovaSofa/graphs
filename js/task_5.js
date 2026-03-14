/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');

    if (!inputBlockContent || !outputPre || !startButton) {
        console.error('Не найдены нужные элементы страницы для task_5.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('adjacencyListInput').value;
            const graph = parseAndValidateAdjacencyList(rawText);
            const componentsResult = findConnectedComponents(graph);

            outputPre.textContent = formatComponentsResult(graph, componentsResult);
            renderTask5Graph(graph, componentsResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task5-input-wrapper">
            <label for="adjacencyListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите граф списками смежности
            </label>

            <textarea
                id="adjacencyListInput"
                rows="14"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1: 2
2: 1 3
3: 2
4: 5
5: 4
6:"
            >1: 2
2: 1 3
3: 2
4: 5
5: 4
6:</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка задаёт одну вершину:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">номер_вершины: сосед1 сосед2 сосед3</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1: 2
2: 1 3
3: 2
4: 5
5: 4
6:</pre>
            </div>
        </div>
    `;
}

function findConnectedComponents(graph) {
    const n = graph.length - 1;
    const isUsed = Array(n + 1).fill(false);
    const component = Array(n + 1).fill(0);
    const components = [];
    let currentComponentNumber = 1;

    for (let v = 1; v <= n; v++) {
        if (!isUsed[v]) {
            const vertices = [];
            dfs(graph, isUsed, v, component, currentComponentNumber, vertices);
            components.push({
                index: currentComponentNumber,
                vertices: vertices
            });
            currentComponentNumber++;
        }
    }

    return {
        count: currentComponentNumber - 1,
        componentMap: component,
        components: components
    };
}

function dfs(graph, isUsed, current, component, currentComponentNumber, vertices) {
    isUsed[current] = true;
    component[current] = currentComponentNumber;
    vertices.push(current);

    for (const neighbour of graph[current]) {
        if (!isUsed[neighbour]) {
            dfs(graph, isUsed, neighbour, component, currentComponentNumber, vertices);
        }
    }
}

function formatComponentsResult(graph, componentsResult) {
    const lines = [];

    lines.push(`Число компонент связности в графе = ${componentsResult.count}`);
    lines.push('');

    for (const component of componentsResult.components) {
        lines.push(`Компонента связности №${component.index}: ${component.vertices.join(' ')}`);
    }

    return lines.join('\n');
}

function buildCytoscapeElements(graph, componentsResult) {
    const elements = [];
    const n = graph.length - 1;
    const addedEdges = new Set();

    for (let v = 1; v <= n; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v),
                component: componentsResult.componentMap[v] || 0
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

function getTask5Style() {
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

function renderTask5Graph(graph, componentsResult) {
    const elements = buildCytoscapeElements(graph, componentsResult);

    renderGraphInContainer('cy', elements, {
        style: getTask5Style()
    });
}