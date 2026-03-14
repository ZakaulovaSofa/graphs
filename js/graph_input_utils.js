/* jshint esversion: 6 */

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
            throw new Error(`Номер вершины должен быть положительным числом.`);
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
                        `Некорректный сосед "${token}". Соседи должны быть числами.`
                    );
                }

                neighbors.push(Number(token));
            }
        }

        const uniqueNeighbors = new Set();

        for (const neighbor of neighbors) {
            if (neighbor === vertex) {
                throw new Error(`Обнаружена петля: вершина ${vertex} соединена сама с собой.`);
            }

            if (uniqueNeighbors.has(neighbor)) {
                throw new Error(`У вершины ${vertex} сосед ${neighbor} указан несколько раз.`);
            }

            uniqueNeighbors.add(neighbor);
        }

        parsed.set(vertex, Array.from(uniqueNeighbors));
    }

    const vertices = Array.from(parsed.keys()).sort((a, b) => a - b);
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
        if (vertices[i] !== i + 1) {
            throw new Error(
                `Вершины должны быть пронумерованы от 1 до n без пропусков.`
            );
        }
    }

    const graph = Array.from({ length: n + 1 }, () => []);

    for (let v = 1; v <= n; v++) {
        const neighbors = parsed.get(v);

        for (const u of neighbors) {
            if (u < 1 || u > n) {
                throw new Error(`Вершина ${v} ссылается на несуществующую вершину ${u}.`);
            }
        }

        graph[v] = [...neighbors].sort((a, b) => a - b);
    }

    for (let v = 1; v <= n; v++) {
        for (const u of graph[v]) {
            if (!graph[u].includes(v)) {
                throw new Error(
                    `Граф должен быть неориентированным: ${v} содержит ${u}, но ${u} не содержит ${v}.`
                );
            }
        }
    }

    return graph;
}