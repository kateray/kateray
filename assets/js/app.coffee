App = {}
App.category = null

nodeOpacity = (n) ->
  if App.category
    if App.category == n.type
      1
    else
      0.1
  else
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
  switch n.type
    when "center"
      "60px"
    when "subject"
      "16px"
    when "essay"
      "15px"
    when "idea"
      "15px"
    when "project"
      "#{n.size}px"
    else
      "10px"

$ ->
  width = $(window).width()
  height = $(window).height()

  parseData = (data) ->
    _.each data.links, (l) ->
      l.source = _.findWhere(data.nodes, {id: l.source})
      l.target = _.findWhere(data.nodes, {id: l.target})

    _.each data.nodes, (n) ->
      if n.type == "center"
        n.fixed = true
        n.x = width/2
        n.y = height/2

    data

  viz = d3.select("body").append("svg").attr("width", width).attr("height", height)


  d3.json "data.json", (data) ->
    graph = parseData(data)

    tick = (e) ->

      node
        .attr("x", (d) -> d.x)
        .attr("y", (d) -> d.y)

      link
        .attr("x1", (d) ->
          d.source.x
        ).attr("y1", (d) ->
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


    updateNodeOpacity = ->
      node.style "opacity", (n) ->
        nodeOpacity(n)

    node.on "mouseover", (d) ->
      if d.href
        $(this).attr('color', 'blue')

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
      link.style "stroke-width", 0.05
      updateNodeOpacity()


    categoryOff = ->
      App.category = null
      $('.category').css('color', 'black')
      updateNodeOpacity()

    categoryOn = ->
      $('.category[data='+App.category+']').css('color', 'purple')
      updateNodeOpacity()

    $('.category').click ->
      category = $(this).attr('data')
      if App.category == category
        categoryOff()
      else
        categoryOff()
        App.category = category
        categoryOn()
