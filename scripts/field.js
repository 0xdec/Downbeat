const DIMENSIONS = {
  width: 360,
  height: 160,
  border: 6,
  line: {
    width: new Fraction(0, 1, 3),
    length: 2
  },
  numbers: {
    top: {
      highschool: 27,
      college: 27,
      pro: 42
    },
    width: 4,
    height: 6
  },
  hashes: {
    front: {
      highschool: new Fraction(53, 1, 3),
      college: 60,
      pro: new Fraction(70, 3, 4)
    },
    back: {
      highschool: new Fraction(106, 2, 3),
      college: 100,
      pro: new Fraction(89, 1, 4)
    }
  },
  tee: {
    highschool: 40,
    college: 35,
    pro: 35
  }
};

const COLORS = {
  performer: {
    fill:   '#fff',
    stroke: '#13294b',
    text:   '#13294b',
    select: '#e04e39'
  }
};

const MARCHER = 3.5;

var xScale = d3.scaleLinear()
  .domain([-96, 96])
  .range([-DIMENSIONS.width / 2, DIMENSIONS.width / 2]);
var yScale = d3.scaleLinear()
  .domain([0, new Fraction(85, 1, 3)])
  .range([0, -DIMENSIONS.height]);
function parent() {
  return this.parentNode;
}



class Field {
  constructor(elem, id) {
    this.viewbox = [[-(DIMENSIONS.width / 2 + DIMENSIONS.border), -(DIMENSIONS.height + DIMENSIONS.border)], [DIMENSIONS.width + DIMENSIONS.border * 2, DIMENSIONS.height + DIMENSIONS.border * 2]];

    this.svg = d3.select(`#${elem}`).append('svg')
      .attr('id', id)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr('viewBox', this.viewbox.join(' ').replace(/\,/g, ' '))
      .call(d3.zoom().extent(this.viewbox).scaleExtent([1, 10]).translateExtent(this.viewbox).on("zoom", () => this.svg.attr("transform", d3.event.transform)))
      .append('g');
    // .on("wheel.zoom", null);

    this.drawField();
  }

  // Draw field and markings
  drawField() {
    this.svg.append('rect')
      .attr('x', -DIMENSIONS.width / 2)
      .attr('y', -DIMENSIONS.height)
      .attr('width', DIMENSIONS.width)
      .attr('height', DIMENSIONS.height)
      .classed('field-turf field-theme field-line-width', true);

    // End zones
    let endzones = [-DIMENSIONS.width / 2 + 15, DIMENSIONS.width / 2 - 15];
    this.svg.selectAll('.field-endzone')
        .data(endzones)
      .enter().append('rect')
        .attr('x', d => d - 15)
        .attr('y', -DIMENSIONS.height)
        .attr('width', 30)
        .attr('height', DIMENSIONS.height)
        .classed('field-endzone field-theme field-line-width', true)
      .exit().remove();

    // 3-yard markers
    for (let h of [-141, 141]) {
      this.svg.append('line')
        .attr('x1', h)
        .attr('y1', -(DIMENSIONS.height - DIMENSIONS.line.length) / 2)
        .attr('x2', h)
        .attr('y2', -(DIMENSIONS.height + DIMENSIONS.line.length) / 2)
        .classed('field-lines field-theme field-line-width', true);
    }

    // Tee markers
    for (let type in DIMENSIONS.tee) {
      let x = (50 - DIMENSIONS.tee[type]) * 3;
      let y = DIMENSIONS.height / 2;

      for (let h of [-x, x]) {
        for (let r of [-45, 45]) {
          this.svg.append('line')
            .attr('x1', h)
            .attr('y1', -(y - DIMENSIONS.line.length / 2))
            .attr('x2', h)
            .attr('y2', -(y + DIMENSIONS.line.length / 2))
            .attr('transform', `rotate(${r},${h},${-y})`)
            .classed(`field-${type} field-lines field-theme field-line-width`, true);
        }
      }
    }

    // Yard lines
    let yardlines = [];
    for (let i = -50; i <= 50; i += 5) {
      yardlines.push(i * 8 / 5);
    }
    this.svg.selectAll('.yardline')
        .data(yardlines)
      .enter().append('g')
        .attr('transform', d => `translate(${xScale(d)},0)`)
      .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', -DIMENSIONS.height)
        .classed('field-lines field-theme field-line-width', true)
        .select(parent)
      .each(function(d, i) {
        let fifty = Math.floor(yardlines.length / 2);

        let drawLine = (x, y, length, dir, type) => {
          let x1, x2, y1, y2;

          if (dir === 'h') {
            x1 = x - length / 2;
            x2 = x + length / 2;
            y1 = y;
            y2 = y;
          } else {
            x1 = x;
            x2 = x;
            y1 = y - length / 2;
            y2 = y + length / 2;
          }

          d3.select(this).append('line')
            .attr('x1', x1)
            .attr('y1', -y1)
            .attr('x2', x2)
            .attr('y2', -y2)
            .classed(`field-${type} field-lines field-theme field-line-width`, true);
        };

        let drawText = (x, y, size, dir, text, type) => {
          d3.select(this).append('text')
            .text(text)
            .attr('font-family', 'Helvetica')
            .attr('font-size', size)
            .attr('line-height', 1)
            .attr('text-anchor', 'middle')
            .attr('x', x)
            .attr('y', -y)
            .attr('transform', `rotate(${dir * 180},${x},${-y})`)
            .classed(`field-${type} field-numbers field-theme`, true);
        };

        // Hash marks
        for (let hash in DIMENSIONS.hashes) {
          for (let type in DIMENSIONS.hashes[hash]) {
            if (i > 0 && i < yardlines.length - 1) {
              drawLine(0, DIMENSIONS.hashes[hash][type], DIMENSIONS.line.length, 'h', type);
            }

            if (i !== fifty) {
              let m = i > fifty ? -1 : 1;
              let o = (hash === 'front' ? -1 : 1) * DIMENSIONS.line.length / 2;

              for (let h = 1; h < 5; h++) {
                drawLine(m * h * 3, DIMENSIONS.hashes[hash][type] + o, DIMENSIONS.line.length, 'v', type);
              }
            }
          }
        }

        // Yard marks
        if (i !== fifty) {
          let m = i > fifty ? -1 : 1;
          let arr = [(DIMENSIONS.line.length + DIMENSIONS.line.width * 3) / 2];
          arr.push(DIMENSIONS.height - arr[0]);

          for (let h = 1; h < 5; h++) {
            for (let v of arr) {
              drawLine(m * h * 3, v, DIMENSIONS.line.length, 'v');
            }
          }
        }

        // Yard numbers
        if (i && (i < yardlines.length - 1) && (i % 2 === 0)) {
          for (let type in DIMENSIONS.numbers.top) {
            let arr = [DIMENSIONS.numbers.top[type] - DIMENSIONS.numbers.height];
            arr.push(DIMENSIONS.height - arr[0]);

            for (let v in arr) {
              drawText(0, arr[v], DIMENSIONS.numbers.height, v, 50 - Math.abs(yardlines[i] * 5 / 8), type);
            }
          }
        }
      })
      .exit().remove();

    // Step grid
    for (let y = 1; y < 85.3; y++) {
      if (y % 8) {
        this.svg.append('line')
          .attr('x1', -DIMENSIONS.width / 2 + 30)
          .attr('y1', -y * 1.875)
          .attr('x2', DIMENSIONS.width / 2 - 30)
          .attr('y2', -y * 1.875)
          .classed('field-grid field-step-lines field-theme', true);
      }
    }
    for (let x = -79; x < 80; x++) {
      if (x % 8) {
        this.svg.append('line')
          .attr('x1', x * 1.875)
          .attr('y1', 0)
          .attr('x2', x * 1.875)
          .attr('y2', -DIMENSIONS.height)
          .classed('field-grid field-step-lines field-theme', true);
      }
    }

    // Zero grid
    for (let y = 15; y < 160; y += 15) {
      this.svg.append('line')
        .attr('x1', -DIMENSIONS.width / 2 + 30)
        .attr('y1', -y)
        .attr('x2', DIMENSIONS.width / 2 - 30)
        .attr('y2', -y)
        .classed('field-grid field-zero-lines field-theme', true);
      if (y !== DIMENSIONS.hashes.front.college) {
        for (let x = -DIMENSIONS.width / 2 + 30; x <= DIMENSIONS.width / 2 - 30; x += 15) {
          this.svg.append('circle')
            .attr('r', 0.125)
            .attr('cx', x)
            .attr('cy', -y)
            .classed('field-grid field-zero-points field-theme', true);
        }
      }
    }
  }

  // Draw all performers
  load(performers) {
    for (let p of performers) {
      p.selected = false;
    }

    this.svg.selectAll('.performer').remove();

    // Performer icon
    this.svg.selectAll('.performer')
        .data(performers, d => drill.parseName(d))
      .enter().append('g')
        .classed('performer', true)
        .attr('id', d => `performer_${drill.parseName(d)}`)
        .style('cursor', 'pointer')
        .on('click', p => this.select(p))
      .append('circle')
        .style('fill', d => COLORS.performer[d.selected ? 'select' : 'fill'])
        .style('stroke', COLORS.performer.stroke)
        .style('stroke-width', 0.25)
        .attr('r', MARCHER / 2)
        .attr('cx', 0)
        .attr('cy', 0)
        .select(parent)
      .append('text')
        .text(d => drill.parseName(d))
        .style('fill', COLORS.performer.text)
        .attr('font-family', 'Helvetica')
        .attr('font-size', MARCHER / 2)
        .attr('text-anchor', 'middle')
        .attr('y', MARCHER / 5)
        .select(parent)
      .exit().remove();
  }

  select(p) {
    if (this.selected === p) {
      this.selected = undefined;
    } else {
      this.select(this.selected);
      this.selected = p;
    }

    if (p) {
      p.selected = !p.selected;

      /* p.icon.first().fill({
        color: COLORS.performer[p.selected ? 'select' : 'fill']
      }); */
      this.svg.select(`#performer_${drill.parseName(p).replace('\\', '\\\\').replace('*', '\\*')}`)
        .select('circle')
        .style('fill', COLORS.performer[p.selected ? 'select' : 'fill']);

      drill.refresh();
    }
  }

  markings(markings, show) {
    if (markings instanceof Array) {
      for (let type of markings) {
        this.markings(type, show);
      }
    } else if (markings instanceof Object) {
      for (let type in markings) {
        this.markings(type, markings[type]);
      }
    } else {
      this.svg.selectAll(`.field-${markings}`).classed('d-none', !show);
    }
  }

  theme(theme) {
    for (let t of ['bw', 'color']) {
      this.svg.selectAll('.field-theme').classed(`field-theme-${t}`, theme === t);
    }
  }
}
