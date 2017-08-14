var viewStyle = 'network'

var App = {};
App.category = null;

function nodeOpacity(n){
  if (App.category) {
    return App.category === n.type ? 1 : 0.1;
  } else {
    switch (n.type) {
      case "center":
        return 1;
      case "subject":
        return 0.13;
      case "project":
        return 0.5;
      default:
        return 0.2;
    }
  }
}

function makeYearString(d){
  var year = d.startyear
  if (d.endyear) {
    year = `${year}-${d.endyear}`
  }
  if (d.inactive){
    year = `${year} (inactive)`
  }
  return year
}

function makeSimulation(height, width, data){
  var cx = width/2;
  var cy = height/2;

  var links = []
  data.forEach(function(d) {
    d.links.split(',').forEach(function(l){
      if (l !== '') {
        var source = data.filter( (x) => {return d.id === x.id})
        var target = data.filter( (x) => {return l === x.id})
        links.push({source: source[0], target: target[0]})
      }
    })
  });

  // Define all the forces
  var linkForce = d3.forceLink(links)
    .id(function(d) { return d.name; })
    .distance(10)
    .strength(0.2);

  // keeps nodes from sliding off page
  function boxForce(){
    data.forEach(function(n) {
      var distX = n.width/2;
      var distY = n.height;

      if (n.y < 250 || n.y > (height-50)) {
        // if point is near top or bottom, constrain x in smaller box
        n.x = Math.max(distX+100, Math.min(width - distX-250, n.x));
      } else {
        // otherwise just keep x 10px from left and right
        n.x = Math.max(distX+10, Math.min(width - distX-10, n.x));
      }
      // keep y 15px from top and bottom
      n.y = Math.max(distY+15, Math.min(height - distY-15, n.y));
    });
  }

  // keeps nodes from overlapping, by moving their y value
  function rectCollide() {
    var strength = 0.1;
    var padding = 2;
    for (var ii=0; ii<3; ii++){
      for (var i = 0; i < data.length; ++i) {
        var a = data[i];
        for (var j = i + 1; j < data.length; ++j) {
          var b = data[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            lx = Math.abs(x),
            ly = Math.abs(y),
            // both centered so add widths but divide by 2
            w = (a.width + b.width + padding)/2,
            // if a is above b, then use a's height, otherwise b's
            h = (a.y > b.y) ? (a.height + padding) : (b.height + padding);
          if (lx < w && ly < h) {
            ly = (ly - h) * (y < 0 ? -strength : strength);
            a.vy -= ly, b.vy += ly;
          }
        }
      }
    }
  }

  // puts project nodes in a circle with radius 200-300 around center
  function concentricCircles() {
    var smallRadius = 200;
    var bigRadius = 300;
    data.forEach(function(n) {
      var strength = 3;
      var distX = n.x - cx;
      var distY = n.y - cy;
      var dist = Math.sqrt(Math.pow(distX,2)+ Math.pow(distY,2));
      // a^2 + b^2
      var sumSquares = Math.pow(distX,2) + Math.pow(distY,2);
      if (n.type === "project") {
        // pythag theorem: if a^2 + b^2 <= csmall^2,
        // then hypotenuse is smaller than radius of small circle
        // point is inside small circle
        if ( sumSquares <= Math.pow(smallRadius,2) ){
          n.x = cx + distX / dist * smallRadius;
          n.y = cy + distY / dist * smallRadius;
        // if a^2 + b^2 > cbig^2
        // then hypotenuse is bigger than radius of big circle
        // point is outside big circle
        } else if ( sumSquares > Math.pow(bigRadius,2) ){
          n.x = cx + distX / dist * bigRadius;
          n.y = cy + distY / dist * bigRadius;
        }
      }
    });
  }

  var dragstarted = function(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  var dragged = function(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  var dragended = function(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  var setNodeDimensions = function(d, i) {
    data[i].width = this.getBoundingClientRect().width;
    data[i].height = this.getBoundingClientRect().height;
    if (data[i].id === "center") {
      // fix center node
      d.fx = cx;
      d.fy = cy;
    } else {
      // start other nodes in random position
      d.x = Math.random()*width;
      d.y = Math.random()*height;
    }
  }

  var handleMouseover = function(d) {
    if (d.href) {
      nodeEnter.style("fill", function(n) {
        if (d === n) {
          return "#0000ff";
        }
      });
      nodeEnter.attr("class", function(n) {
        if (d === n) {
          return "hover nodetext"
        } else {
          return "nodetext"
        }
      });
    }
    if (viewStyle === 'network') {
      if (d.explanation) {
        $("#explanation").html(`<div>${d.explanation}</div><div class='year'>${makeYearString(d)}</div>`).css("opacity", 0.5);
      }
      link.style("stroke-width", function(l) {
        if (d === l.source || d === l.target) {
          return 0.5;
        } else {
          return 0.05;
        }
      });
      return nodeEnter.style("opacity", function(n) {
        if (d === n) {
          return 1;
        }
        if (links.find(function(l) {
          return (d === l.source && n === l.target) || (n === l.source && d === l.target);
        })) {
          return 1;
        } else {
          return 0.1;
        }
      });
    }
  }

  var handleMouseout = function(d) {
    nodeEnter.style("fill", "#000000");
    nodeEnter.attr("class", function(n){
      return "nodetext"
    })
    if (viewStyle === 'network') {
      link.style("stroke-width", 0.05);
      updateNodeOpacity();
      $("#explanation").css("opacity", 0);
    }
  }

  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

  var simulation = d3.forceSimulation()
    .nodes(data)
    .force("charge", d3.forceManyBody().strength(-800))
    .force("concentric", concentricCircles)
    .force("links", linkForce)
    .force("collide", rectCollide)
    .force("box_force", boxForce);

  var link = svg.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .style("opacity", 1)
    .style("stroke-width", 0.05)

  var node = svg.selectAll(".node")
    .data(data, d => d.id)

  var nodeEnter = node.enter()
    .append('g')
    .attr("class", function(d){return "node " + d.type})
    .append("svg:a")
    .attr("target", "_blank")
    .attr("xlink:href", function(d){
      if (d.href !== '') {
        return d.href
      }
    })
    .append("text")
    .attr("class", "nodetext")
    .text( function(d){return d.text})
    .style("opacity", nodeOpacity)
    .style("text-anchor", "middle")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  var tickActions = function() {
    // moves nodes and links on every tick
    nodeEnter
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  }
  simulation.on("tick", tickActions);

  nodeEnter.each(setNodeDimensions)
  nodeEnter.on("mouseover", handleMouseover)
  nodeEnter.on("mouseout", handleMouseout)

  var updateNodeOpacity = function() {
    return nodeEnter.style("opacity", function(n) {
      return nodeOpacity(n);
    });
  };

  var categoryOff = function() {
    App.category = null;
    $(".category").css("color", "");
    return updateNodeOpacity();
  };

  var categoryOn = function() {
    $(".category[data=" + App.category + "]").css("color", "purple");
    return updateNodeOpacity();
  };

  $(".category").click(function() {
    var category;
    category = $(this).attr("data");
    if (App.category === category) {
      return categoryOff();
    } else {
      categoryOff();
      App.category = category;
      return categoryOn();
    }
  });

  var listView = function(){
    simulation.stop()
    simulation.alphaTarget(0)

    var projects = data.filter(function(n){
      return n.type === 'project' || n.type === 'center'
    }).sort(function(a, b){
      if (a.type === 'center' || b.type === 'center') {
        return a.type === 'center' ? -1 : 1
      } else {
        return b.startyear - a.startyear
      }
    })

    node = svg.selectAll(".node")
      .data(projects, d => d.id)

    node
      .exit()
      .remove()

    var listHeight = 0
    var itemHeights = []

    nodeEnter
      .on('mousedown.drag', null)
      .style("opacity", 1)
      .style("text-anchor", "start")

    node
      .append('foreignObject')
      .attr('class', 'list-explanation-container')
      .attr('opacity', 0)
      .attr('x', 200)
      .attr('width', 500)
      .attr('height', 100)
      .append("xhtml:div")
      .attr('class', 'list-explanation')
      .html(function(d){
        return `<div class='year'>${makeYearString(d)}</div><div>${d.explanation}</div>`
      })
      .each(function(d){
        itemHeights[projects.indexOf(d)] = this.getBoundingClientRect().height + 60
      })

    node.selectAll(".list-explanation-container")
      .attr('y', function(d){
        var y = 0
        for (var i=0;i<projects.indexOf(d);i++){
          y += itemHeights[i]
        }
        return y + 110
      })

    nodeEnter
      .transition()
      .duration(500)
      .attr("x", 200)
      .attr('y', function(d){
        var y = 0
        for (var i=0;i<projects.indexOf(d);i++){
          y += itemHeights[i]
        }
        return y + 100
      })
      .on("end", function(d){
        node.selectAll(".list-explanation-container")
          .attr('opacity', 1)
      });

    svg
      .attr('height', function(){
        var y = 0
        for (var i=0;i<projects.length;i++){
          y += itemHeights[i]
        }
        return 110+ y
      })
      .attr('width', function(){
        return window.innerWidth-2
      })
    link.remove()
  }

  var networkView = function(){
    var restartSim = function(){
      simulation.alphaTarget(0.7).restart()
    }

    link = svg.selectAll(".link")
      .data(links)

    link = link
      .enter()
      .append("line")
      .attr("class", "link")
      .style("opacity", 1)
      .style("stroke-width", 0.05)

    link
      .exit()
      .remove()

    node = svg.selectAll(".node")
      .data(data, d => {return d.id})

    nodeEnter
      .transition()
      .duration(500)
      .attr("x", function(d){
        return d.x
      })
      .attr("y", function(d){
        return d.y
      })
      .on("end", restartSim);

    nodeEnter = node.enter()
      .append("g")
      .attr("class", function(d){return "node " + d.type})
      .append("svg:a")
      .attr("target", "_blank").attr("xlink:href", function(d){
        if (d.href !== '') {
          return d.href
        }
      })
      .append("text")
      .attr("class", "nodetext")
      .text( (d) => d.text)
      .merge(nodeEnter)
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .style("opacity", nodeOpacity)
      .style("text-anchor", "middle")

    nodeEnter.on("mouseover", handleMouseover)
    nodeEnter.on("mouseout", handleMouseout)

    svg.selectAll('.list-explanation-container').remove()

    node
      .exit()
      .remove()

    svg
      .attr('height', function(){
        return height
      })
      .attr('width', function(){
        return window.innerWidth-2
      })
  }

  $('.toggle-view').click(function(){
    if (viewStyle === 'network') {
      viewStyle = 'list'
      $(this).text('graph view')
      listView()
    } else {
      viewStyle = 'network'
      $(this).text('chronological view')
      networkView()
    }
  })
}

d3.json("data.json", function(json) {
  var width = window.innerWidth-2;
  var height = window.innerHeight-2;
  makeSimulation(height, width, json)
})
