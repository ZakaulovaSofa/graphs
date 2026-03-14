/* jshint esversion: 6 */

let cyInstances = {};

function getDefaultCytoscapeStyle() {
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
                'width': 42,
                'height': 42,
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

function getDefaultCytoscapeLayout() {
    return {
        name: 'cose',
        animate: true,
        animationDuration: 700,
        fit: true,
        padding: 30,
        nodeRepulsion: 450000,
        idealEdgeLength: 90,
        edgeElasticity: 120,
        nestingFactor: 1.2,
        gravity: 1,
        numIter: 1000,
        initialTemp: 200
    };
}

function renderGraphInContainer(containerId, elements, options) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    if (cyInstances[containerId]) {
        cyInstances[containerId].destroy();
    }

    container.innerHTML = '';

    const config = options || {};

    const cy = cytoscape({
        container: container,
        elements: elements,
        style: config.style || getDefaultCytoscapeStyle(),
        layout: config.layout || getDefaultCytoscapeLayout(),
        userZoomingEnabled: config.userZoomingEnabled !== false,
        userPanningEnabled: config.userPanningEnabled !== false,
        boxSelectionEnabled: config.boxSelectionEnabled || false,
        autoungrabify: config.autoungrabify || false,
        wheelSensitivity: config.wheelSensitivity || 0.2
    });

    cy.nodes().grabify();
    cyInstances[containerId] = cy;

    return cy;
}

function destroyGraph(containerId) {
    if (cyInstances[containerId]) {
        cyInstances[containerId].destroy();
        delete cyInstances[containerId];
    }
}

function renderGraphError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    destroyGraph(containerId);

    container.innerHTML = `
        <div style="height:100%; display:flex; align-items:center; justify-content:center; text-align:center; padding:20px; color:#a9446e;">
            <div>
                <p style="font-weight:700; margin-bottom:10px;">Граф не построен</p>
                <p>${escapeGraphHtml(message)}</p>
            </div>
        </div>
    `;
}

function escapeGraphHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}