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
        n.rx = 70
        n.ry = 20
      when "project"
        n.rx = 50
        n.ry = 20
      when "essay"
        n.rx = 50
        n.ry = 15
      else
        n.rx = 30
        n.ry = 10

  data

collide = (graph) ->
  quadtree = d3.geom.quadtree(graph.nodes)
  (d) ->

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

nodeOpacity = (n) ->
  if n.type == "center" or n.type == "project"
    1
  else if n.type == "subject"
    0.25
  else
    0.4

nodeColor = (n) ->
  if n.type == "subject"
    "#6a6a6a"
  # else if n.type == "center"
  #   "#385299"
  # else if n.id == "tytc"
  #   "#385299"
  # else if n.id == "alongside"
  #   "#385299"
  # else if n.id == "sem-doc"
  #   "#385299"
  # else if n.id == "scrollkit"
  #   "#385299"
  # else if n.id == "homepage"
  #   "#385299"
  # else if n.id == "kommons"
  #   "#385299"
  # else if n.id == "nerdcollider"
  #   "#385299"
  else
    "#000000"

nodeFontSize = (n) ->
  if n.type == "center"
    "60px"
  else if n.type == "subject"
    "16px"
  else if n.type == "project"
    "#{(n.weight*4/3 + n.year*7/3)}px"
  else if n.type == "url"
    "10px"
  else
    "15px"

$ ->
  width = 1400
  height = 1000

  force = d3.layout.force()
  force.size([width, height])
  force.gravity(0.2)

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
          return -1800
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
      .style("opacity", 0.2)
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
      .style("fill", nodeColor)
      .style("opacity", nodeOpacity)
      .style("font-size", nodeFontSize)
      .style("text-anchor", "middle")
      .call(force.drag)

    node.on "mouseover", (d) ->

      link.style "opacity", (l) ->
        if d is l.source or d is l.target
          1
        else
          0.2

      node.style "opacity", (n) ->
        return 1 if d is n
        if _.find(graph.links, (l) ->
          (d is l.source and n is l.target) or (n is l.source and d is l.target)
        )
          1
        else
          nodeOpacity(n)

    node.on "mouseout", (d) ->
      link.style "opacity", 0.2
      node.style "opacity", nodeOpacity