parseData = (data) ->
  _.each data.links, (l) ->
    l.source = _.findWhere(data.nodes, {id: l.source})
    l.target = _.findWhere(data.nodes, {id: l.target})

  _.each data.nodes, (n) ->
    switch n.type
      when "center"
        n.rx = 50
        n.ry = 30
      when "project"
        n.rx = 50
        n.ry = 30
      else
        n.rx = 30
        n.ry = 20
      # when "project" then n.radius = 30
      # when "subject" then n.radius = 30
      # when "idea" then n.radius = 30
      # when "url" then n.radius = 30
      # else n.radius = 100

  data

collide = (graph) ->
  quadtree = d3.geom.quadtree(graph.nodes)
  (d) ->
    # if d.type == "center"
    #   h = 5
    #   w = 50
    # else
    #   h = 5
    #   w = 50
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
        # console.log rx
        # console.log x
        if Math.abs(x) < rx and Math.abs(y) < ry
          l = Math.sqrt(x * x + y * y)
          l = (l - rx) / rx * .5
          d.x += x *= l
          d.y += y *= l
          quad.point.x += x
          quad.point.y += y
      x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1

cluster = (graph, width, height, alpha) ->
  center = []

  graph.nodes.forEach (d) ->
    center.push(d) if d.index < 5
    return

  return (d) ->
    node = _.findWhere(center, {group: d.group})
    # if (node == d)
    #   if d.group == 1
    #     d.x = width/2
    #     d.y = height/2
    #   return

    x = d.x - node.x
    y = d.y - node.y
    x = x
    y = y

    d.x -= x *= alpha
    d.y -= y *= alpha

$ ->
  width = 1500
  height = 1000

  color = d3.scale.category20()

  force = d3.layout.force()
  # force.gravity(.02)
  force.charge(-1500)
  force.size([width, height])

  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)


  d3.json "data.json", (data) ->
    graph = parseData(data)

    tick = (e) ->

      node
        # .each(cluster(graph, width, height, 10 * e.alpha * e.alpha))
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
        if d.source.group == d.target.group
          1.3
        else
          0.35
      )
      .on("tick", tick)
      .start()

    link = svg.selectAll(".link")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("stroke-width", "0.5")


    node = svg.selectAll(".node")
      .data(graph.nodes)
      .enter().append("text")
      .text( (d) -> d.text)
      .attr("class", (d) -> "node " + d.type)
      .style("text-anchor", "middle")
      .style("fill", (d) ->
        if d.group == 1
          return "#0091ff"
        else if d.group == 2
          return "#ff6200"
        else if d.group == 3
          return "#cc00ff"
        else if d.group == 4
          return "#44ba15"
        else if d.group == 5
          return "#1549ba"
      )
      .call(force.drag)


