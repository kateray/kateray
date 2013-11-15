parseData = (data) ->
  _.each data.links, (l) ->
    l.source = _.findWhere(data.nodes, {id: l.source})
    l.target = _.findWhere(data.nodes, {id: l.target})

  _.each data.nodes, (n) ->
    switch n.type
      when "center"
        n.fixed = true
        n.x = 700
        n.y = 500
        n.rx = 80
        n.ry = 30
      when "project"
        n.rx = 50
        n.ry = 30
      else
        n.rx = 30
        n.ry = 20

  data

collide = (graph) ->
  quadtree = d3.geom.quadtree(graph.nodes)
  (d) ->
    # if d.type == "center"
    #   console.log d
    #   return

    nx1 = d.x - d.rx
    nx2 = d.x + d.rx
    ny1 = d.y - d.ry
    ny2 = d.y + d.ry

    quadtree.visit (quad, x1, y1, x2, y2) ->
      if quad.point and (quad.point isnt d)
        x = quad.point.x - d.x
        y = quad.point.y - d.y
        ry = d.ry + quad.point.ry
        rx = d.rx + quad.point.rx
        if Math.abs(x) < rx and Math.abs(y) < ry
          l = Math.sqrt(x * x + y * y)
          l = (l - rx) / rx * .5
          d.x += x *= l
          d.y += y *= l
          quad.point.x += x
          quad.point.y += y
      x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1

$ ->
  width = $(window).width()
  height = 1000

  force = d3.layout.force()
  force.size([width, height])

  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)


  d3.json "data.json", (data) ->
    graph = parseData(data)

    tick = (e) ->

      node
        .each(collide(graph))
        .attr("x", (d) -> d.x)
        .attr("y", (d) -> d.y)

      link.attr("x1", (d) -> d.source.x).attr("y1", (d) ->
        d.source.y
      ).attr("x2", (d) ->
        d.target.x
      ).attr "y2", (d) ->
        d.target.y

    force
      .nodes(graph.nodes)
      .links(graph.links)
      .charge( (d) ->
        if d.type == "center"
          return -3000
        else
          return -1500
      )
      .linkStrength( (d) ->
        strength = 0.3

        if d.source.group && d.target.group
          if d.source.group == d.target.group
            strength = 1.3
          else
            strength = 0.1

        strength
      )
      .on("tick", tick)
      .start()

    link = svg.selectAll(".link")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke-width", (d) ->
        if d.source.type == "center" || d.target.type == "center"
          1.8
        else if d.source.type == "idea" || d.target.type == "idea"
          0.3
        else
          0.6
      )


    node = svg.selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("svg:a").attr("target", "_blank").attr("xlink:href", (d) ->
        d.href
      )
      .append("text")
      .text( (d) -> d.text)
      .attr("class", (d) -> "node " + d.type)
      .style("text-anchor", "middle")
      .call(force.drag)
