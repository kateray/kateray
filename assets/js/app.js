var App = {};
App.category = null;

function nodeOpacity(n){
  if (App.category) {
    return App.category === n.type ? 1 : 0.1;
  } else {
    if (n.type === "center") {
      return 1;
    } else if (n.type === "project") {
      return 0.5;
    } else if (n.type === "subject") {
      return 0.13;
    } else {
      return 0.2;
    }
  }
}

function nodeFontSize(n) {
  switch (n.type) {
    case "center":
      return "60px";
    case "subject":
      return "16px";
    case "essay":
      return "15px";
    case "project":
      return "25px";
    default:
      return "12px";
  }
}

function parseData(data){
  _.each(data.links, function(l) {
    l.source = _.findWhere(data.nodes, {
      id: l.source
    });
    return l.target = _.findWhere(data.nodes, {
      id: l.target
    });
  });
  return data;
}

$(document).ready(function() {
  var width = $(window).width()-2;
  var height = $(window).height()-2;

  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

  d3.json("data.json", function(json) {
    var data = parseData(json);

    var linkForce = d3.forceLink(data.links)
      .id(function(d) { return d.name; })
      .distance(10)
      .strength(0.4);

    // keeps nodes from sliding off page
    // from http://www.puzzlr.org/bounding-box-force-directed-graph/
    function boxForce(){
      _.each(data.nodes, function(n) {
        n.x = Math.max(n.width/2, Math.min(width - n.width/2, n.x));
        // try to keep y 15px from top and 10px from bottom
        n.y = Math.max(n.height+15, Math.min(height - n.height-15, n.y));
      });
    }

    // keeps nodes from overlapping, by moving their y value
    // based on https://bl.ocks.org/mbostock/4055889
    function rectCollide() {
      var strength = 0.25;
      var padding = 2;
      var t = data.nodes.length;
      _.times(3, function(){
        for (var i = 0; i < t; ++i) {
          var a = data.nodes[i];
          for (var j = i + 1; j < t; ++j) {
            var b = data.nodes[j],
              x = a.x + a.vx - b.x - b.vx,
              y = a.y + a.vy - b.y - b.vy,
              lx = Math.abs(x),
              ly = Math.abs(y),
              w = a.width + b.width + padding,
              h = a.height + b.height + padding;

            if (lx < w && ly < h) {
              ly = (ly - h) * (y < 0 ? -strength : strength);
              a.vy -= ly, b.vy += ly;
            }
          }
        }
      })
    }

    // puts project nodes in a circle with radius 200-300 around center
    // based on https://bl.ocks.org/davidcdupuis/3f9db940e27e07961fdbaba9f20c79ec
    function concentricCircles() {
      var cx = width/2;
      var cy = height/2;
      var small_r = 200;
      var big_r = 300;
      _.each(data.nodes, function(n) {
        var strength = 3;
        var distX = n.x - cx;
        var distY = n.y - cy;
        var dist = Math.sqrt(Math.pow(distX,2)+ Math.pow(distY,2));
        if (n.type === "project") {
          if ( (Math.pow(n.x-cx,2) + Math.pow(n.y-cy,2)) <= Math.pow(small_r,2) ){
            // point is inside small circle
            n.x = cx + distX / dist * small_r;
            n.y = cy + distY / dist * small_r;
          } else if ( (Math.pow(n.x-cx, 2) + Math.pow(n.y-cy, 2)) > Math.pow(big_r,2) ){
            // point is outside big circle
            n.x = cx + distX / dist * big_r;
            n.y = cy + distY / dist * big_r;
          }
        }
      });
    }

    var simulation = d3.forceSimulation().nodes(data.nodes)
      .force("charge", d3.forceManyBody().strength(-2000))
      .force("concentric", concentricCircles)
      .force("links", linkForce)
      .force("collide", rectCollide)
      .force("box_force", boxForce);

    var link = svg.selectAll(".link")
      .data(data.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("opacity", 1)
      .style("stroke-width", 0.05)

    var node = svg.selectAll(".node")
      .data(data.nodes)
      .enter()
      .append("svg:a").attr("target", "_blank").attr("xlink:href", function(d){
        return d.href
      })
      .append("text")
      .text( function(d){return d.text})
      .attr("class", function(d){return "node " + d.type})
      .style("fill", "#000000")
      .style("opacity", nodeOpacity)
      .style("font-size", nodeFontSize)
      .style("text-anchor", "middle")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.each(function(d, i){
      data.nodes[i].width = this.getBoundingClientRect().width;
      data.nodes[i].height = this.getBoundingClientRect().height;
      // fix center node
      if (data.nodes[i].id === "center") {
        d.fx = width/2;
        d.fy = height/2;
      }
    });

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    var tickActions = function() {
      // moves nodes and links on every tick
      node
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    }

    simulation.on("tick", tickActions);

    node.on("mouseover", function(d) {
      if (d.href) {
        node.style("fill", function(n) {
          if (d === n) {
            return "#0000ff";
          }
        });
        node.attr("class", function(n) {
          if (d === n) {
            return "node hover " + n.type;
          } else {
            return "node " + n.type;
          }
        });
      }
      if (d.explanation) {
        $("#explanation").html(d.explanation).css("opacity", 0.5);
      }
      link.style("stroke-width", function(l) {
        if (d === l.source || d === l.target) {
          return 0.5;
        } else {
          return 0.05;
        }
      });
      return node.style("opacity", function(n) {
        if (d === n) {
          return 1;
        }
        if (_.find(data.links, function(l) {
          return (d === l.source && n === l.target) || (n === l.source && d === l.target);
        })) {
          return 1;
        } else {
          return 0.1;
        }
      });
    });

    function updateNodeOpacity() {
      return node.style("opacity", function(n) {
        return nodeOpacity(n);
      });
    };

    node.on("mouseout", function(d) {
      link.style("stroke-width", 0.05);
      updateNodeOpacity();
      $("#explanation").css("opacity", 0);
      node.style("fill", "#000000");
      return node.attr("class", function(n) {
        return "node " + n.type;
      });
    });

    var categoryOff = function() {
      App.category = null;
      $(".category").css("color", "black");
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

  })
});
