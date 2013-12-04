

collide = (graph) ->
  quadtree = d3.geom.quadtree(graph.nodes)
  (d) ->
    that = this
    h = this.getBBox().height/2
    w = this.getBBox().width/4

    console.log this.getBBox()
    nx1 = d.x - w
    nx2 = d.x + w
    ny1 = d.y - h
    ny2 = d.y + h

    quadtree.visit (quad, x1, y1, x2, y2) ->
      if quad.point and (quad.point isnt d)


        x = quad.point.x - d.x
        y = quad.point.y - d.y
        ry = h + quad.point.ry
        rx = w + quad.point.rx
        if Math.abs(x) < rx and Math.abs(y) < ry
          l = Math.sqrt(x * x + y * y)
          l = (l - rx) / rx * .5
          d.x += x *= l
          d.y += y *= l
          quad.point.x += x
          quad.point.y += y

          # that.setAttribute("transform", "translate(" + 0 + "," + 5 + ")");

      x1 > nx2 or x2 < nx1 or y1 > ny2 or y2 < ny1

nodeOpacity = (n) ->
  if n.type == "center"
    1
  else if n.type == "project"
    0.6
  else if n.type == "subject"
    0.13
  else
    0.2

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
    "#{n.size}px"
  else if n.type == "url"
    "10px"
  else if n.type == "book"
    "10px"
  else
    "15px"

$ ->
  App = {}
  App.category = null

  width = $(window).width()
  height = $(window).height()

  parseData = (data) ->
    _.each data.links, (l) ->
      l.source = _.findWhere(data.nodes, {id: l.source})
      l.target = _.findWhere(data.nodes, {id: l.target})

    _.each data.nodes, (n) ->
      switch n.type
        when "center"
          n.fixed = true
          n.x = width/2
          n.y = height/2
          n.rx = 70
          n.ry = 20
        # when "project"
        #   n.rx = 50
        #   n.ry = 20
        # when "essay"
        #   n.rx = 50
        #   n.ry = 15
        else
          n.rx = 30
          n.ry = 10

    data

  viz = d3.select("body").append("svg").attr("width", width).attr("height", height)


  d3.json "data.json", (data) ->
    graph = parseData(data)

    tick = (e) ->

      node
        .attr("x", (d) -> d.x)
        .attr("y", (d) -> d.y)
        # .each(collide(graph))



      link.attr("x1", (d) -> d.source.x).attr("y1", (d) ->
        d.source.y
      ).attr("x2", (d) ->
        d.target.x
      ).attr "y2", (d) ->
        d.target.y

    force = d3.layout.force()
      .size([width, height])
      .gravity(0.3)
      .nodes(graph.nodes)
      .links(graph.links)
      .charge(-1800)
      # .charge( (d) ->
      #   if d.type == "center"
      #     return -3000
      #   else
      #     return -1800
      # )
      .linkStrength( (d) ->
        strength = 0.1

        if d.source.group && d.target.group
          if d.source.group == d.target.group
            strength = 1.3
          else
            strength = 0.01

        strength
      )
      .on("tick", tick)
      .start()

    link = viz.selectAll(".link")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .style("opacity", 1)
      .style("stroke-width", 0.05)

    node = viz.selectAll(".node")
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
      return if App.category
      link.style "stroke-width", (l) ->
        if d is l.source or d is l.target
          0.5
        else
          0.05
        # else
        #   0.2

      node.style "opacity", (n) ->
        return 1 if d is n
        if _.find(graph.links, (l) ->
          (d is l.source and n is l.target) or (n is l.source and d is l.target)
        )
          1
        else
          nodeOpacity(n)

    node.on "mouseout", (d) ->
      return if App.category
      link.style "stroke-width", 0.05
      node.style "opacity", nodeOpacity

    categoryOff = ->
      App.category = null
      $('.category').css('color', 'black')
      node.style "opacity", (n) ->
        nodeOpacity(n)

    categoryOn = ->
      $('.category[data='+App.category+']').css('color', 'purple')
      node.style "opacity", (n) ->
        if n.type == App.category
          1
        else
          0.1

    $('.category').click ->
      category = $(this).attr('data')
      if App.category == category
        categoryOff()
      else
        categoryOff()
        App.category = category
        categoryOn()
