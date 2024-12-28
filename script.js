// Configuration
const config = {
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    colors: {
        // Main score colors - from low to high performance
        scores: {
            'Score primaire': '#2166ac',      // Deep blue
            'Score collégial': '#67a9cf',     // Medium blue
            'Score actuel': '#d1e5f0',        // Light blue
            'score en mathématiques': '#f7f7f7', // White-ish
            'score en langue arabe': '#fddbc7',   // Light orange
            'score en première langue': '#ef8a62'  // Medium orange
        },
        // School type colors
        schoolTypes: {
            'Public': '#1a9850',   // Green for public schools
            'Privé': '#7570b3'     // Purple for private schools
        },
        // Resource colors
        resources: {
            'Electricité': '#66c2a5', // Teal
            'Eau': '#3288bd',         // Blue
            'pc': '#5e4fa2',          // Purple
            'Livres': '#66a61e'       // Green
        },
        // Zone colors - using a categorical color scheme
        zones: [
            '#8dd3c7', '#ffffb3', '#bebada', 
            '#fb8072', '#80b1d3', '#fdb462'
        ],
        // Correlation colors
        correlation: {
            positive: '#d73027',    // Red for positive correlation
            neutral: '#f7f7f7',     // White for no correlation
            negative: '#313695'     // Blue for negative correlation
        },
        // General purpose colors
        grid: '#ddd',
        text: '#333',
        highlight: '#000',
        background: '#fff'
    },
    scoreTypes: ['Score primaire', 'Score collégial', 'Score actuel']
};

// Data management
class DataManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
    }

    async loadData() {
        try {
            const rawData = await d3.csv('base de donne.csv');
            this.data = this.processData(rawData);
            this.filteredData = [...this.data];
            return true;
        } catch (error) {
            console.error('Error loading data:', error);
            return false;
        }
    }

    processData(rawData) {
        return rawData.map(d => ({
            ...d,
            'Score primaire': +d['Score primaire'],
            'Score collégial': +d['Score collégial'] / 2,
            'Score actuel': +d['Score actuel'] / 2,
            'score en mathématiques': +d['score en mathématiques'] / 2,
            'score en langue arabe': +d['score en langue arabe'] / 2,
            'score en première langue': +d['score en première langue'] / 2
        }));
    }

    getUniqueValues(field) {
        return [...new Set(this.data.map(d => d[field]))];
    }

    applyFilters(filters) {
        this.filteredData = this.data.filter(d => {
            return (filters.zone === 'all' || d.Zone === filters.zone) &&
                   (filters.schoolType === 'all' || d['Public / Privé'] === filters.schoolType) &&
                   (filters.gender === 'all' || d.Sexe === filters.gender);
        });
        updateVisualizations();
    }
}

// Utility functions
function calculateCorrelation(x, y) {
    const mean = arr => arr.reduce((a, b) => a + b) / arr.length;
    const xMean = mean(x), yMean = mean(y);
    
    const numerator = x.reduce((sum, xi, i) => 
        sum + (xi - xMean) * (y[i] - yMean), 0);
    const denominator = Math.sqrt(
        x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) *
        y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    );
    
    return numerator / denominator;
}

function softmax(arr) {
    const expValues = arr.map(val => Math.exp(val));
    const sum = expValues.reduce((a, b) => a + b);
    return expValues.map(val => val / sum);
}

// Initialize the dashboard
const dataManager = new DataManager();

async function initializeDashboard() {
    if (await dataManager.loadData()) {
        setupFilters();
        createVisualizations();
    } else {
        d3.select('#error-message')
            .text('Error loading data. Please try refreshing the page.');
    }
}

// Filter setup
function setupFilters() {
    // Zone filter
    const zones = dataManager.getUniqueValues('Zone');
    d3.select('#zoneFilter')
        .selectAll('option')
        .data(['all', ...zones])
        .enter()
        .append('option')
        .text(d => d === 'all' ? 'All Zones' : d)
        .attr('value', d => d);

    // School type filter
    const schoolTypes = dataManager.getUniqueValues('Public / Privé');
    d3.select('#schoolTypeFilter')
        .selectAll('option')
        .data(['all', ...schoolTypes])
        .enter()
        .append('option')
        .text(d => d === 'all' ? 'All School Types' : d)
        .attr('value', d => d);

    // Gender filter
    const genders = dataManager.getUniqueValues('Sexe');
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

function updateVisualizations() {
    const selectedZone = d3.select('#zoneFilter').property('value');
    const selectedSchoolType = d3.select('#schoolTypeFilter').property('value');
    const selectedGender = d3.select('#genderFilter').property('value');

    // Update filtered data
    dataManager.filteredData = dataManager.data.filter(d => {
        return (selectedZone === 'all' || d.Zone === selectedZone) &&
               (selectedSchoolType === 'all' || d['Public / Privé'] === selectedSchoolType) &&
               (selectedGender === 'all' || d.Sexe === selectedGender);
    });

    // Recreate all visualizations with the new filtered data
    createVisualizations();
}

function resetFilters() {
    // Reset all filter selections
    d3.select('#zoneFilter').property('value', 'all');
    d3.select('#schoolTypeFilter').property('value', 'all');
    d3.select('#genderFilter').property('value', 'all');

    // Reset filtered data to original data
    dataManager.filteredData = [...dataManager.data];

    // Recreate all visualizations with the original data
    createVisualizations();
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
    const width = container.node().getBoundingClientRect().width - config.margin.left - config.margin.right;
    const height = 400 - config.margin.top - config.margin.bottom;

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // Process data
    const schoolTypes = dataManager.getUniqueValues('Public / Privé');
    const data = schoolTypes.map(type => {
        const schoolData = dataManager.filteredData.filter(d => d['Public / Privé'] === type);
        return {
            type: type,
            scores: config.scoreTypes.map(score => ({
                score: score,
                value: d3.mean(schoolData, d => d[score]) || 0
            }))
        };
    });

    // Create scales
    const x0 = d3.scaleBand()
        .domain(schoolTypes)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(config.scoreTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .style('text-anchor', 'middle');

    svg.append('g')
        .call(d3.axisLeft(y));

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .text('Score');

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(config.scoreTypes)
        .range(config.scoreTypes.map(score => config.colors.scores[score]));

    // Create and populate the groups
    const typeGroups = svg.selectAll('.type-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'type-group')
        .attr('transform', d => `translate(${x0(d.type)},0)`);

    // Create bars with hover effects
    typeGroups.selectAll('.score-bar')
        .data(d => d.scores)
        .enter()
        .append('rect')
        .attr('class', 'score-bar')
        .attr('x', d => x1(d.score))
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => colorScale(d.score))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const parentData = d3.select(this.parentNode).datum();
            d3.select(this)
                .attr('opacity', 0.8)
                .attr('stroke', '#000')
                .attr('stroke-width', 1);
            showTooltip(event, `${parentData.type}<br>${d.score}: ${d.value.toFixed(2)}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', 'none');
            hideTooltip();
        });

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 0)`);

    config.scoreTypes.forEach((score, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', colorScale(score));

        legendGroup.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text(score);
    });

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('School Type Performance Comparison');
}

// Zone Performance Chart
function createZoneChart() {
    const container = d3.select('#zoneChart');
    const width = container.node().getBoundingClientRect().width - config.margin.left - config.margin.right;
    const height = 400 - config.margin.top - config.margin.bottom;

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // Process data
    const zones = dataManager.getUniqueValues('Zone');
    const data = zones.map(zone => {
        const zoneData = dataManager.filteredData.filter(d => d.Zone === zone);
        return {
            zone: zone,
            scores: config.scoreTypes.map(score => ({
                score: score,
                value: d3.mean(zoneData, d => d[score]) || 0
            }))
        };
    });

    // Create scales
    const x0 = d3.scaleBand()
        .domain(zones)
        .range([0, width])
        .padding(0.2);

    const x1 = d3.scaleBand()
        .domain(config.scoreTypes)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

    // Add axes
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    svg.append('g')
        .call(d3.axisLeft(y));

    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .attr('text-anchor', 'middle')
        .text('Score');

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(config.scoreTypes)
        .range(config.scoreTypes.map(score => config.colors.scores[score]));

    // Create and populate the groups
    const zoneGroups = svg.selectAll('.zone-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'zone-group')
        .attr('transform', d => `translate(${x0(d.zone)},0)`);

    // Create bars with hover effects
    zoneGroups.selectAll('.score-bar')
        .data(d => d.scores)
        .enter()
        .append('rect')
        .attr('class', 'score-bar')
        .attr('x', d => x1(d.score))
        .attr('y', d => y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => colorScale(d.score))
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            const parentData = d3.select(this.parentNode).datum();
            d3.select(this)
                .attr('opacity', 0.8)
                .attr('stroke', '#000')
                .attr('stroke-width', 1);
            showTooltip(event, `${parentData.zone}<br>${d.score}: ${d.value.toFixed(2)}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', 'none');
            hideTooltip();
        });

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 0)`);

    config.scoreTypes.forEach((score, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', colorScale(score));

        legendGroup.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text(score);
    });

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Zone Performance Analysis');
}

// Create correlation heatmap
function createCorrelationHeatmap() {
    const container = d3.select('#correlationHeatmap');
    
    // Increase margins for better label visibility
    const correlationMargins = {
        top: config.margin.top + 20,
        right: config.margin.right + 40,
        bottom: config.margin.bottom + 80, // More space for rotated labels
        left: config.margin.left + 80 // More space for long labels
    };

    const width = container.node().getBoundingClientRect().width - correlationMargins.left - correlationMargins.right;
    const height = 400 - correlationMargins.top - correlationMargins.bottom;

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + correlationMargins.left + correlationMargins.right)
        .attr('height', height + correlationMargins.top + correlationMargins.bottom)
        .append('g')
        .attr('transform', `translate(${correlationMargins.left},${correlationMargins.top})`);

    // Define metrics to correlate
    const metrics = [
        'Score primaire',
        'Score collégial',
        'Score actuel',
        'score en mathématiques',
        'score en langue arabe',
        'score en première langue'
    ];

    // Calculate correlation matrix
    const correlationMatrix = metrics.map(metric1 => 
        metrics.map(metric2 => calculateCorrelation(
            dataManager.filteredData.map(d => d[metric1]),
            dataManager.filteredData.map(d => d[metric2])
        ))
    );

    // Create scales with adjusted padding
    const x = d3.scaleBand()
        .range([0, width])
        .domain(metrics)
        .padding(0.05);

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(metrics)
        .padding(0.05);

    // Color scale for correlation values
    const colorScale = d3.scaleSequential()
        .domain([1, -1])
        .interpolator(d3.interpolateRgb(
            config.colors.correlation.positive,
            config.colors.correlation.negative
        ));

    // Create cells
    const cells = svg.selectAll('g')
        .data(metrics.flatMap((row, i) => 
            metrics.map((col, j) => ({
                row: row,
                col: col,
                value: correlationMatrix[i][j]
            }))
        ))
        .enter()
        .append('g');

    // Add rectangles
    cells.append('rect')
        .attr('x', d => x(d.col))
        .attr('y', d => y(d.row))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke-width', 2)
                .attr('stroke', '#000');
            showTooltip(event, `${d.row} vs ${d.col}: ${d.value.toFixed(2)}`);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke-width', 1)
                .attr('stroke', 'white');
            hideTooltip();
        });

    // Add correlation values
    cells.append('text')
        .attr('x', d => x(d.col) + x.bandwidth() / 2)
        .attr('y', d => y(d.row) + y.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', d => Math.abs(d.value) > 0.5 ? 'white' : 'black')
        .text(d => d.value.toFixed(2));

    // Add X axis with rotated labels
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em');

    // Add Y axis with adjusted labels
    svg.append('g')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .attr('dx', '-0.5em');

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -correlationMargins.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('Score Correlations');

    // Add legend with adjusted position
    const legendWidth = Math.min(200, width * 0.4);
    const legendHeight = 20;
    
    const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format('.1f'));

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'correlation-gradient');

    linearGradient.selectAll('stop')
        .data(d3.range(-1, 1.1, 0.1))
        .enter()
        .append('stop')
        .attr('offset', d => ((d + 1) / 2 * 100) + '%')
        .attr('stop-color', d => colorScale(d));

    const legend = svg.append('g')
        .attr('transform', `translate(${(width - legendWidth) / 2},${height + correlationMargins.bottom - 40})`);

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#correlation-gradient)');

    legend.append('g')
        .attr('transform', `translate(0,${legendHeight})`)
        .call(legendAxis);

    legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', legendHeight + 35)
        .attr('text-anchor', 'middle')
        .text('Correlation Coefficient');
}

// Resource Access Chart (Stacked Bar)
function createResourceAccessChart() {
    const container = d3.select('#resourceAccessChart');
    const width = container.node().getBoundingClientRect().width - config.margin.left - config.margin.right;
    const height = 400 - config.margin.top - config.margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    const resources = ['Electricité', 'Eau', 'pc', 'Livres'];
    const zones = dataManager.getUniqueValues('Zone');

    // Process data for stacked bars with softmax normalization
    const stackedData = zones.map(zone => {
        const zoneData = dataManager.filteredData.filter(d => d.Zone === zone);
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
        .domain(Object.keys(config.colors.resources))
        .range(Object.values(config.colors.resources));

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
    const width = container.node().getBoundingClientRect().width - config.margin.left - config.margin.right;
    const height = Math.min(400 - config.margin.top - config.margin.bottom, width);
    const radius = Math.min(width, height) / 2;

    // Clear existing content
    container.html('');

    const svg = container.append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${width/2 + config.margin.left},${height/2 + config.margin.top})`);

    // Define metrics and categories
    const metrics = [
        'Score primaire',
        'Score collégial',
        'Score actuel',
        'score en mathématiques',
        'score en langue arabe',
        'score en première langue'
    ];
    const categories = ['Public', 'Privé'];

    // Calculate angles for each metric
    const angleStep = (Math.PI * 2) / metrics.length;
    const angles = metrics.map((_, i) => i * angleStep);

    // Create scales
    const rScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, radius]);

    // Draw the circular grid
    const gridLevels = [2, 4, 6, 8, 10];
    gridLevels.forEach(level => {
        const gridRadius = rScale(level);
        svg.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', gridRadius)
            .attr('fill', 'none')
            .attr('stroke', config.colors.grid)
            .attr('stroke-dasharray', '4,4');

        // Add grid level labels
        svg.append('text')
            .attr('x', 5)
            .attr('y', -gridRadius)
            .attr('fill', '#666')
            .style('font-size', '10px')
            .text(level.toString());
    });

    // Draw axis lines and labels
    metrics.forEach((metric, i) => {
        const angle = angles[i];
        const lineEnd = {
            x: radius * Math.cos(angle - Math.PI/2),
            y: radius * Math.sin(angle - Math.PI/2)
        };

        // Draw axis line
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', lineEnd.x)
            .attr('y2', lineEnd.y)
            .attr('stroke', config.colors.grid);

        // Add metric labels
        const labelDistance = radius + 20;
        const labelPosition = {
            x: labelDistance * Math.cos(angle - Math.PI/2),
            y: labelDistance * Math.sin(angle - Math.PI/2)
        };

        svg.append('text')
            .attr('x', labelPosition.x)
            .attr('y', labelPosition.y)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .text(metric);
    });

    // Calculate data points for each category
    const categoryData = categories.map(category => {
        const values = metrics.map(metric => {
            const categoryRecords = dataManager.filteredData.filter(d => d['Public / Privé'] === category);
            return d3.mean(categoryRecords, d => d[metric]) || 0;
        });
        return { category, values };
    });

    // Create color scale
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(config.colors.schoolTypes))
        .range(Object.values(config.colors.schoolTypes));

    // Function to create path data
    function createPathData(values) {
        return values.map((value, i) => {
            const angle = angles[i];
            const r = rScale(value);
            return {
                x: r * Math.cos(angle - Math.PI/2),
                y: r * Math.sin(angle - Math.PI/2),
                value,
                metric: metrics[i],
                angle
            };
        });
    }

    // Draw radar paths for each category
    categoryData.forEach(({ category, values }) => {
        const pathData = createPathData(values);
        const color = colorScale(category);

        // Create group for this category
        const categoryGroup = svg.append('g')
            .attr('class', `radar-group-${category}`);

        // Draw filled path
        const radarLine = d3.lineRadial()
            .angle(d => d.angle)
            .radius(d => rScale(d.value))
            .curve(d3.curveLinearClosed);

        categoryGroup.append('path')
            .datum(values.map((value, i) => [angles[i], value]))
            .attr('d', radarLine)
            .attr('fill', color)
            .attr('fill-opacity', 0.2)
            .attr('stroke', color)
            .attr('stroke-width', 2);

        // Draw points and edges with hover effects
        pathData.forEach((point, i) => {
            const nextPoint = pathData[(i + 1) % pathData.length];

            // Draw edge with hover effect
            categoryGroup.append('line')
                .attr('x1', point.x)
                .attr('y1', point.y)
                .attr('x2', nextPoint.x)
                .attr('y2', nextPoint.y)
                .attr('stroke', color)
                .attr('stroke-width', 2)
                .attr('class', 'radar-edge')
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    d3.select(this)
                        .attr('stroke-width', 4);
                    showTooltip(event, 
                        `${category}:<br>` +
                        `${point.metric}: ${point.value.toFixed(2)}<br>` +
                        `${nextPoint.metric}: ${nextPoint.value.toFixed(2)}`
                    );
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .attr('stroke-width', 2);
                    hideTooltip();
                });

            // Draw points
            categoryGroup.append('circle')
                .attr('cx', point.x)
                .attr('cy', point.y)
                .attr('r', 4)
                .attr('fill', color)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .style('cursor', 'pointer')
                .on('mouseover', function(event) {
                    d3.select(this)
                        .attr('r', 6);
                    showTooltip(event, `${category} - ${point.metric}: ${point.value.toFixed(2)}`);
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .attr('r', 4);
                    hideTooltip();
                });
        });
    });

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${-radius},${-radius})`);

    categories.forEach((category, i) => {
        const legendGroup = legend.append('g')
            .attr('transform', `translate(0,${i * 20})`);

        legendGroup.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', colorScale(category));

        legendGroup.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .text(category);
    });
}

// Sankey Diagram
function createSankeyDiagram() {
    const container = d3.select('#sankeyDiagram');
    const width = container.node().getBoundingClientRect().width - config.margin.left - config.margin.right;
    const height = 400 - config.margin.top - config.margin.bottom;

    const svg = container.append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // Prepare data for Sankey diagram
    const nodes = [];
    const links = [];

    // Add school types
    const schoolTypes = dataManager.getUniqueValues('Public / Privé');
    schoolTypes.forEach(type => nodes.push({ name: type }));

    // Add zones
    const zones = dataManager.getUniqueValues('Zone');
    zones.forEach(zone => nodes.push({ name: zone }));

    // Create links between school types and zones
    schoolTypes.forEach(type => {
        zones.forEach(zone => {
            const value = dataManager.filteredData.filter(d => 
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

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', initializeDashboard);
