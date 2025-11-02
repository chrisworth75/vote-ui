// D3 Pie Chart Renderer
function renderPieChart(containerId, data, options) {
    // Clear existing chart
    d3.select(`#${containerId}`).selectAll('*').remove();

    if (!data || data.length === 0) {
        d3.select(`#${containerId}`)
            .append('p')
            .style('text-align', 'center')
            .style('color', '#666')
            .text('No votes yet');
        return;
    }

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']);

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
        .outerRadius(radius - 10);

    const labelArc = d3.arc()
        .innerRadius(radius - 60)
        .outerRadius(radius - 60);

    const arcs = svg.selectAll('.arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0.8)
        .on('mouseover', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 1);
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style('opacity', 0.8);
        });

    arcs.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', 'white')
        .text(d => {
            const percentage = ((d.data.count / d3.sum(data, d => d.count)) * 100).toFixed(1);
            return `${d.data.label}: ${percentage}%`;
        });

    // Legend
    const legend = svg.selectAll('.legend')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', (d, i) => `translate(${radius + 20}, ${-radius + i * 25})`);

    legend.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', d => color(d.label));

    legend.append('text')
        .attr('x', 24)
        .attr('y', 9)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .text(d => `${d.label}: ${d.text} (${d.count})`);
}
