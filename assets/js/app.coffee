$ ->
  width = 960
  height = 500

  color = d3.scale.category20()

  force = d3.layout.force()
  force.charge(-120)
  force.linkDistance(30)
  force.size([width, height])

  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

  d3.json "data.json", (graph) ->
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start()

    link = svg.selectAll(".link").data(graph.links).enter().append("line").attr("class", "link").style("stroke-width", (d) ->
      Math.sqrt d.value
    )

    node = svg.selectAll(".node").data(graph.nodes).enter().append("circle").attr("class", "node").attr("r", 5).style("fill", (d) ->
      color d.group
    ).call(force.drag)

    force.on "tick", ->
      link.attr("x1", (d) ->
        d.source.x
      ).attr("y1", (d) ->
        d.source.y
      ).attr("x2", (d) ->
        d.target.x
      ).attr "y2", (d) ->
        d.target.y

      node.attr("cx", (d) ->
        d.x
      ).attr "cy", (d) ->
        d.y
