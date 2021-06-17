//TO DO LIST

//panels (responsive as well)
//highlight countries in region when moving
//titles with panels and fading in and out
//improve position of legend, title and panels (maybe new font)

function initialise_globe(map_data, ydi_data) {
	var svg = draw_svg('globe_div');
	var width = +svg.attr('width');
	var height = +svg.attr('height');
	if (width > 1100) {
		globe.globe_width = width / 4;
		globe.globe_responsiveness = 'big';
	} else if (width < height) {
		if (width < 800) {
			globe.globe_width = width / 3;
		} else {
			globe.globe_width = width / 3.5;
		}
		globe.globe_responsiveness = 'small';
	} else {
		globe.globe_width = height / 3;
	}
	draw_header(svg, width);
	svg = svg.append('g').attr('class', 'globe_group');

	draw_globe(svg, map_data, width, height);
	add_data(ydi_data, 'YDI');
}

function add_data(my_data, title) {
	globe.region_data = d3
		.nest()
		.key((d) => d.region.trim())
		.rollup(function (d) {
			return {
				countries: d3.set(d, (s) => s.geocode).values(),
				comm_countries: d3
					.set(d, (s) => (s.commonwealth === '1' ? s.geocode : ''))
					.values()
					.slice(1),
			};
		})
		.entries(my_data);
	globe.years = d3
		.set(my_data, (d) => d.year)
		.values()
		.map((d) => +d);
	globe.all_data = d3
		.nest()
		.key((d) => d.region.trim())
		.key((d) => d.variablename)
		.key((d) => d.year)
		.rollup((d) => d3.mean(d, (m) => m.value))
		.entries(my_data);
	var ydi_data = d3
		.nest()
		.key((d) => d.variablename)
		.key((d) => d.geocode)
		.entries(my_data);
	my_data = ydi_data.find((d) => d.key === 'YDI Overall Score').values;
	globe.ydi_data = get_latest_YDI(my_data);
	var my_format = d3.format('.3f');
	var data_extent = d3.extent(globe.ydi_data, (d) => +d.value / 100);

	d3.select('.legend_left').text(my_format(data_extent[0]));
	d3.select('.legend_right').text(my_format(data_extent[1]));
	d3.select('.data_title').text(title);
}

function get_latest_YDI(my_data) {
	var new_data = [];
	var max_year = d3.max(my_data[0].values, (d) => +d.year);
	d3.select('.legend_title').text('Latest data - ' + max_year);
	for (m in my_data) {
		var latest_value = my_data[m].values.find((d) => +d.year === max_year);
		new_data.push({
			ISO3: my_data[m].key,
			value: +latest_value.value,
			region: latest_value.region.trim(),
			commonwealth: latest_value.commonwealth,
		});
	}
	return new_data;
}
function draw_header(svg, width) {
	var temp_range = d3.range(0, 1, 0.01);
	var gradient_colour = d3
		.scaleLinear()
		.domain([1, 0])
		.range(globe.range_colours['green'])
		.interpolate(d3.interpolateHcl);
	var gradient_colour_2 = d3
		.scaleLinear()
		.domain([1, 0])
		.range(globe.range_colours['orange'])
		.interpolate(d3.interpolateHcl);
	var gradient_colour_3 = d3
		.scaleLinear()
		.domain([1, 0])
		.range(globe.range_colours['purple'])
		.interpolate(d3.interpolateHcl);

	var legend_width = globe.globe_width;

	var defs = svg.append('defs');

	var linearGradient = defs
		.append('linearGradient')
		.attr('id', 'linear-gradient')
		.attr('x1', '100%')
		.attr('y1', '0%')
		.attr('x2', '0%')
		.attr('y2', '0%');

	linearGradient
		.selectAll('stop')
		.data(temp_range)
		.enter()
		.append('stop')
		.attr('offset', function (d, i) {
			return i / (legend_width / 2 - 1);
		})
		.attr('stop-color', function (d) {
			return gradient_colour(d);
		});

	var linearGradient_2 = defs
		.append('linearGradient')
		.attr('id', 'linear-gradient-2')
		.attr('x1', '100%')
		.attr('y1', '0%')
		.attr('x2', '0%')
		.attr('y2', '0%');

	linearGradient_2
		.selectAll('stop')
		.data(temp_range)
		.enter()
		.append('stop')
		.attr('offset', function (d, i) {
			return i / (legend_width / 2 - 1);
		})
		.attr('stop-color', function (d) {
			return gradient_colour_2(d);
		});

	var linearGradient_3 = defs
		.append('linearGradient')
		.attr('id', 'linear-gradient-3')
		.attr('x1', '100%')
		.attr('y1', '0%')
		.attr('x2', '0%')
		.attr('y2', '0%');

	linearGradient_3
		.selectAll('stop')
		.data(temp_range)
		.enter()
		.append('stop')
		.attr('offset', function (d, i) {
			return i / (legend_width / 2 - 1);
		})
		.attr('stop-color', function (d) {
			return gradient_colour_3(d);
		});

	svg.append('text')
		.attr('class', 'legend_title legend_item')
		.attr('x', legend_width / 2)
		.attr('y', 12)
		.text('Latest data - 2018');

	svg.append('rect')
		.attr('class', 'legend_item gradient_rect')
		.attr('x', 0)
		.attr('y', 15)
		.attr('width', legend_width)
		.attr('height', 10)
		.attr('fill', 'url(#linear-gradient)');

	svg.append('rect')
		.attr('class', 'legend_item gradient_rect gradient_2')
		.attr('x', 0)
		.attr('y', 28)
		.attr('width', legend_width)
		.attr('height', 10)
		.attr('fill', 'url(#linear-gradient-2)');

	svg.append('rect')
		.attr('class', 'legend_item gradient_rect gradient_3')
		.attr('x', 0)
		.attr('y', 41)
		.attr('width', legend_width)
		.attr('height', 10)
		.attr('fill', 'url(#linear-gradient-3)');

	svg.append('text')
		.attr('class', 'legend_left legend_item')
		.attr('x', 0)
		.attr('y', 12);

	svg.append('text')
		.attr('class', 'legend_right legend_item')
		.attr('x', legend_width)
		.attr('y', 12);

	var title_x = width / 2;
	var title_anchor = 'middle';
	if (globe.globe_responsiveness === 'small') {
		title_x = 20;
		title_anchor = 'start';
	}
	svg.append('text')
		.attr('text-anchor', title_anchor)
		.attr('class', 'data_title data_title_item')
		.attr('x', title_x)
		.attr('y', 30);

	svg.append('circle')
		.attr('class', 'data_title_item')
		.attr('cx', title_x + 70)
		.attr('cy', 20)
		.attr('fill', 'white')
		.attr('stroke', '#404040')
		.attr('r', 8);

	svg.append('text')
		.attr('pointer-events', 'nonoe')
		.attr('x', title_x + 70)
		.attr('y', 25)
		.attr('fill', '#404040')
		.attr('text-anchor', 'middle')
		.attr('font-size', 14)
		.text('i');

	d3.selectAll('.data_title_item')
		.on('mouseover', function (d) {
			d3.select(this).attr('cursor', 'pointer');
		})
		.on('mouseout', function (d) {
			d3.select(this).attr('cursor', 'default');
		})
		.on('click', function (d) {
			window.open(
				'what_is_ydi.html',
				'_self',
				'toolbar=no,scrollbars=no,resizable=no,top=50,left=50,width=' +
					(+svg.attr('width') - 100) +
					',height=' +
					(+svg.attr('height') - 100)
			);
		});

	var legend_x_transform = (width - legend_width) / 2;
	var legend_y_transform = 50;
	if (globe.globe_responsiveness === 'small') {
		legend_x_transform = width - legend_width - 20;
		legend_y_transform = 0;
	}
	d3.selectAll('.legend_item').attr(
		'transform',
		'translate(' + legend_x_transform + ',' + legend_y_transform + ')'
	);
}

function fill_countries(my_data, card_list) {
	var data_extent = d3.extent(my_data, (d) => +d.value);

	var colour_range = d3
		.scaleLinear()
		.domain(data_extent)
		.range(globe.range_colours['green'])
		.interpolate(d3.interpolateHcl);
	var colour_range_2 = d3
		.scaleLinear()
		.domain(data_extent)
		.range(globe.range_colours['orange'])
		.interpolate(d3.interpolateHcl);
	var colour_range_3 = d3
		.scaleLinear()
		.domain(data_extent)
		.range(globe.range_colours['purple'])
		.interpolate(d3.interpolateHcl);
	var range_to_index = { 0: 'green', 1: 'orange', 2: 'purple' };

	for (m in my_data) {
		var region_index = card_list.indexOf(my_data[m].region);
		var my_colour = '#F0F0F0';
		if (region_index === 0) {
			my_colour = colour_range(my_data[m].value);
		} else if (region_index === 1) {
			my_colour = colour_range_2(my_data[m].value);
		} else if (region_index === 2) {
			my_colour = colour_range_3(my_data[m].value);
		}
		var my_stroke = '#d0d0d0';
		if (my_data[m].commonwealth === '1') {
			my_stroke = 'gold';
		}
		globe.stored_regions[my_data[m].ISO3] = my_data[m].region;
		d3.select('#' + my_data[m].ISO3)
			.attr('class', 'country_path')
			.style('fill', my_colour)
			.style('stroke', my_stroke)
			.on('mouseover', function (d) {
				d3.select(this).attr('cursor', 'pointer');
			})
			.on('mouseout', function (d) {
				d3.select(this).attr('cursor', 'default');
			})
			.on('click', function (d) {
				globe.rotationOn = false;
				console.log(
					globe.stored_regions[this.id].replace(/ /g, '_') +
						'&colour=' +
						range_to_index[region_index]
				);
				window.open(
					'region_view.html?region=' +
						globe.stored_regions[this.id].replace(/ /g, '_') +
						'&colour=' +
						range_to_index[region_index],
					'_self'
				);
			});
	}
}
function draw_cards(svg, width, height, card_list) {
	globe.current_regions = card_list;
	var card_margins = 25;
	var rect_width = (width - card_margins * 4 - globe.globe_width) / 2;
	var rect_height = (height - card_margins * 4) / 2;
	if (globe.globe_responsiveness === 'small') {
		rect_width = width - card_margins * 2;
		rect_height =
			(height - card_margins * 3 - globe.globe_width) / card_list.length -
			card_margins;
	}
	if (card_list.length === 3) {
		d3.selectAll('.gradient_rect').attr('visibility', 'visible');
	} else if (card_list.length === 2) {
		d3.select('.gradient_2').attr('visibility', 'visible');
		d3.select('.gradient_3').attr('visibility', 'hidden');
	} else {
		d3.select('.gradient_2').attr('visibility', 'hidden');
		d3.select('.gradient_3').attr('visibility', 'hidden');
	}
	fill_countries(globe.ydi_data, card_list);
	var chart_data = [];
	for (c in card_list) {
		var rect_type = globe.card_types[globe.card_position];
		var type_split = rect_type.split('_');
		var start_x =
			type_split[1] === 'left'
				? card_margins
				: -card_margins + (width - rect_width);
		var start_y =
			type_split[0] === 'top'
				? card_margins
				: -card_margins + (height - rect_height);
		if (globe.globe_responsiveness === 'small') {
			start_x = card_margins;
			start_y =
				card_margins * 3 +
				globe.globe_width +
				(rect_height + card_margins) * +c;
		}
		chart_data.push({
			start_x: start_x,
			start_y: start_y,
			region: card_list[c],
			data: globe.all_data.find((d) => d.key === card_list[c]).values,
			position: globe.card_position,
			fill: globe.card_fills[c],
		});
		globe.card_position += 1;
		if (globe.card_position === 4) {
			globe.card_position = 0;
		}
	}

	var my_chart = score_card()
		.width(rect_width)
		.height(rect_height)
		.my_data(chart_data)

		.my_class('ydi_panel');

	my_chart(svg);
}
function draw_globe(svg, map_data, width, height) {
	var start_y = height / 2;
	if (globe.globe_responsiveness === 'small') {
		start_y = 40 + globe.globe_width / 2;
	}

	var my_chart = globe_chart()
		.width(width)
		.height(height)
		.start_y(start_y)
		.map_data(map_data);

	my_chart(svg);
}

function draw_svg(div_id) {
	//draw svgs (photo and charts)
	var chart_div = document.getElementById(div_id);

	var height = chart_div.clientHeight;
	var width = chart_div.clientWidth;

	if (d3.select('.' + div_id + '_svg')._groups[0][0] === null) {
		//draw svg to div height and width
		var svg = d3
			.select('#' + div_id)
			.append('svg')
			.attr('class', div_id + '_svg')
			.attr('id', div_id + '_svg')
			.attr('width', width)
			.attr('height', height);
	}

	return svg;
}
