// Global variables
let data = [];
let filteredData = [];
const charts = {};
const margin = { top: 40, right: 40, bottom: 60, left: 60 };

// Initialize the dashboard
function initializeDashboard() {
    // Load data
    d3.csv('generated_data.csv').then(loadedData => {
        data = loadedData;
        processData();
        filteredData = [...data];
        setupFilters();
        createVisualizations();
    }).catch(error => {
        console.error('Error loading data:', error);
    });
}

// Data processing
function processData() {
    data.forEach(d => {
        // Convert and adjust scores
        d['Score primaire'] = +d['Score primaire'];
        d['Score collégial'] = +d['Score collégial'] / 2; // Adjust to 10-point scale
        d['Score actuel'] = +d['Score actuel'] / 2; // Adjust to 10-point scale
        d['score en mathématiques'] = +d['score en mathématiques'] / 2;
        d['score en langue arabe'] = +d['score en langue arabe'] / 2;
        d['score en première langue'] = +d['score en première langue'] / 2;
    });
}

// Filter setup
function setupFilters() {
    // Zone filter
    const zones = [...new Set(data.map(d => d.Zone))];
    d3.select('#zoneFilter')
        .selectAll('option')
        .data(['all', ...zones])
        .enter()
        .append('option')
        .text(d => d === 'all' ? 'All Zones' : d)
        .attr('value', d => d);

    // School type filter
    const schoolTypes = [...new Set(data.map(d => d['Public / Privé']))];
    d3.select('#schoolTypeFilter')
        .selectAll('option')
        .data(['all', ...schoolTypes])
        .enter()
        .append('option')
        .text(d => d === 'all' ? 'All School Types' : d)
        .attr('value', d => d);

    // Gender filter
    const genders = [...new Set(data.map(d => d.Sexe))];
    d3.select('#genderFilter')
        .selectAll('option')
        .data(['all', ...genders])
        .enter()
        .append('option')
        .text(d => d === 'all' ? 'All Genders' : d)
        .attr('value', d => d);

    // Add event listeners
    d3.selectAll('select').on('change', updateVisualizations);
    d3.select('#resetFilters').on('click', resetFilters);
}

function createVisualizations() {
    // Clear existing visualizations
    clearVisualizations();
    
    // Create new visualizations
    createSchoolTypeChart();
    createZoneChart();
    createCorrelationHeatmap();
    createResourceAccessChart();
    createPerformanceRadar();
    createSankeyDiagram();
}

function clearVisualizations() {
    // Clear all chart containers
    d3.selectAll('.chart-container').html('');
}

// School Type Performance Chart
function createSchoolTypeChart() {
    const container = d3.select('#schoolTypeChart');
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const schoolTypes = [...new Set(filteredData.map(d => d['Public / Privé']))];
    const scoreTypes = ['Score primaire', 'Score collégial', 'Score actuel'];

    const data = schoolTypes.map(type => {
        const schoolData = filteredData.filter(d => d['Public / Privé'] === type);
        return {
            type: type,
            scores: scoreTypes.map(score => ({
                score: score,
                value: d3.mean(schoolData, d => d[score])
            }))
        };
    });

    const x0 = d3.scaleBand()
        .domain(schoolTypes)
        .range([0, width - 120]) // Adjust width to accommodate legend
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain(scoreTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(scoreTypes)
        .range(['#4e79a7', '#f28e2c', '#e15759']);

    schoolTypes.forEach(type => {
        const typeGroup = svg.append('g')
            .attr('transform', `translate(${x0(type)},0)`);

        typeGroup.selectAll('rect')
            .data(data.find(d => d.type === type).scores)
            .enter()
            .append('rect')
            .attr('x', d => x1(d.score))
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => height - y(d.value))
            .attr('fill', d => color(d.score))
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                showTooltip(event, `${type} - ${d.score}: ${d.value.toFixed(2)}`);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                hideTooltip();
            });
    });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append('g')
        .call(d3.axisLeft(y));

    // Add legend to the right side
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 10)`);

    scoreTypes.forEach((score, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color(score));

        legendGroup.append('text')
            .attr('x', 25)
            .attr('y', 12)
            .text(score);
    });

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .text('Score');
}

// Zone Performance Chart
function createZoneChart() {
    const container = d3.select('#zoneChart');
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const zones = [...new Set(filteredData.map(d => d.Zone))];
    const scoreTypes = ['Score primaire', 'Score collégial', 'Score actuel'];

    const data = zones.map(zone => {
        const zoneData = filteredData.filter(d => d.Zone === zone);
        return {
            zone: zone,
            scores: scoreTypes.map(score => ({
                score: score,
                value: d3.mean(zoneData, d => d[score])
            }))
        };
    });

    const x0 = d3.scaleBand()
        .domain(zones)
        .range([0, width])
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain(scoreTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(scoreTypes)
        .range(['#4e79a7', '#f28e2c', '#e15759']);

    zones.forEach(zone => {
        const zoneGroup = svg.append('g')
            .attr('transform', `translate(${x0(zone)},0)`);

        zoneGroup.selectAll('rect')
            .data(data.find(d => d.zone === zone).scores)
            .enter()
            .append('rect')
            .attr('x', d => x1(d.score))
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => height - y(d.value))
            .attr('fill', d => color(d.score))
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                showTooltip(event, `${zone} - ${d.score}: ${d.value.toFixed(2)}`);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                hideTooltip();
            });
    });

    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    svg.append('g')
        .call(d3.axisLeft(y));

    const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 0)`);

    scoreTypes.forEach((score, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);

        legendRow.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color(score));

        legendRow.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text(score);
    });
}

// Create correlation heatmap
function createCorrelationHeatmap() {
    const container = d3.select('#correlationHeatmap');
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height || 500;
    
    // Adjust margins for labels
    const heatmapMargin = {
        top: 60,
        right: 100,
        bottom: 100,
        left: 100
    };
    
    const width = containerWidth - heatmapMargin.left - heatmapMargin.right;
    const height = Math.min(containerHeight - heatmapMargin.top - heatmapMargin.bottom, width);

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + heatmapMargin.left + heatmapMargin.right)
        .attr('height', height + heatmapMargin.top + heatmapMargin.bottom)
        .attr('viewBox', `0 0 ${width + heatmapMargin.left + heatmapMargin.right} ${height + heatmapMargin.top + heatmapMargin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${heatmapMargin.left},${heatmapMargin.top})`);

    const metrics = [
        'Score primaire',
        'Score collégial',
        'Score actuel',
        'score en mathématiques',
        'score en langue arabe',
        'score en première langue'
    ];

    // Calculate correlations
    const correlationData = [];
    metrics.forEach((metric1, i) => {
        metrics.forEach((metric2, j) => {
            const correlation = calculateCorrelation(
                filteredData.map(d => d[metric1]),
                filteredData.map(d => d[metric2])
            );
            correlationData.push({
                metric1: metric1,
                metric2: metric2,
                correlation: correlation
            });
        });
    });

    // Create scales
    const cellSize = Math.min(width, height) / metrics.length;
    
    const x = d3.scaleBand()
        .domain(metrics)
        .range([0, metrics.length * cellSize])
        .padding(0.05);

    const y = d3.scaleBand()
        .domain(metrics)
        .range([0, metrics.length * cellSize])
        .padding(0.05);

    const color = d3.scaleSequential()
        .domain([-1, 1])
        .interpolator(d3.interpolateRdBu);

    // Create cells
    const cells = svg.selectAll('rect')
        .data(correlationData)
        .enter()
        .append('rect')
        .attr('x', d => x(d.metric1))
        .attr('y', d => y(d.metric2))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('fill', d => color(d.correlation))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke', '#000')
                .attr('stroke-width', 2);
            showTooltip(event, `${d.metric1} vs ${d.metric2}: ${d.correlation.toFixed(3)}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
            hideTooltip();
        });

    // Add labels
    const xLabels = svg.append('g')
        .selectAll('text')
        .data(metrics)
        .enter()
        .append('text')
        .attr('x', d => x(d) + x.bandwidth() / 2)
        .attr('y', -10)
        .attr('transform', d => `rotate(-45, ${x(d) + x.bandwidth() / 2}, -10)`)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .text(d => d);

    const yLabels = svg.append('g')
        .selectAll('text')
        .data(metrics)
        .enter()
        .append('text')
        .attr('x', -10)
        .attr('y', d => y(d) + y.bandwidth() / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .text(d => d);

    // Add color scale legend
    const legendWidth = 20;
    const legendHeight = height * 0.7;
    
    const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight()
        .scale(legendScale)
        .ticks(5)
        .tickFormat(d3.format('.1f'));

    const legend = svg.append('g')
        .attr('transform', `translate(${width + 40}, ${(height - legendHeight) / 2})`);

    const legendGradient = legend.append('defs')
        .append('linearGradient')
        .attr('id', 'correlation-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');

    legendGradient.selectAll('stop')
        .data(color.ticks(10).map((t, i, n) => ({ 
            offset: `${100 * i / n.length}%`,
            color: color(t) 
        })))
        .enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#correlation-gradient)');

    legend.append('g')
        .attr('transform', `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    legend.append('text')
        .attr('transform', `rotate(-90)`)
        .attr('x', -legendHeight / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Correlation');
}

// Resource Access Chart (Stacked Bar)
function createResourceAccessChart() {
    const container = d3.select('#resourceAccessChart');
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const resources = ['Electricité', 'Eau', 'pc', 'Livres'];
    const zones = [...new Set(filteredData.map(d => d.Zone))];

    // Process data for stacked bars with softmax normalization
    const stackedData = zones.map(zone => {
        const zoneData = filteredData.filter(d => d.Zone === zone);
        const resourceValues = resources.map(resource => 
            d3.mean(zoneData, d => d[resource] === 'oui' ? 1 : 0)
        );
        
        // Apply softmax normalization
        const normalizedValues = softmax(resourceValues);
        
        const resourceData = {};
        resources.forEach((resource, i) => {
            resourceData[resource] = normalizedValues[i];
        });
        
        return {
            zone,
            ...resourceData
        };
    });

    const stack = d3.stack()
        .keys(resources)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(stackedData);

    const x = d3.scaleBand()
        .domain(zones)
        .range([0, width - 120]) // Adjust width to accommodate legend
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(resources)
        .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b']);

    // Create stacked bars
    const layers = svg.append('g')
        .selectAll('g')
        .data(series)
        .enter()
        .append('g')
        .attr('fill', d => color(d.key));

    layers.selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
        .attr('x', d => x(d.data.zone))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .on('mouseover', function(event, d) {
            const resourceName = d3.select(this.parentNode).datum().key;
            const percentage = ((d[1] - d[0]) * 100).toFixed(1);
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, `${d.data.zone} - ${resourceName}: ${percentage}%`);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
        });

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    svg.append('g')
        .call(d3.axisLeft(y).tickFormat(d => `${(d * 100).toFixed(0)}%`));

    // Add legend to the right side
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 100}, 10)`);

    resources.forEach((resource, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', color(resource));

        legendGroup.append('text')
            .attr('x', 25)
            .attr('y', 12)
            .text(resource);
    });

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Resource Distribution by Zone (%)');
}

// Performance Radar Chart
function createPerformanceRadar() {
    const container = d3.select('#performanceRadar');
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height || 500;
    const width = containerWidth - margin.left - margin.right;
    const height = Math.min(containerHeight - margin.top - margin.bottom, width);
    const radius = Math.min(width, height) / 2;

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${width/2 + margin.left},${height/2 + margin.top})`);

    const categories = ['Public', 'Privé'];
    const metrics = ['Score primaire', 'Score collégial', 'Score actuel', 
                    'score en mathématiques', 'score en langue arabe', 'score en première langue'];

    const angleScale = d3.scalePoint()
        .domain(metrics)
        .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, radius]);

    // Create radar grid with labels
    const levels = [2, 4, 6, 8, 10];
    levels.forEach(level => {
        svg.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', radiusScale(level))
            .attr('fill', 'none')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 0.5);

        // Add level labels
        svg.append('text')
            .attr('x', 5)
            .attr('y', -radiusScale(level))
            .attr('fill', '#666')
            .attr('font-size', '10px')
            .text(level.toString());
    });

    // Add axis lines and labels
    metrics.forEach(metric => {
        const angle = angleScale(metric) - Math.PI/2;
        const lineEnd = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle)
        };

        // Draw axis line
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', lineEnd.x)
            .attr('y2', lineEnd.y)
            .attr('stroke', '#ddd')
            .attr('stroke-width', 0.5);

        // Add axis label with better positioning
        const labelRadius = radius + 20;
        const labelAngle = angle;
        const labelPos = {
            x: labelRadius * Math.cos(labelAngle),
            y: labelRadius * Math.sin(labelAngle)
        };

        svg.append('text')
            .attr('x', labelPos.x)
            .attr('y', labelPos.y)
            .attr('text-anchor', Math.abs(labelAngle) < Math.PI/2 ? 'start' : 'end')
            .attr('dominant-baseline', 'middle')
            .attr('transform', `rotate(${angle * 180/Math.PI + (Math.abs(labelAngle) < Math.PI/2 ? 0 : 180)} ${labelPos.x} ${labelPos.y})`)
            .text(metric)
            .style('font-size', '12px');
    });

    // Calculate data points
    const categoryData = categories.map(category => {
        const categoryRecords = filteredData.filter(d => d['Public / Privé'] === category);
        return {
            category: category,
            scores: metrics.map(metric => ({
                metric: metric,
                value: d3.mean(categoryRecords, d => d[metric])
            }))
        };
    });

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(categories)
        .range(['#4e79a7', '#f28e2c']);

    // Draw radar paths and points
    categoryData.forEach(catData => {
        const points = catData.scores.map(score => {
            const angle = angleScale(score.metric) - Math.PI/2;
            const radius = radiusScale(score.value);
            return {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                metric: score.metric,
                value: score.value
            };
        });

        // Create path
        const radarLine = d3.lineRadial()
            .radius(d => radiusScale(d.value))
            .angle((d, i) => angleScale(d.metric));

        const pathGroup = svg.append('g')
            .attr('class', `radar-group-${catData.category}`);

        // Draw the radar path
        pathGroup.append('path')
            .datum(catData.scores)
            .attr('d', radarLine)
            .attr('fill', colorScale(catData.category))
            .attr('fill-opacity', 0.2)
            .attr('stroke', colorScale(catData.category))
            .attr('stroke-width', 2);

        // Add interactive points
        points.forEach(point => {
            pathGroup.append('circle')
                .attr('cx', point.x)
                .attr('cy', point.y)
                .attr('r', 5)
                .attr('fill', colorScale(catData.category))
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .on('mouseover', function(event) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 8);
                    showTooltip(event, `${catData.category} - ${point.metric}: ${point.value.toFixed(2)}`);
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 5);
                    hideTooltip();
                });
        });
    });

    // Add legend
    const legendWidth = 120;
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${radius + 20}, ${-radius + 20})`);

    categories.forEach((category, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', colorScale(category));

        legendGroup.append('text')
            .attr('x', 25)
            .attr('y', 12)
            .text(category)
            .style('font-size', '12px');
    });
}

// Sankey Diagram
function createSankeyDiagram() {
    const container = d3.select('#sankeyDiagram');
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data for Sankey diagram
    const nodes = [];
    const links = [];

    // Add school types
    const schoolTypes = [...new Set(filteredData.map(d => d['Public / Privé']))];
    schoolTypes.forEach(type => nodes.push({ name: type }));

    // Add zones
    const zones = [...new Set(filteredData.map(d => d.Zone))];
    zones.forEach(zone => nodes.push({ name: zone }));

    // Create links between school types and zones
    schoolTypes.forEach(type => {
        zones.forEach(zone => {
            const value = filteredData.filter(d => 
                d['Public / Privé'] === type && d.Zone === zone
            ).length;
            if (value > 0) {
                links.push({
                    source: nodes.findIndex(n => n.name === type),
                    target: nodes.findIndex(n => n.name === zone),
                    value: value
                });
            }
        });
    });

    // Create Sankey layout
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[0, 0], [width, height]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    // Add links
    svg.append('g')
        .selectAll('path')
        .data(sankeyLinks)
        .enter()
        .append('path')
        .attr('d', d3.sankeyLinkHorizontal())
        .attr('stroke-width', d => Math.max(1, d.width))
        .style('fill', 'none')
        .style('stroke', '#ccc')
        .style('stroke-opacity', 0.5)
        .on('mouseover', function(event, d) {
            d3.select(this).style('stroke-opacity', 0.8);
            showTooltip(event, `${d.source.name} → ${d.target.name}: ${d.value} students`);
        })
        .on('mouseout', function() {
            d3.select(this).style('stroke-opacity', 0.5);
            hideTooltip();
        });

    // Add nodes
    const nodeGroup = svg.append('g')
        .selectAll('rect')
        .data(sankeyNodes)
        .enter()
        .append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .style('fill', '#69b3a2')
        .style('stroke', '#000');

    // Add node labels
    svg.append('g')
        .selectAll('text')
        .data(sankeyNodes)
        .enter()
        .append('text')
        .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr('y', d => (d.y1 + d.y0) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
        .text(d => d.name);
}

// Filter handling
function updateVisualizations() {
    const selectedZone = d3.select('#zoneFilter').property('value');
    const selectedSchoolType = d3.select('#schoolTypeFilter').property('value');
    const selectedGender = d3.select('#genderFilter').property('value');

    filteredData = data.filter(d => {
        return (selectedZone === 'all' || d.Zone === selectedZone) &&
               (selectedSchoolType === 'all' || d['Public / Privé'] === selectedSchoolType) &&
               (selectedGender === 'all' || d.Sexe === selectedGender);
    });

    createVisualizations();
}

function resetFilters() {
    d3.selectAll('select').property('value', 'all');
    filteredData = [...data];
    createVisualizations();
}

// Tooltip functions
function showTooltip(event, text) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none');

    tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
    
    tooltip.html(text)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
    d3.selectAll('.tooltip').remove();
}

// Helper function to calculate correlation
function calculateCorrelation(x, y) {
    const n = x.length;
    const mean_x = d3.mean(x);
    const mean_y = d3.mean(y);
    const std_x = Math.sqrt(d3.sum(x.map(xi => Math.pow(xi - mean_x, 2))) / n);
    const std_y = Math.sqrt(d3.sum(y.map(yi => Math.pow(yi - mean_y, 2))) / n);
    const covariance = d3.sum(x.map((xi, i) => (xi - mean_x) * (y[i] - mean_y))) / n;
    return covariance / (std_x * std_y);
}

// Helper function for softmax normalization
function softmax(arr) {
    const maxVal = Math.max(...arr);
    const expArr = arr.map(x => Math.exp(x - maxVal));
    const sumExp = expArr.reduce((acc, val) => acc + val, 0);
    return expArr.map(x => x / sumExp);
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', initializeDashboard);
