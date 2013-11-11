$ ->
  width = $(window).width()
  height = $(window).height()

  color = d3.scale.category20()

  force = d3.layout.force()
  force.charge(-800)
  force.linkDistance(100)
  force.size([width, height])

  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

  parseData = (data) ->
    _.each data.links, (l) ->
      l.source = _.findWhere(data.nodes, {id: l.source})
      l.target = _.findWhere(data.nodes, {id: l.target})
    data

  d3.json "data.json", (data) ->
    graph = parseData(data)

    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start()

    link = svg.selectAll(".link")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke-width", (d) ->
        Math.sqrt d.value
      )

    node = svg.selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("svg:a").attr("target", "_blank").attr("xlink:href", (d) ->
        d.href
      )
      .append("text")
      .text( (d) ->
        d.text
      )
      .attr("class", (d) ->
        "node " + d.type
      )
      .call(force.drag)

    force.on "tick", ->
      link.attr("x1", (d) ->
        d.source.x
      ).attr("y1", (d) ->
        d.source.y
      ).attr("x2", (d) ->
        d.target.x
      ).attr "y2", (d) ->
        d.target.y

      node.attr("x", (d) ->
        d.x
      ).attr "y", (d) ->
        d.y
