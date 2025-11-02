// D3 Pie Chart Renderer
function renderPieChart(containerId, data, options) {
    // Clear existing chart
    d3.select(`#${containerId}`).selectAll('*').remove();

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Chart container not found: ${containerId}`);
        return;
    }

    if (!data || data.length === 0) {
        d3.select(`#${containerId}`)
            .append('p')
            .style('text-align', 'center')
            .style('color', '#666')
            .text('No votes yet');
        return;
    }

    const containerWidth = container.offsetWidth || 400;
    const width = containerWidth;
    const height = Math.min(400, width);  // Square aspect ratio, max 400px
    const radius = Math.min(width, height) / 2 - 30; // Leave 30px margin

    // More varied color palette
    const colorPalettes = [
        ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'],
        ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'],
        ['#f857a6', '#ff5858', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
    ];
    const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.text))
        .range(palette);

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const labelArc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

    const arcs = svg.selectAll('.arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.text))
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .style('opacity', 0.9)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1)
                .attr('transform', 'scale(1.05)');

            // Show tooltip
            const tooltip = d3.select('#chart-tooltip');
            if (tooltip.empty()) {
                d3.select('body').append('div')
                    .attr('id', 'chart-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0, 0, 0, 0.8)')
                    .style('color', 'white')
                    .style('padding', '8px 12px')
                    .style('border-radius', '4px')
                    .style('font-size', '14px')
                    .style('pointer-events', 'none')
                    .style('z-index', '1000');
            }

            const total = d3.sum(data, d => d.count);
            const percentage = ((d.data.count / total) * 100).toFixed(1);

            d3.select('#chart-tooltip')
                .html(`<strong>${d.data.text}</strong><br/>${d.data.count} votes (${percentage}%)`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .style('opacity', 1);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.9)
                .attr('transform', 'scale(1)');

            d3.select('#chart-tooltip').style('opacity', 0);
        });

    // Add text labels directly on pie slices if there's enough room
    arcs.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('fill', 'white')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
        .each(function(d) {
            const percentage = ((d.data.count / d3.sum(data, d => d.count)) * 100);
            const text = d3.select(this);

            // Only show label if slice is big enough (>8%)
            if (percentage > 8) {
                text.text(`${percentage.toFixed(0)}%`);
            }
        });

    // Create legend with color-coded boxes - vertical layout for narrow cards
    const legendContainer = d3.select(`#${containerId}`)
        .append('div')
        .style('margin-top', '16px')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '8px');

    data.forEach(d => {
        const total = d3.sum(data, item => item.count);
        const percentage = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;

        const legendItem = legendContainer.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '10px')
            .style('padding', '8px 10px')
            .style('background', '#f8f9fa')
            .style('border-radius', '6px')
            .style('font-size', '14px');

        legendItem.append('div')
            .style('width', '18px')
            .style('height', '18px')
            .style('background', color(d.text))
            .style('border-radius', '3px')
            .style('flex-shrink', '0');

        legendItem.append('span')
            .html(`<strong>${d.text}</strong>: ${d.count} (${percentage}%)`);
    });
}
