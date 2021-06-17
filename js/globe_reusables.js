function globe_chart() {
	//REUSABLE force_simulation chart

	var start_y = 0,
		width = 0,
		height = 0,
		map_data = [],
		current_pos = 'start';

	function my(svg) {
		const scl = globe.globe_width / 2; // scale globe
		const tRotation = 30000; //30s per rotation

		// map projection
		const projection = d3
			.geoOrthographic()
			.scale(scl)
			.translate([width / 2, start_y]);

		// path generator
		const path = d3.geoPath().projection(projection);

		// pause button
		globe.rotationOn = true;

		var pause_x = width / 2;
		var pause_y = height - 10;
		var pause_anchor = 'middle';

		if (globe.globe_responsiveness === 'small') {
			pause_x = 20;
			pause_y = 20 + globe.globe_width / 2;
			pause_anchor = 'start';
		}
		svg.append('text')
			.attr('x', pause_x)
			.attr('y', pause_y)
			.text('PAUSE')
			.attr('text-anchor', pause_anchor)
			.attr('class', 'pause_text')
			.on('mouseover', function () {
				d3.select(this)
					.attr('cursor', 'pointer')
					.style('text-decoration', 'underline');
			})
			.on('mouseout', function () {
				d3.select(this)
					.attr('cursor', 'default')
					.style('text-decoration', 'none');
			})
			.on('click', function () {
				globe.rotationOn = !globe.rotationOn;
				d3.select(this).text(globe.rotationOn ? 'PAUSE' : 'PLAY');
			});

		// add circle for background
		svg.append('circle')
			.attr('cx', width / 2)
			.attr('cy', start_y)
			.attr('r', projection.scale())
			.style('fill', '#f7fbff');

		//define  group
		var my_group = svg
			.selectAll('.globe_group')
			.data(map_data.features, (d) => d.id);
		//exit remove
		my_group.exit().remove();
		//enter (with clip path)
		var enter = my_group.enter().append('g').attr('class', 'globe_group');
		//append
		enter.append('path').attr('class', 'country_path');
		//merge
		my_group = my_group.merge(enter);

		// create one path per TopoJSON feature
		my_group
			.select('.country_path')
			.attr('d', path)
			.attr('id', (d) => d.id)
			.style('fill', 'white')
			.style('stroke', '#d0d0d0')
			.style('stroke-width', '0.5px');

		// vars for timer
		var tNew, dt, steps, pos, tOld, oldPos;
		tOld = 0;
		oldPos = 0;

		// start timer
		d3.timer(myTimer);

		// function that rotates the earth
		function myTimer(now) {
			if (globe.rotationOn) {
				tNew = now;
				dt = tOld - tNew;
				steps = (dt * 360) / tRotation;

				pos = oldPos - steps; //the earth rotates towards the east

				if (pos <= -180) {
					pos = pos + 360;
				}

				projection.rotate([pos, 0]);
				svg.selectAll('.country_path').attr('d', path);

				var pos_360 = pos % 360;
				if (pos_360 > 25 && pos_360 < 145) {
					if (current_pos !== 'americas') {
						draw_cards(svg, width, height, [
							'North America',
							'Latin America and Caribbean',
						]);
						current_pos = 'americas';
					}
				} else if (pos_360 >= 145 && pos_360 < 265) {
					if (current_pos !== 'asia') {
						draw_cards(svg, width, height, [
							'East Asia and Pacific',
							'South Asia',
						]);
						current_pos = 'asia';
					}
				} else {
					if (globe.all_data.length > 0) {
						if (current_pos !== 'europe') {
							draw_cards(svg, width, height, [
								'Europe and Central Asia',
								'Sub-Saharan Africa',
								'Middle East and North Africa',
							]);
							current_pos = 'europe';
						}
					}
				}
				tOld = tNew;
				oldPos = pos;
			} else {
				tOld = now;
			}
		}
	}

	my.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	};

	my.height = function (value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	};

	my.start_y = function (value) {
		if (!arguments.length) return start_y;
		start_y = value;
		return my;
	};

	my.map_data = function (value) {
		if (!arguments.length) return map_data;
		map_data = value;
		return my;
	};

	return my;
}

function score_card() {
	//REUSABLE force_simulation chart

	var width = 0,
		height = 0,
		my_class = '',
		my_data = [],
		margin = { left: 20, right: 20, top: 50, bottom: 30 },
		stacked = false;

	function my(svg) {
		var graph_height = height - margin.top - margin.bottom;
		var graph_width = (width - margin.left - margin.right) / 2;
		if (graph_width < 200) {
			stacked = true;
			graph_width = width - margin.left - margin.right;
			graph_height = (height - margin.top - margin.bottom) / 2;
		}
		var x_scale = d3
			.scaleLinear()
			.domain(d3.extent(globe.years))
			.range([0, graph_width]);
		var y_scale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([graph_height, 0]);

		var bullet_set = d3.set(my_data[0].data, (s) => s.key).values();
		bullet_set = bullet_set.filter((d) => d.key !== 'YDI Overall Score');

		var bullet_y_scale = d3
			.scaleBand()
			.domain(bullet_set)
			.range([0, graph_height]);
		var bullet_x_scale = d3
			.scaleLinear()
			.domain([0, 100])
			.range([
				0,
				graph_width - (bullet_y_scale.bandwidth() < 20 ? 135 : 25),
			]);
		var my_format = d3.format('.3f');

		var area = d3
			.area()
			.x((d) => x_scale(+d.key))
			.y0((d) => y_scale(d.value))
			.y1(y_scale(0));

		var line = d3
			.area()
			.x((d) => x_scale(+d.key))
			.y((d) => y_scale(d.value));

		//define  group
		var my_group = svg.selectAll('.score_card_group').data(my_data);
		//exit remove
		my_group.exit().remove();
		//enter (with clip path)
		var enter = my_group
			.enter()
			.append('g')
			.attr('class', 'score_card_group');
		//append

		enter.append('text').attr('class', 'card_title');
		enter.append('text').attr('class', 'card_country_info');
		enter.append('g').attr('class', 'area_axis area_x_axis');
		enter.append('g').attr('class', 'bullet_axis bullet_x_axis');
		enter.append('g').attr('class', 'area_axis area_y_axis');
		enter.append('rect').attr('class', 'area_background_rect');
		enter.append('text').attr('class', 'area_title');
		enter.append('path').attr('class', 'card_area');
		enter.append('path').attr('class', 'card_line');
		enter.append('circle').attr('class', 'area_dot');
		enter.append('text').attr('class', 'area_dot_label');
		enter.append('g').attr('class', 'bullet_group');
		enter.append('rect').attr('class', 'card_rect');

		//merge
		my_group = my_group.merge(enter);

		my_group
			.select('.area_title')
			.attr('x', graph_width / 2)
			.attr('y', 14)
			.text('YDI Overall Score')
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			);

		my_group
			.select('.area_dot')
			.interrupt()
			.attr('id', (d, i) => 'area_dot' + i)
			.attr('cx', x_scale(d3.max(globe.years)))
			.attr('cy', function (d) {
				d.latest_value = d.data
					.find((f) => f.key === 'YDI Overall Score')
					.values.find((m) => +m.key === d3.max(globe.years)).value;
				return y_scale(d.latest_value);
			})
			.attr('fill', (d) => d.fill)
			.attr('r', 3)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			);

		my_group
			.select('.area_dot_label')
			.interrupt()
			.attr('id', (d, i) => 'area_dot_label' + i)
			.attr('x', x_scale(d3.max(globe.years)))
			.attr('y', (d) => y_scale(d.latest_value))
			.attr('dy', -6)
			.text((d) => my_format(d.latest_value / 100))
			.attr('fill', (d) => d.fill)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			);

		my_group
			.select('.area_background_rect')
			.attr('width', graph_width)
			.attr('height', graph_height)
			.attr('fill', '#F8F8F8')
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			);

		my_group
			.select('.card_title')
			.attr('x', width / 2)
			.attr('y', 20)
			.attr(
				'transform',
				(d) => 'translate(' + d.start_x + ',' + d.start_y + ')'
			)
			.text((d) => d.region);

		my_group
			.select('.card_country_info')
			.attr('x', width / 2)
			.attr('y', 35)
			.attr(
				'transform',
				(d) => 'translate(' + d.start_x + ',' + d.start_y + ')'
			)
			.text(function (d) {
				var region_countries = globe.region_data.find(
					(f) => f.key === d.region
				).value;
				return (
					region_countries.countries.length +
					' Countries (' +
					region_countries.comm_countries.length +
					' Commonwealth)'
				);
			});

		my_group
			.select('.card_rect')
			.on('mouseover', function () {
				d3.select(this).attr('cursor', 'pointer');
			})
			.on('mouseout', function () {
				d3.select(this).attr('cursor', 'default');
			})
			.attr('width', width)
			.attr('height', 40)
			.attr(
				'transform',
				(d) => 'translate(' + d.start_x + ',' + d.start_y + ')'
			)
			.on('click', function () {
				var my_svg = d3.select('#globe_div_svg');
				window.open(
					'pop_up.html',
					'_self',
					'toolbar=no,scrollbars=no,resizable=no,top=50,left=50,width=' +
						(+my_svg.attr('width') - 100) +
						',height=' +
						(+my_svg.attr('height') - 100)
				);
			});

		my_group
			.select('.area_x_axis')
			.call(
				d3
					.axisBottom(x_scale)
					.tickSizeOuter(0)
					.ticks(globe.years.length, '.0f')
			)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + graph_height + margin.top) +
					')'
			);

		my_group
			.select('.bullet_x_axis')
			.call(
				d3
					.axisBottom(bullet_x_scale)
					.tickSizeOuter(0)
					.tickFormat((d) => d / 100)
					.ticks(5, '.2f')
			)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x +
						margin.left +
						get_bullet_x() +
						(bullet_y_scale.bandwidth() < 20 ? 135 : 0)) +
					',' +
					(d.start_y + graph_height + margin.top + get_bullet_y()) +
					')'
			);

		my_group
			.selectAll('.bullet_x_axis .tick line')
			.attr('y1', 0)
			.attr('y2', -graph_height);

		my_group.selectAll('.bullet_x_axis .tick text').attr('y', 3);

		my_group
			.selectAll('.area_x_axis .tick text')
			.style('font-weight', (d) =>
				d === d3.max(globe.years) ? 'bold' : 'normal'
			)
			.attr('class', 'area_tick_text')
			.attr('id', (d) => 'area_tick_text' + d)
			.attr('y', 3)
			.on('mouseover', function () {
				d3.select(this).attr('cursor', 'pointer');
			})
			.on('mouseout', function () {
				d3.select(this).attr('cursor', 'default');
			})
			.on('click', (d) => move_area_year(d));

		my_group
			.select('.card_area')
			.attr('stroke', 'none')
			.attr('fill', (d) => d.fill)
			.attr('fill-opacity', 0.4)
			.attr('d', (d) =>
				area(d.data.find((f) => f.key === 'YDI Overall Score').values)
			)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			)
			.on('mousemove', function (d) {
				var current_year = x_scale
					.invert(d3.event.x - d.start_x - margin.left)
					.toFixed(0);
				move_area_year(+current_year);
			});

		function move_area_year(current_year) {
			d3.selectAll('.area_dot')
				.transition()
				.duration(500)
				.attr('cx', x_scale(+current_year))
				.attr('cy', (d) =>
					y_scale(
						d.data
							.find((f) => f.key === 'YDI Overall Score')
							.values.find((v) => +v.key === current_year).value
					)
				);

			d3.selectAll('.area_dot_label')
				.transition()
				.duration(500)
				.attr('x', x_scale(+current_year))
				.attr('y', (d) =>
					y_scale(
						d.data
							.find((f) => f.key === 'YDI Overall Score')
							.values.find((v) => +v.key === current_year).value
					)
				)
				.text((d) =>
					my_format(
						d.data
							.find((f) => f.key === 'YDI Overall Score')
							.values.find((v) => +v.key === current_year).value /
							100
					)
				);

			d3.selectAll('.area_tick_text').style('font-weight', 'normal');

			d3.selectAll('#area_tick_text' + current_year).style(
				'font-weight',
				'bold'
			);

			d3.selectAll('.bullet_rect')
				.transition()
				.duration(500)
				.attr('width', function (d) {
					d.current_value = d.values.find(
						(f) => +f.key === current_year
					).value;
					return bullet_x_scale(d.current_value);
				});

			d3.selectAll('.bullet_label')
				.transition()
				.duration(500)
				.attr(
					'x',
					(d) =>
						(bullet_y_scale.bandwidth() < 20 ? 132 : -3) +
						bullet_x_scale(d.current_value)
				)
				.text((d) => my_format(d.current_value / 100));
		}

		my_group
			.select('.card_line')
			.attr('fill', 'none')
			.attr('stroke', (d) => d.fill)
			.attr('stroke-width', 1.5)
			.attr('d', (d) =>
				line(d.data.find((f) => f.key === 'YDI Overall Score').values)
			)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left) +
					',' +
					(d.start_y + margin.top) +
					')'
			);

		my_group
			.select('.bullet_group')
			.attr('id', (d) => d.fill)
			.attr(
				'transform',
				(d) =>
					'translate(' +
					(d.start_x + margin.left + get_bullet_x()) +
					',' +
					(d.start_y + margin.top + get_bullet_y()) +
					')'
			);

		//define  group
		var bullet_group = my_group
			.select('.bullet_group')
			.selectAll('.score_bullet_group')
			.data((d) => d.data.filter((f) => f.key !== 'YDI Overall Score'));
		//exit remove
		bullet_group.exit().remove();
		//enter (with clip path)
		var bullet_enter = bullet_group
			.enter()
			.append('g')
			.attr('class', 'score_bullet_group');

		bullet_enter.append('rect').attr('class', 'bullet_rect');
		bullet_enter.append('text').attr('class', 'bullet_text');
		bullet_enter.append('text').attr('class', 'bullet_label');

		bullet_group = bullet_group.merge(bullet_enter);

		bullet_group
			.select('.bullet_text')
			.attr(
				'text-anchor',
				bullet_y_scale.bandwidth() < 20 ? 'end' : 'start'
			)
			.attr('x', bullet_y_scale.bandwidth() < 20 ? 130 : 0)
			.attr('y', (d) => bullet_y_scale(d.key) + 10)
			.text((d) => d.key);

		var bullet_rect_height = bullet_y_scale.bandwidth() - 15;
		if (bullet_y_scale.bandwidth() < 20) {
			bullet_rect_height = bullet_y_scale.bandwidth() - 2;
		}
		bullet_group
			.select('.bullet_rect')
			.attr('x', bullet_y_scale.bandwidth() < 20 ? 135 : 0)
			.attr(
				'y',
				(d) =>
					bullet_y_scale(d.key) +
					14 +
					(bullet_y_scale.bandwidth() < 20
						? -bullet_y_scale.bandwidth()
						: 0)
			)
			.attr('width', function (d) {
				d.current_value = d.values.find(
					(f) => +f.key === d3.max(globe.years)
				).value;
				return bullet_x_scale(d.current_value);
			})
			.attr('height', bullet_rect_height)
			.attr('fill', function () {
				return this.parentElement.parentElement.id;
			})
			.attr('fill-opacity', 0.8);

		bullet_group
			.select('.bullet_label')
			.attr(
				'x',
				(d) =>
					(bullet_y_scale.bandwidth() < 20 ? 132 : -3) +
					bullet_x_scale(d.current_value)
			)
			.attr(
				'dy',
				bullet_y_scale.bandwidth() < 20
					? 9
					: 17 + bullet_rect_height / 2
			)
			.attr('y', (d) => bullet_y_scale(d.key))
			.text((d) => my_format(d.current_value / 100));

		function get_bullet_x() {
			if (stacked === true) {
				return 0;
			} else {
				return graph_width + 25;
			}
		}

		function get_bullet_y() {
			if (stacked === true) {
				return graph_height + 20;
			} else {
				return 0;
			}
		}
	}

	my.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	};

	my.height = function (value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	};

	my.my_class = function (value) {
		if (!arguments.length) return my_class;
		my_class = value;
		return my;
	};

	my.my_data = function (value) {
		if (!arguments.length) return my_data;
		my_data = value;
		return my;
	};

	return my;
}

function tree_map() {
	//REUSABLE tree map chart

	var height = 0,
		width = 0,
		my_data = [],
		start_x = 0,
		start_y = 0,
		colour_range = [];

	function my(svg) {
		//set format and scales
		var my_format = d3.format('.0%');
		var categories = d3.set(my_data, (d) => d.Category).values();
		categories = categories.sort((a, b) => d3.ascending(a, b));
		var x_scale = d3.scaleLinear().domain([0, width]).range([0, width]);
		var y_scale = d3.scaleLinear().domain([0, height]).range([0, height]);
		var colour_scale = d3
			.scaleOrdinal()
			.domain(categories)
			.range(colour_range);
		var transform_str = 'translate(' + start_x + ',' + start_y + ')';

		//set treemap
		var treemap = d3
			.treemap()
			.tile(d3.treemapSlice)
			.size([width, height])
			.paddingInner(0)
			.round(false);

		//define root (correct format) and treemap
		var root = d3.hierarchy({ name: 'categories', children: my_data });
		treemap(
			root
				.sum((d) => d.Weight)
				.sort((a, b) => b.height - a.height || b.value - a.Weight)
		);
		//display
		display(root);

		var category_data = d3
			.nest()
			.key((d) => d.data.Category)
			.rollup(function (d) {
				return {
					height: d3.sum(d, (s) => s.y1 - s.y0),
					weight: d3.sum(d, (s) => s.data.Weight),
					y_pos: d[0].y0,
				};
			})
			.entries(root.children);

		var svg_width = +svg.attr('width');

		svg.append('text')
			.attr('class', 'data_title')
			.attr('x', svg_width / 2)
			.attr('y', 30)
			.attr('text-anchor', 'middle')
			.text('What is the YDI?');

		svg.append('text')
			.attr('class', 'data_description')
			.attr('transform', 'translate(' + svg_width / 2 + ',55)')
			.attr('x', 0)
			.attr('y', 0)
			.attr('text-anchor', 'middle')
			.attr('dy', 0)
			.text(
				'The Youth Development Index (YDI) is an aggregate of indicators that measure progress on youth development in 183 countries'
			)
			.call(wrap, svg_width - 20);

		svg.append('text')
			.attr('class', 'tree_heading')
			.attr('x', 10 + left_rect_width / 2)
			.attr('y', start_y - 5)
			.text('5 CATEGORIES');

		svg.append('text')
			.attr('class', 'tree_heading')
			.attr('x', 20 + left_rect_width + width / 2)
			.attr('y', start_y - 5)
			.text('18 DATASETS');

		//define  group
		var my_group = svg
			.selectAll('.category_tree_group')
			.data(category_data);
		//exit remove
		my_group.exit().remove();
		//enter (with clip path)
		var enter = my_group
			.enter()
			.append('g')
			.attr('class', 'category_tree_group');
		//append

		enter.append('rect').attr('class', 'category_rect');
		enter.append('rect').attr('class', 'category_weight_rect');
		enter.append('text').attr('class', 'category_text');
		enter.append('text').attr('class', 'category_weight_text');
		//merge
		my_group = my_group.merge(enter);

		my_group
			.select('.category_rect')
			.attr('x', 10)
			.attr('y', (d) => d.value.y_pos + 2)
			.attr('width', left_rect_width)
			.attr('height', (d) => d.value.height - 4)
			.attr('fill', (d) => colour_scale(d.key))
			.attr('transform', 'translate(0,' + start_y + ')');

		my_group
			.select('.category_text')
			.attr('x', 10 + left_rect_width / 2)
			.attr('y', (d) => d.value.y_pos + d.value.height / 2)
			.attr('fill', (d) => globe.colour_to_font[colour_scale(d.key)])
			.text((d) => d.key.toUpperCase())
			.attr('transform', 'translate(0,' + start_y + ')');

		my_group
			.select('.category_weight_text')
			.attr('x', width + start_x + 10 + right_rect_width / 2)
			.attr('y', (d) => d.value.y_pos + d.value.height / 2)
			.attr('fill', (d) => colour_scale(d.key))
			.attr('font-size', 30)
			.text((d) => my_format(d.value.weight / 100))
			.attr('transform', 'translate(0,' + start_y + ')');

		function display(d) {
			// write text into grandparent
			// and activate click's handler

			var g = svg.selectAll('g').data(d.children).enter().append('g');
			// add class and click handler to all g's with children
			g.filter((d) => d.children).classed('children', true);

			g.selectAll('.child')
				.data((d) => d.children || [d])
				.enter()
				.append('rect')
				.attr('class', 'child')
				.call(rect);

			// add title to parents
			g.append('rect')
				.attr('class', 'parent')
				.call(rect)
				.on('mousemove', function (d) {
					var tooltip_text =
						d.data.Description +
						"<br><span id='tooltip_source'>Source:" +
						d.data.Source +
						'</span>';
					d3.select('.tooltip')
						.style('left', d3.event.x + 5 + 'px')
						.style('top', d3.event.y + 'px')
						.style('visibility', 'visible')
						.html(tooltip_text);
				})
				.on('mouseout', function (d) {
					d3.select('.tooltip').style('visibility', 'hidden');
				});

			/* Adding a foreign object instead of a text object, allows for text wrapping */
			g.append('text')
				.attr('x', 10)
				.attr(
					'y',
					(d) =>
						y_scale(d.y0) + 4 + (y_scale(d.y1) - y_scale(d.y0)) / 2
				)
				.text((d) => d.data.Dataset)
				.attr('transform', transform_str)
				.attr(
					'fill',
					(d) => globe.colour_to_font[colour_scale(d.data.Category)]
				)
				.attr('class', 'tree_label'); //textdiv class allows us to style the text easily with CSS

			g.append('text')
				.attr('x', width - 10)
				.attr(
					'y',
					(d) =>
						y_scale(d.y0) + 4 + (y_scale(d.y1) - y_scale(d.y0)) / 2
				)
				.text((d) => my_format(d.data.Weight / 100))
				.attr('transform', transform_str)
				.attr(
					'fill',
					(d) => globe.colour_to_font[colour_scale(d.data.Category)]
				)
				.attr('class', 'tree_weight_label'); //textdiv class allows us to style the text easily with CSS

			return g;
		}

		function rect(rect) {
			rect.attr('x', (d) => x_scale(d.x0))
				.attr('y', (d) => y_scale(d.y0))
				.attr('width', (d) => x_scale(d.x1) - x_scale(d.x0))
				.attr('height', (d) => y_scale(d.y1) - y_scale(d.y0))
				.attr('fill', (d) => colour_scale(d.data.Category))
				.attr('stroke', 'white')
				.attr('stroke-width', '4px')
				.attr('transform', transform_str);
		}
	}

	my.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	};

	my.height = function (value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	};

	my.my_data = function (value) {
		if (!arguments.length) return my_data;
		my_data = value;
		return my;
	};

	my.start_x = function (value) {
		if (!arguments.length) return start_x;
		start_x = value;
		return my;
	};

	my.start_y = function (value) {
		if (!arguments.length) return start_y;
		start_y = value;
		return my;
	};

	my.colour_range = function (value) {
		if (!arguments.length) return colour_range;
		colour_range = value;
		return my;
	};

	my.left_rect_width = function (value) {
		if (!arguments.length) return left_rect_width;
		left_rect_width = value;
		return my;
	};

	my.right_rect_width = function (value) {
		if (!arguments.length) return right_rect_width;
		right_rect_width = value;
		return my;
	};

	return my;
}

function wrap(text, width) {
	text.each(function () {
		var text = d3.select(this),
			words = text.text().split(/\s+/).reverse(),
			word,
			line = [],
			lineNumber = 0,
			lineHeight = 1.1, // ems
			y = text.attr('y'),
			x = text.attr('x'),
			dy = parseFloat(text.attr('dy')),
			tspan = text
				.text(null)
				.append('tspan')
				.attr('x', x)
				.attr('y', y)
				.attr('dy', dy + 'em');
		while ((word = words.pop())) {
			line.push(word);
			tspan.text(line.join(' '));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				tspan.text(line.join(' '));
				line = [word];
				tspan = text
					.append('tspan')
					.attr('x', x)
					.attr('y', y)
					.attr('dy', ++lineNumber * lineHeight + dy + 'em')
					.text(word);
				//adding a break so it never goes beyond 2 lines...
			}
		}
	});
}

function region_view() {
	//REUSABLE force_simulation chart

	var margins = 0,
		width = 0,
		height = 0,
		map_data = [],
		my_data = [],
		map_colour_range = '',
		my_class = '',
		current_year = '',
		current_sort = 'descending',
		map_width = 0,
		map_height = 300,
		map_start_y = 0,
		mobile_mode = false,
		my_region = '',
		tile_width = 0,
		tile_height = 0,
		rank_height = 25,
		tile_positions_x = [],
		tile_positions_y = [];

	function my(svg) {
		var percent_format = d3.format('.1~%');

		if (width > 1200) {
			map_width = width / 4;
			map_start_y =
				130 + (height - 130 - map_height - margins.bottom) / 2;
			tile_width = (width - width / 4 - margins.left * 6) / 4;
			tile_height = (height - margins.top - margins.bottom * 2) / 2;
			if ((tile_height - 35) / 10 < rank_height) {
				tile_height = rank_height * 10 + 20;
			} else {
				rank_height = (tile_height - 35) / 10;
			}
			tile_positions_x = [
				margins.left,
				margins.left * 2 + tile_width,
				width - margins.left * 2 - tile_width * 2,
				width - margins.left - tile_width,
			];
			tile_positions_x = tile_positions_x.concat(tile_positions_x);
			for (i = 0; i < 8; i++) {
				if (i < 4) {
					tile_positions_y.push(margins.top);
				} else {
					tile_positions_y.push(
						margins.top + margins.bottom + tile_height
					);
				}
			}
		} else {
			mobile_mode = true;
			map_width = width - margins.left - margins.right;
			map_height = 250;
			map_start_y = 170;
			tile_width = (map_width - margins.left) / 2;
			tile_height = rank_height * 10 + 35;
			var tile_y = margins.bottom + map_start_y + map_height;
			for (i = 0; i < 8; i++) {
				tile_positions_y.push(tile_y);
				if (i % 2 === 0) {
					tile_positions_x.push(margins.left);
				} else {
					tile_positions_x.push(margins.left * 2 + tile_width);
					tile_y += tile_height + margins.bottom;
				}
			}
			svg.attr(
				'height',
				map_start_y +
					margins.bottom +
					map_height +
					(tile_height + margins.bottom) * 4
			);
		}
		var years = d3.set(my_data, (d) => d.year).values();
		years = years.map((m) => +m);
		years = years.sort((a, b) => d3.ascending(a, b));
		current_year = years[years.length - 1];

		const countries = d3.set(my_data, (d) => d.country).values();
		let tiles_data = d3
			.nest()
			.key((k) => k.variablename)
			.entries(my_data.filter((f) => +f.year === current_year));

		const zoom = d3
			.zoom()
			.extent([
				[0, 0],
				[map_width, map_height],
			])
			.translateExtent([
				[-100, -100],
				[map_width, map_height],
			])
			.scaleExtent([1, 8])
			.on('zoom', zoomed);

		var projection = d3
			.geoMercator()
			.scale(map_width / 2 / Math.PI)
			.translate([map_width / 2, map_height / 2]);

		var path = d3.geoPath().projection(projection);

		if (
			d3.select('.region_overall_title' + my_class)._groups[0][0] === null
		) {
			svg.append('text').attr(
				'class',
				'info_item data_title region_overall_title' + my_class
			);
			svg.append('circle').attr(
				'class',
				'info_item region_info_circle' + my_class
			);
			svg.append('text').attr(
				'class',
				'info_item region_info_text' + my_class
			);
			svg.append('text').attr('class', 'toggle_left_text' + my_class);
			svg.append('text').attr('class', 'toggle_right_text' + my_class);
			svg.append('rect').attr('class', 'toggle_rect' + my_class);
			svg.append('circle').attr('class', 'toggle_circle' + my_class);
			svg.append('text').attr('class', 'map_title' + my_class);
			svg.append('rect').attr('class', 'map_rect map_rect' + my_class);
			svg.append('clipPath')
				.attr('id', 'region_clip' + my_class)
				.append('rect')
				.attr('class', 'region_clip_rect' + my_class);
			svg.append('g').attr('class', 'map_svg' + my_class);
		}
		var map_svg = d3.select('.map_svg' + my_class);

		d3.select('.map_title' + my_class)
			.attr('x', width / 2)
			.attr('y', map_start_y - 5)
			.attr('text-anchor', 'middle')
			.attr('font-size', 16)
			.text(my_region);

		d3.select('.map_rect' + my_class)
			.attr('x', (width - map_width) / 2)
			.attr('y', map_start_y)
			.attr('width', map_width)
			.attr('height', map_height);

		d3.select('.region_clip_rect' + my_class)
			.attr('width', map_width)
			.attr('height', map_height)
			.attr('fill', 'transparent');

		draw_tiles(tiles_data);

		function draw_tiles(tiles_data) {
			tiles_data.forEach(
				(d) =>
					(d.values = d.values.sort((a, b) =>
						d3[current_sort](+a.value, +b.value)
					))
			);

			const tiles_group = svg
				.selectAll('.tiles_group' + my_class)
				.data(tiles_data)
				.join(function (group) {
					var enter = group
						.append('g')
						.attr('class', 'tiles_group' + my_class);
					enter.append('rect').attr('class', 'tiles_rect');
					enter.append('text').attr('class', 'tiles_title');
					enter.append('g').attr('class', 'tiles_group');
					return enter;
				});

			tiles_group
				.select('.tiles_rect')
				.attr('x', (d, i) => tile_positions_x[i])
				.attr('y', (d, i) => tile_positions_y[i])
				.attr('width', tile_width)
				.attr('height', tile_height);

			tiles_group
				.select('.tiles_title')
				.attr('x', (d, i) => tile_positions_x[i] + tile_width / 2)
				.attr('y', (d, i) => tile_positions_y[i] + 20)
				.text((d) => d.key);

			tiles_group
				.select('.tiles_group')
				.attr(
					'transform',
					(d, i) =>
						'translate(' +
						tile_positions_x[i] +
						',' +
						tile_positions_y[i] +
						')'
				);

			const tile_contents_group = tiles_group
				.select('.tiles_group')
				.selectAll('.tile_contents_group' + my_class)
				.data((d) => d.values.filter((d, i) => i < 10))
				.join(function (group) {
					var enter = group
						.append('g')
						.attr('class', 'tile_contents_group' + my_class);
					enter.append('text').attr('class', 'rank_text');
					enter.append('rect').attr('class', 'tiles_bar');
					enter.append('svg:image').attr('class', 'flag_image');
					enter.append('text').attr('class', 'country_name');
					enter.append('text').attr('class', 'value_text');
					return enter;
				});

			tile_contents_group
				.select('.rank_text')
				.attr('font-size', 12)
				.attr('x', 17)
				.attr('text-anchor', 'end')
				.text((d, i) =>
					current_sort === 'descending'
						? i + 1
						: tiles_data[0].values.length - i
				)
				.transition()
				.duration(2000)
				.attr('y', (d, i) => 46 + i * rank_height);

			tile_contents_group
				.select('.tiles_bar')
				.attr('x', 20)
				.attr('y', (d, i) => 30 + i * rank_height)
				.attr('width', tile_width - 25)
				.attr('height', rank_height - 2)
				.attr('fill', '#F0F0F0');

			tile_contents_group
				.select('.country_name')
				.attr('font-size', 12)
				.attr('x', 60)
				.attr('y', (d, i) => 47 + i * rank_height)
				.text((d) => (tile_width > 300 ? d.country : d.geocode));

			tile_contents_group
				.select('.flag_image')
				.attr('x', 22)
				.attr('y', (d, i) => 35 + i * rank_height)
				.attr('width', 35)
				.attr('height', rank_height - 10)
				.attr('xlink:href', (d, i) => 'images/' + d.geocode + '.png');

			tile_contents_group
				.select('.value_text')
				.attr('font-size', 12)
				.attr('x', tile_width - 10)
				.attr('y', (d, i) => 46 + i * rank_height)
				.attr('text-anchor', 'end')
				.text((d) => percent_format(d.value / 100));
		}
		const map_group = map_svg
			.selectAll('.map_group' + my_class)
			.data(map_data.features)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'map_group' + my_class)
					.attr('clip-path', 'url(#region_clip' + my_class + ')');
				enter.append('path').attr('class', 'country_path');
				return enter;
			});

		map_group
			.select('.country_path')
			.attr('display', (d) =>
				countries.indexOf(d.properties.name) > -1 ? 'block' : 'none'
			)
			.attr('fill', '#37377D')
			.attr('stroke', 'white')
			.attr('stroke-width', 0.25)
			.attr('d', path)
			.on('mouseover', function (d) {
				d3.select(this).attr('cursor', 'pointer');
			})
			.on('mouseout', function (d) {
				d3.select(this).attr('cursor', 'default');
			})
			.on('click', function (d) {
				var my_iso = my_data.find(
					(f) => f.country === d.properties.name
				).geocode;
				window.open('country_view.html?country=' + my_iso);
			});

		map_group.attr(
			'transform',
			'translate(' + (width - map_width) / 2 + ',' + map_start_y + ')'
		);

		zoom_to_bounds();

		function zoomed() {
			const { transform } = d3.event;
			d3.selectAll('.country_path').attr('transform', transform);
		}

		function zoom_to_bounds() {
			const all_bounds = [];

			d3.selectAll('.country_path').each(function (d) {
				const my_name = d.properties.name;
				if (countries.find((d) => d === my_name) !== undefined) {
					var my_bounds = path.bounds(d);
					my_bounds[0].country = my_name;
					all_bounds.push(my_bounds);
				}
			});

			//fix to stop zooming in on left hand map portion of Russia when zoom is Europe
			const x0 = d3.min(all_bounds, (d) =>
				d[0].country !== 'Russia' ? d[0][0] : d[1][0]
			);
			const y0 = d3.min(all_bounds, (d) => d[0][1]);
			const x1 = d3.max(all_bounds, (d) => d[1][0]);
			const y1 = d3.max(all_bounds, (d) => d[1][1]);

			d3.selectAll('.country_path')
				.transition()
				.duration(750)
				.call(
					zoom.transform,
					d3.zoomIdentity
						.translate(map_width / 2, map_height / 2)
						.scale(
							Math.min(
								8,
								0.9 /
									Math.max(
										(x1 - x0) / map_width,
										(y1 - y0) / map_height
									)
							)
						)
						.translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
				);
		}
		d3.select('.region_overall_title' + my_class)
			.attr('text-anchor', 'middle')
			.attr('x', width / 2)
			.attr('y', margins.top - 10)
			.text('YDI');

		d3.select('.region_info_circle' + my_class)
			.attr('cx', width / 2 + 60)
			.attr('cy', margins.top - 20)
			.attr('fill', 'white')
			.attr('stroke', '#404040')
			.attr('r', 8);

		d3.select('.region_info_text' + my_class)
			.attr('pointer-events', 'nonoe')
			.attr('x', width / 2 + 60)
			.attr('y', margins.top - 15)
			.attr('fill', '#404040')
			.attr('text-anchor', 'middle')
			.attr('font-size', 14)
			.text('i');

		d3.selectAll('.info_item')
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
						(width - 100) +
						',height=' +
						(height - 100)
				);
			});

		const years_group = svg
			.selectAll('.years_group' + my_class)
			.data(years)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'years_group' + my_class);
				enter.append('text').attr('class', 'years_text');
				return enter;
			});

		years_group
			.select('.years_text')
			.attr('x', (d, i) => i * 35)
			.attr('y', margins.top + 25)
			.attr('text-anchor', 'middle')
			.attr('font-size', (d, i) => (i === years.length - 1 ? 16 : 12))
			.attr('font-weight', (d, i) =>
				i === years.length - 1 ? 'bold' : 'normal'
			)
			.text((d) => d)
			.on('mouseover', function (d) {
				d3.select(this).attr('cursor', 'pointer');
			})
			.on('mouseout', function (d) {
				d3.select(this).attr('cursor', 'default');
			})
			.on('click', function (d) {
				current_year = d;
				d3.selectAll('.years_text')
					.attr('font-size', 12)
					.attr('font-weight', 'normal');
				d3.select(this)
					.attr('font-size', 16)
					.attr('font-weight', 'bold');
				tiles_data = d3
					.nest()
					.key((k) => k.variablename)
					.entries(my_data.filter((f) => +f.year === current_year));
				draw_tiles(tiles_data);
			});

		years_group.attr(
			'transform',
			'translate(' + ((width - 35 * years.length) / 2 + 22.5) + ',0)'
		);

		d3.select('.toggle_rect' + my_class)
			.attr('rx', 10)
			.attr('ry', 10)
			.attr('x', width / 2 - 30)
			.attr('y', margins.top + 50)
			.attr('width', 60)
			.attr('height', 30)
			.attr('fill', '#A0A0A0')
			.on('click', function (d) {
				if (d3.event.offsetX < width / 2) {
					if (current_sort !== 'descending') {
						current_sort = 'descending';
						d3.select('.toggle_circle' + my_class).attr(
							'cx',
							width / 2 - 15
						);
						draw_tiles(tiles_data);
					}
				} else {
					if (current_sort !== 'ascending') {
						current_sort = 'ascending';
						d3.select('.toggle_circle' + my_class).attr(
							'cx',
							width / 2 + 15
						);
						draw_tiles(tiles_data);
					}
				}
			});

		d3.select('.toggle_circle' + my_class)
			.attr('cx', width / 2 - 15)
			.attr('cy', margins.top + 65)
			.attr('r', 10)
			.attr('fill', 'white')
			.call(d3.drag().on('drag', circle_drag).on('end', circle_drag_end));

		d3.select('.toggle_left_text' + my_class)
			.attr('x', width / 2 - 35)
			.attr('y', margins.top + 70)
			.attr('text-anchor', 'end')
			.text('TOP 10');

		d3.select('.toggle_right_text' + my_class)
			.attr('x', width / 2 + 35)
			.attr('y', margins.top + 70)
			.text('BOTTOM 10');

		function circle_drag() {
			var left_x = width / 2 - 15;
			var right_x = width / 2 + 15;
			if (d3.event.x > left_x && d3.event.x < right_x) {
				d3.select(this).attr('cx', d3.event.x);
			}
		}

		function circle_drag_end() {
			if (d3.event.x < width / 2) {
				d3.select(this).attr('cx', width / 2 - 15);
				if (current_sort !== 'descending') {
					current_sort = 'descending';
					draw_tiles(tiles_data);
				}
			} else {
				d3.select(this).attr('cx', width / 2 + 15);
				if (current_sort !== 'ascending') {
					current_sort = 'ascending';
					draw_tiles(tiles_data);
				}
			}
		}
	}

	my.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	};

	my.height = function (value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	};

	my.margins = function (value) {
		if (!arguments.length) return margins;
		margins = value;
		return my;
	};

	my.map_data = function (value) {
		if (!arguments.length) return map_data;
		map_data = value;
		return my;
	};

	my.my_data = function (value) {
		if (!arguments.length) return my_data;
		my_data = value;
		return my;
	};

	my.my_class = function (value) {
		if (!arguments.length) return my_class;
		my_class = value;
		return my;
	};

	my.map_colour_range = function (value) {
		if (!arguments.length) return map_colour_range;
		map_colour_range = value;
		return my;
	};

	my.my_region = function (value) {
		if (!arguments.length) return my_region;
		my_region = value;
		return my;
	};

	return my;
}

function country_view() {
	//REUSABLE force_simulation chart

	var margins = 0,
		width = 0,
		height = 0,
		map_data = [],
		my_data = [],
		overall_data = [],
		my_class = '',
		my_country = '',
		chart_height = 300,
		min_chart_width = 300,
		category_start_y = 300,
		chart_left_margin = 40,
		map_width = 300,
		map_height = 180;

	function my(svg) {
		var charts_per_row = parseInt(width / min_chart_width);
		var col_width = (width - margins.left - margins.right) / charts_per_row;
		var rect_width = col_width - 10;
		var chart_width = rect_width - 20;
		var groups = d3.set(my_data, (d) => d.group).values();
		groups = groups.sort((a, b) => d3.ascending(a, b));
		var colour_scale = d3
			.scaleOrdinal()
			.domain(groups)
			.range(globe.colours);
		var years = d3
			.set(my_data, (d) => d.year)
			.values()
			.map((m) => +m)
			.sort((a, b) => d3.ascending(a, b));
		var overall_years = d3
			.set(overall_data, (d) => d.year)
			.values()
			.map((m) => +m)
			.sort((a, b) => d3.ascending(a, b));
		var x_scale = d3
			.scalePoint()
			.domain(years)
			.range([0, chart_width - chart_left_margin - 5])
			.padding(0.1);
		var y_scale = d3
			.scaleLinear()
			.domain([0, 1])
			.range([chart_height - 105, 0]);
		var percent_format = d3.format('.1%');

		my_data = my_data.sort((a, b) => d3.ascending(a.group, b.group));

		const zoom = d3
			.zoom()
			.extent([
				[0, 0],
				[map_width, map_height],
			])
			.translateExtent([
				[-100, -100],
				[map_width, map_height],
			])
			.scaleExtent([1, 8])
			.on('zoom', zoomed);

		var projection = d3
			.geoMercator()
			.scale(map_width / 2 / Math.PI)
			.translate([map_width / 2, map_height / 2]);

		var path = d3.geoPath().projection(projection);

		var line = d3
			.line()
			.x((d) => x_scale(+d.key))
			.y((d) => y_scale(+d.value));

		var area = d3
			.area()
			.x((d) => x_scale(+d.key))
			.y0((d) => y_scale(+d.value))
			.y1((d) => y_scale(0));

		var value_line = d3
			.line()
			.x((d) => x_scale_ydi(+d.year))
			.y((d) => y_scale_ydi(+d.value / 100));

		var value_area = d3
			.area()
			.x((d) => x_scale_ydi(+d.year))
			.y0((d) => y_scale_ydi(+d.value / 100))
			.y1((d) => y_scale_ydi(0));

		var category_data = d3
			.nest()
			.key((d) => d.group + ':' + d.category)
			.key((d) => +d.year)
			.sortKeys(d3.ascending)
			.rollup((d) => +d[0].banded)
			.entries(my_data);

		var ydi_chart_rect_width =
			width - map_width - 40 - margins.left - margins.right;
		var ydi_chart_height = map_height + 10;

		var x_scale_ydi = d3
			.scalePoint()
			.domain(overall_years)
			.range([0, ydi_chart_rect_width - 20 - chart_left_margin])
			.padding(0.1);
		var y_scale_ydi = d3
			.scaleLinear()
			.domain([0, 1])
			.range([map_height, 0]);

		if (d3.select('.country_flag' + my_class)._groups[0][0] === null) {
			svg.append('svg:image').attr('class', 'country_flag' + my_class);
			svg.append('text').attr('class', 'country_text' + my_class);
			svg.append('rect').attr('class', 'map_rect' + my_class);
			svg.append('rect').attr('class', 'ydi_rect' + my_class);
			svg.append('rect').attr('class', 'ydi_chart_rect' + my_class);
			svg.append('text').attr('class', 'ydi_title' + my_class);
			svg.append('g').attr('class', 'map_svg' + my_class);
			svg.append('g').attr('class', 'axis x_axis' + my_class);
			svg.append('g').attr('class', 'axis y_axis' + my_class);
			svg.append('path').attr(
				'class',
				'value_line value_line' + my_class
			);
			svg.append('path').attr(
				'class',
				'value_area value_area' + my_class
			);
		}

		var map_svg = d3.select('.map_svg' + my_class);

		d3.select('.country_flag' + my_class)
			.attr('x', margins.left)
			.attr('y', margins.top)
			.attr('width', 100)
			.attr('height', 70)
			.attr('xlink:href', (d, i) => 'images/' + my_data[0].Iso3 + '.png');

		d3.select('.country_text' + my_class)
			.attr('x', margins.left + 110)
			.attr('y', margins.top + 45)
			.attr('font-size', 20)
			.text(my_country);

		d3.select('.map_rect' + my_class)
			.attr('fill', '#F0F0F0')
			.attr('x', margins.left)
			.attr('y', margins.top + 80)
			.attr('width', map_width)
			.attr('height', map_height);

		d3.select('.ydi_rect' + my_class)
			.attr('fill', '#F0F0F0')
			.attr('x', margins.left + map_width + 10)
			.attr('y', margins.top)
			.attr(
				'width',
				width - map_width - 20 - margins.left - margins.right
			)
			.attr('height', map_height + 80);

		d3.select('.ydi_chart_rect' + my_class)
			.attr('fill', 'white')
			.attr('x', margins.left + map_width + 20)
			.attr('y', margins.top + 40)
			.attr('width', ydi_chart_rect_width)
			.attr('height', map_height + 30);

		d3.select('.ydi_title' + my_class)
			.attr('x', margins.left + map_width + 20 + ydi_chart_rect_width / 2)
			.attr('y', margins.top + 25)
			.attr('font-size', 16)
			.attr('text-anchor', 'middle')
			.text('YDI Overall Score');

		d3.select('.x_axis' + my_class)
			.call(
				d3
					.axisBottom(x_scale_ydi)
					.tickSizeOuter(0)
					.tickFormat(d3.format('.0f'))
			)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + map_width + 30 + chart_left_margin) +
					',' +
					(margins.top + 40 + ydi_chart_height) +
					')'
			);

		d3.selectAll('.x_axis' + my_class + ' .tick text').attr('y', 4);

		d3.select('.y_axis' + my_class)
			.call(
				d3
					.axisLeft(y_scale_ydi)
					.tickSizeOuter(0)
					.tickFormat((d) => (+d > 0 ? d3.format('.0%')(d) : ''))
			)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin + map_width + 30) +
					',' +
					(margins.top + 50) +
					')'
			);

		d3.selectAll('.y_axis' + my_class + ' .tick text').attr('x', -2);

		d3.select('.value_line' + my_class)
			.attr('stroke', '#404040')
			.attr('d', value_line(overall_data))
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin + map_width + 30) +
					',' +
					(margins.top + 50) +
					')'
			);

		d3.select('.value_area' + my_class)
			.attr('fill', '#404040')
			.attr('d', value_area(overall_data))
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin + map_width + 30) +
					',' +
					(margins.top + 50) +
					')'
			);

		const ydi_dot_group = svg
			.selectAll('.ydi_dot_group' + my_class)
			.data(overall_data)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'ydi_dot_group' + my_class);
				enter.append('circle').attr('class', 'ydi_year_dot');
				return enter;
			});

		ydi_dot_group
			.select('.ydi_year_dot')
			.attr('fill', '#404040')
			.attr('cx', (d) => x_scale_ydi(+d.year))
			.attr('cy', (d) => y_scale_ydi(+d.value / 100))
			.attr('r', 3)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin + map_width + 30) +
					',' +
					(margins.top + 50) +
					')'
			)
			.on('mouseover', function (d) {
				d3.select(this).attr('cursor', 'pointer');
				d3.select('.tooltip')
					.style('left', d3.event.offsetX + 10 + 'px')
					.style('top', d3.event.offsetY + 'px')
					.style('visibility', 'visible')
					.html(
						'<strong>Year:</strong> ' +
							d.year +
							'<br><strong>Value:</strong> ' +
							percent_format(+d.value / 100)
					);
			})
			.on('mouseout', function (d) {
				d3.select(this).attr('cursor', 'default');
				d3.select('.tooltip').style('visibility', 'hidden');
			});

		const legend_group = map_svg
			.selectAll('.legend_group' + my_class)
			.data(groups)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'legend_group' + my_class);
				enter
					.append('text')
					.attr(
						'class',
						'legend_item' + my_class + ' legend_text' + my_class
					);
				enter
					.append('rect')
					.attr(
						'class',
						'legend_item' + my_class + ' legend_rect' + my_class
					);
				return enter;
			});

		legend_group
			.select('.legend_text' + my_class)
			.attr('font-size', 10)
			.attr('id', (d, i) => 'legend_text' + i)
			.attr('y', category_start_y + 3)
			.text((d) => d);

		legend_group
			.select('.legend_rect' + my_class)
			.attr('id', (d, i) => 'legend_rect' + i)
			.attr('y', category_start_y - 5)
			.attr('height', 10)
			.attr('width', 15)
			.attr('fill', (d) => colour_scale(d));

		var legend_x = 0;
		d3.selectAll('.legend_text' + my_class).each(function (d, i) {
			d3.select(this).attr('x', legend_x);
			var my_width = document
				.getElementById(this.id)
				.getBoundingClientRect().width;
			d3.select('#legend_rect' + i).attr('x', legend_x + my_width + 5);
			legend_x += my_width + 25;
		});

		d3.selectAll('.legend_item' + my_class).attr(
			'transform',
			'translate(' + (width - legend_x) / 2 + ',0)'
		);

		var rows = parseInt(category_data.length / charts_per_row);
		if (category_data.length % charts_per_row > 0) {
			rows += 1;
		}
		if (
			category_start_y +
				rows * chart_height +
				margins.bottom +
				margins.top >
			height
		) {
			height =
				category_start_y +
				rows * chart_height +
				margins.bottom +
				margins.top;
			svg.attr('height', height);
		}

		const category_group = svg
			.selectAll('.category_group' + my_class)
			.data(category_data)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'category_group' + my_class);
				enter.append('rect').attr('class', 'chart_rect');
				enter.append('text').attr('class', 'chart_category_label');
				enter.append('rect').attr('class', 'line_chart_rect');
				enter.append('g').attr('class', 'axis x_axis');
				enter.append('g').attr('class', 'axis y_axis');
				enter.append('path').attr('class', 'value_line');
				enter.append('path').attr('class', 'value_area');
				enter.append('g').attr('class', 'dot_group');
				return enter;
			});

		category_group.attr(
			'transform',
			(d, i) =>
				'translate(' +
				(i % charts_per_row) * col_width +
				',' +
				parseInt(i / charts_per_row) * chart_height +
				')'
		);

		category_group
			.select('.chart_rect')
			.attr('fill', (d) => colour_scale(d.key.split(':')[0]))
			.attr('stroke', (d) => colour_scale(d.key.split(':')[0]))
			.attr('width', rect_width)
			.attr('height', chart_height - 10)
			.attr(
				'transform',
				'translate(' +
					margins.left +
					',' +
					(category_start_y + margins.top) +
					')'
			);

		category_group
			.select('.chart_category_label')
			.attr('dy', 0)
			.attr('x', rect_width / 2)
			.attr('y', 20)
			.text((d) => d.key.split(':')[1])
			.attr(
				'transform',
				'translate(' +
					margins.left +
					',' +
					(category_start_y + margins.top) +
					')'
			)
			.call(wrap, rect_width - 10);

		category_group
			.select('.line_chart_rect')
			.attr('fill', 'white')
			.attr('stroke', 'none')
			.attr('x', 10)
			.attr('y', 45)
			.attr('width', chart_width)
			.attr('height', chart_height - 65)
			.attr(
				'transform',
				'translate(' +
					margins.left +
					',' +
					(category_start_y + margins.top) +
					')'
			);

		category_group
			.select('.x_axis')
			.call(
				d3
					.axisBottom(x_scale)
					.tickSizeOuter(0)
					.tickFormat(d3.format('.0f'))
			)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin) +
					',' +
					(category_start_y +
						margins.top +
						45 +
						(chart_height - 85)) +
					')'
			);

		category_group.selectAll('.x_axis .tick text').attr('y', 4);

		category_group
			.select('.y_axis')
			.call(
				d3
					.axisLeft(y_scale)
					.tickSizeOuter(0)
					.tickFormat((d) => (+d > 0 ? d3.format('.0%')(d) : ''))
			)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin) +
					',' +
					(category_start_y + margins.top + 65) +
					')'
			);

		category_group.selectAll('.y_axis .tick text').attr('x', -2);

		category_group
			.select('.value_line')
			.attr('stroke', (d) => colour_scale(d.key.split(':')[0]))
			.attr('d', (d) => line(d.values))
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin) +
					',' +
					(category_start_y + margins.top + 65) +
					')'
			);

		category_group
			.select('.value_area')
			.attr('fill', (d) => colour_scale(d.key.split(':')[0]))
			.attr('d', (d) => area(d.values))
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin) +
					',' +
					(category_start_y + margins.top + 65) +
					')'
			);

		const dot_group = category_group
			.select('.dot_group')
			.selectAll('.dot_group' + my_class)
			.data(function (d) {
				d.values.map(
					(m) => (m.fill = colour_scale(d.key.split(':')[0]))
				);
				return d.values;
			})
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'dot_group' + my_class);
				enter.append('circle').attr('class', 'year_dot');
				return enter;
			});

		dot_group
			.select('.year_dot')
			.attr('fill', (d) => d.fill)
			.attr('cx', (d) => x_scale(+d.key))
			.attr('cy', (d) => y_scale(+d.value))
			.attr('r', 3)
			.attr(
				'transform',
				(d, i) =>
					'translate(' +
					(margins.left + chart_left_margin) +
					',' +
					(category_start_y + margins.top + 65) +
					')'
			)
			.on('mouseover', function (d) {
				d3.select(this).attr('cursor', 'pointer');
				d3.select('.tooltip')
					.style('left', d3.event.offsetX + 10 + 'px')
					.style('top', d3.event.offsetY + 'px')
					.style('visibility', 'visible')
					.html(
						'<strong>Year:</strong> ' +
							d.key +
							'<br><strong>Value:</strong> ' +
							percent_format(+d.value)
					);
			})
			.on('mouseout', function (d) {
				d3.select(this).attr('cursor', 'default');
				d3.select('.tooltip').style('visibility', 'hidden');
			});

		const map_group = map_svg
			.selectAll('.map_group' + my_class)
			.data(
				map_data.features.filter(
					(f) => f.properties.name === my_country
				)
			)
			.join(function (group) {
				var enter = group
					.append('g')
					.attr('class', 'map_group' + my_class)
					.attr('clip-path', 'url(#region_clip' + my_class + ')');
				enter.append('path').attr('class', 'country_path');
				return enter;
			});

		map_group
			.select('.country_path')
			.attr('fill', '#A0A0A0')
			.attr('stroke', 'white')
			.attr('stroke-width', 0.25)
			.attr('d', path);

		map_group.attr(
			'transform',
			'translate(' + margins.left + ',' + (margins.top + 90) + ')'
		);

		zoom_to_bounds();

		function zoomed() {
			const { transform } = d3.event;
			d3.selectAll('.country_path').attr('transform', transform);
		}
		function zoom_to_bounds() {
			const all_bounds = [];

			d3.selectAll('.country_path').each(function (d) {
				const my_name = d.properties.name;
				var my_bounds = path.bounds(d);
				my_bounds[0].country = my_name;
				all_bounds.push(my_bounds);
			});

			//fix to stop zooming in on left hand map portion of Russia when zoom is Europe
			const x0 = d3.min(all_bounds, (d) =>
				d[0].country !== 'Russia' ? d[0][0] : d[1][0]
			);
			const y0 = d3.min(all_bounds, (d) => d[0][1]);
			const x1 = d3.max(all_bounds, (d) => d[1][0]);
			const y1 = d3.max(all_bounds, (d) => d[1][1]);

			d3.selectAll('.country_path')
				.transition()
				.duration(750)
				.call(
					zoom.transform,
					d3.zoomIdentity
						.translate(map_width / 2, map_height / 2)
						.scale(
							Math.min(
								8,
								1 /
									Math.max(
										(x1 - x0) / map_width,
										(y1 - y0) / map_height
									)
							)
						)
						.translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
				);
		}
	}

	my.width = function (value) {
		if (!arguments.length) return width;
		width = value;
		return my;
	};

	my.height = function (value) {
		if (!arguments.length) return height;
		height = value;
		return my;
	};

	my.margins = function (value) {
		if (!arguments.length) return margins;
		margins = value;
		return my;
	};

	my.map_data = function (value) {
		if (!arguments.length) return map_data;
		map_data = value;
		return my;
	};

	my.my_data = function (value) {
		if (!arguments.length) return my_data;
		my_data = value;
		return my;
	};

	my.overall_data = function (value) {
		if (!arguments.length) return overall_data;
		overall_data = value;
		return my;
	};

	my.my_class = function (value) {
		if (!arguments.length) return my_class;
		my_class = value;
		return my;
	};

	my.my_country = function (value) {
		if (!arguments.length) return my_country;
		my_country = value;
		return my;
	};

	return my;
}
