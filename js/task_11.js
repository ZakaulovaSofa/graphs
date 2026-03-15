/* jshint esversion: 6 */

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');

    if (!inputBlockContent || !outputPre || !startButton) {
        console.error('Не найдены нужные элементы страницы для task_11.js');
        return;
    }

    buildInputUI(inputBlockContent);

    startButton.addEventListener('click', () => {
        try {
            const rawText = document.getElementById('pruferInput').value;
            const prufer = parseAndValidatePruferCode(rawText);
            const decoded = decodePrufer(prufer);

            outputPre.textContent = formatDecodedTreeResult(decoded.graph, decoded.edges, prufer);
            renderTask11Graph(decoded.graph);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task11-input-wrapper">
            <label for="pruferInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите код Прюфера
            </label>

            <textarea
                id="pruferInput"
                rows="8"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
4 4 4 5"
            >4 4 4 5</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Введите числа через пробел — это последовательность Прюфера.</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">4 4 4 5</pre>
                <p style="margin:8px 0 0 0;">
                    Если длина кода равна <b>k</b>, то дерево будет содержать <b>k + 2</b> вершины,
                    пронумерованные от 1 до <b>k + 2</b>.
                </p>
            </div>
        </div>
    `;
}

function parseAndValidatePruferCode(rawText) {
    if (!rawText || !rawText.trim()) {
        throw new Error('Поле ввода пустое.');
    }

    const tokens = rawText.trim().split(/\s+/).filter(Boolean);

    if (tokens.length === 0) {
        throw new Error('Не удалось прочитать код Прюфера.');
    }

    const sequence = tokens.map((token, index) => {
        if (!/^\d+$/.test(token)) {
            throw new Error(`Некорректный элемент "${token}" на позиции ${index + 1}. Ожидается натуральное число.`);
        }

        const value = Number(token);

        if (value <= 0) {
            throw new Error(`Элемент кода Прюфера на позиции ${index + 1} должен быть положительным числом.`);
        }

        return value;
    });

    const n = sequence.length + 2;

    for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] < 1 || sequence[i] > n) {
            throw new Error(
                `Элемент ${sequence[i]} на позиции ${i + 1} выходит за допустимые границы. Для длины кода ${sequence.length} вершины должны быть от 1 до ${n}.`
            );
        }
    }

    return sequence;
}

function decodePrufer(prufer) {
    const n = prufer.length + 2;
    const degree = Array(n + 1).fill(1);

    for (const node of prufer) {
        degree[node] += 1;
    }

    const leafHeap = [];
    for (let v = 1; v <= n; v++) {
        if (degree[v] === 1) {
            pushMinHeap(leafHeap, v);
        }
    }

    const edges = [];

    for (const node of prufer) {
        const leaf = popMinHeap(leafHeap);

        edges.push([leaf, node]);

        degree[leaf] -= 1;
        degree[node] -= 1;

        if (degree[node] === 1) {
            pushMinHeap(leafHeap, node);
        }
    }

    const u = popMinHeap(leafHeap);
    const v = popMinHeap(leafHeap);
    edges.push([u, v]);

    const graph = Array.from({ length: n + 1 }, () => []);

    for (const [a, b] of edges) {
        graph[a].push(b);
        graph[b].push(a);
    }

    for (let i = 1; i <= n; i++) {
        graph[i].sort((x, y) => x - y);
    }

    return {
        n,
        edges,
        graph
    };
}

function pushMinHeap(heap, value) {
    heap.push(value);
    siftUp(heap, heap.length - 1);
}

function popMinHeap(heap) {
    if (heap.length === 0) {
        throw new Error('Внутренняя ошибка: очередь листьев пуста.');
    }

    const min = heap[0];
    const last = heap.pop();

    if (heap.length > 0) {
        heap[0] = last;
        siftDown(heap, 0);
    }

    return min;
}

function siftUp(heap, index) {
    let current = index;

    while (current > 0) {
        const parent = Math.floor((current - 1) / 2);

        if (heap[parent] <= heap[current]) {
            break;
        }

        [heap[parent], heap[current]] = [heap[current], heap[parent]];
        current = parent;
    }
}

function siftDown(heap, index) {
    let current = index;

    while (true) {
        let smallest = current;
        const left = current * 2 + 1;
        const right = current * 2 + 2;

        if (left < heap.length && heap[left] < heap[smallest]) {
            smallest = left;
        }

        if (right < heap.length && heap[right] < heap[smallest]) {
            smallest = right;
        }

        if (smallest === current) {
            break;
        }

        [heap[current], heap[smallest]] = [heap[smallest], heap[current]];
        current = smallest;
    }
}

function formatDecodedTreeResult(graph, edges, prufer) {
    const lines = [];

    lines.push('Код Прюфера:');
    lines.push(prufer.join(' '));
    lines.push('');

    lines.push('Рёбра восстановленного дерева:');
    for (const [u, v] of edges) {
        lines.push(`${u} ${v}`);
    }

    lines.push('');
    lines.push('Дерево в виде списков смежности:');
    for (let v = 1; v < graph.length; v++) {
        lines.push(`${v}: ${graph[v].join(' ')}`);
    }

    return lines.join('\n');
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

function getTask11Style() {
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

function renderTask11Graph(graph) {
    const elements = buildCytoscapeElements(graph);

    renderGraphInContainer('cy', elements, {
        style: getTask11Style()
    });
}