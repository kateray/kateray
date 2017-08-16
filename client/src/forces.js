function verticalOverlap(a, b, padding){
  // if a is above b, then use b's height, otherwise a's
  return (a.y > b.y) ? (b.height + padding) : (a.height + padding)
}

function horizontalOverlap(a, b, padding){
  // both centered so add widths but divide by 2
  return (a.width + b.width + padding)/2
}

function doesCollide(a, b, padding){
  var x = a.x + a.vx - b.x - b.vx,
      y = a.y + a.vy - b.y - b.vy,
      w = horizontalOverlap(a, b, padding),
      h = verticalOverlap(a, b, padding)
  return Math.abs(x) < w && Math.abs(y) < h
}

export default function createForces (data, width, height) {
  var cx = width/2;
  var cy = height/2;
  // keeps nodes from overlapping, by moving their y value
  function rectCollide() {
    var strength = 0.1;
    var padding = 2;
    for (var ii=0; ii<3; ii++){
      data.forEach( (a, i) => {
        for (var j = i + 1; j < data.length; ++j) {
          var b = data[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            ly = Math.abs(y)
          if (doesCollide(a, b, padding)) {
            var h = verticalOverlap(a, b, padding)
            var vertDistAddition = (ly - h) * (y < 0 ? -strength : strength);
            var horzDistAddition = x < 0 ? -2 : 2
            a.vy -= vertDistAddition, b.vy += vertDistAddition;
          }
        }
      })
    }
  }

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

  return {
    rectCollide: rectCollide,
    boxForce: boxForce,
    concentricCircles: concentricCircles
  }
}
